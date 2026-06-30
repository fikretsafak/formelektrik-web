#!/usr/bin/env bash
# ============================================================
# Form Elektrik Web — VDS Güncelleme Script'i
# ============================================================
# Kullanım:
#   sudo bash update.sh                  # git pull + npm + restart
#   sudo bash update.sh --no-pull        # sadece yerel dosyaları kullan
#   sudo bash update.sh --branch main    # belirli bir branch'i çek
#   sudo bash update.sh --skip-deps      # npm install atla
#   sudo bash update.sh --skip-migrate   # db init atla
#   sudo bash update.sh --backup         # önce DB yedeği al
#   sudo bash update.sh --rollback       # son yedekten geri yükle
#
# Bu script:
#   1. (Opsiyonel) Veritabanı yedeği alır
#   2. git pull yapar (varsa)
#   3. Bağımlılıkları günceller (package-lock.json değişmişse)
#   4. Yeni dosyaları /opt/formelektrik-web'e kopyalar (data + uploads korunur)
#   5. DB şemasını günceller (idempotent — INSERT/CREATE IF NOT EXISTS)
#   6. systemd service'i yeniden başlatır
#   7. Sağlık kontrolü yapar
# ============================================================

set -euo pipefail

# Renkler
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${BLUE}▶${NC} $1"; }
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
err()  { echo -e "${RED}✗${NC} $1" >&2; }

# Root kontrolü
if [[ $EUID -ne 0 ]]; then
   err "Bu script root olarak çalıştırılmalı. 'sudo bash update.sh' kullanın."
   exit 1
fi

INSTALL_DIR="/opt/formelektrik-web"
SERVICE_USER="formelektrik"
SERVICE_NAME="formelektrik-web"
BACKUP_DIR="$INSTALL_DIR/data/backups"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Argüman parser
DO_PULL=1
DO_DEPS=1
DO_MIGRATE=1
DO_BACKUP=0
DO_ROLLBACK=0
GIT_BRANCH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-pull)      DO_PULL=0; shift ;;
    --skip-deps)    DO_DEPS=0; shift ;;
    --skip-migrate) DO_MIGRATE=0; shift ;;
    --backup)       DO_BACKUP=1; shift ;;
    --rollback)     DO_ROLLBACK=1; shift ;;
    --branch)       GIT_BRANCH="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,25p' "$0" | sed 's/^# *//'
      exit 0 ;;
    *) err "Bilinmeyen argüman: $1"; exit 1 ;;
  esac
done

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Form Elektrik Web — Güncelleme"
echo "  Hedef: $INSTALL_DIR"
echo "  Kaynak: $SOURCE_DIR"
echo "════════════════════════════════════════════════════════"
echo ""

# ============ Rollback modu ============
if [[ $DO_ROLLBACK -eq 1 ]]; then
    log "Son yedek aranıyor..."
    LAST_BACKUP=$(ls -1t "$BACKUP_DIR"/formelektrik-*.db 2>/dev/null | head -1 || echo "")
    if [[ -z "$LAST_BACKUP" ]]; then
        err "Yedek bulunamadı: $BACKUP_DIR"
        exit 1
    fi
    log "Bulunan yedek: $LAST_BACKUP"
    read -p "Bu yedekten geri yüklensin mi? Mevcut DB kaybolacak [y/N]: " yn
    [[ ! "$yn" =~ ^[Yy]$ ]] && { warn "İptal edildi"; exit 0; }

    systemctl stop "$SERVICE_NAME"
    cp -p "$INSTALL_DIR/data/formelektrik.db" "$INSTALL_DIR/data/formelektrik.db.before-rollback.$(date +%s)"
    cp -p "$LAST_BACKUP" "$INSTALL_DIR/data/formelektrik.db"
    chown "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/data/formelektrik.db"
    systemctl start "$SERVICE_NAME"
    ok "Rollback tamam. Service yeniden başlatıldı."
    exit 0
fi

# ============ 1. Backup ============
backup_db() {
    if [[ ! -f "$INSTALL_DIR/data/formelektrik.db" ]]; then
        warn "DB dosyası yok, yedek atlanıyor"
        return
    fi
    mkdir -p "$BACKUP_DIR"
    local stamp=$(date +%Y%m%d-%H%M%S)
    local bk="$BACKUP_DIR/formelektrik-$stamp.db"
    # SQLite WAL modunda olduğu için .backup komutu en güvenlisi
    if command -v sqlite3 &>/dev/null; then
        sqlite3 "$INSTALL_DIR/data/formelektrik.db" ".backup '$bk'"
    else
        cp -p "$INSTALL_DIR/data/formelektrik.db" "$bk"
    fi
    chown "$SERVICE_USER:$SERVICE_USER" "$bk"
    ok "Yedek alındı: $bk"

    # Son 10 yedeği tut, eskileri sil
    ls -1t "$BACKUP_DIR"/formelektrik-*.db 2>/dev/null | tail -n +11 | xargs -r rm -f
}

if [[ $DO_BACKUP -eq 1 ]]; then
    log "DB yedeği alınıyor..."
    backup_db
fi

# ============ 2. Git pull ============
if [[ $DO_PULL -eq 1 && -d "$SOURCE_DIR/.git" ]]; then
    log "Git deposundan güncelleniyor..."
    cd "$SOURCE_DIR"

    # Local değişiklik kontrolü
    if ! git diff --quiet || ! git diff --cached --quiet; then
        warn "Yerel değişiklikler var, stash'leniyor..."
        git stash push -m "update.sh auto-stash $(date +%Y%m%d-%H%M%S)" || true
    fi

    git fetch --all --prune
    if [[ -n "$GIT_BRANCH" ]]; then
        git checkout "$GIT_BRANCH"
        git pull --ff-only origin "$GIT_BRANCH"
    else
        git pull --ff-only
    fi
    NEW_COMMIT=$(git rev-parse --short HEAD)
    ok "Güncel commit: $NEW_COMMIT"
elif [[ $DO_PULL -eq 1 ]]; then
    warn "Git deposu bulunamadı ($SOURCE_DIR/.git yok), pull atlanıyor"
fi

# ============ 3. Dosyaları senkronize et ============
log "Dosyalar $INSTALL_DIR konumuna senkronize ediliyor..."

# data, uploads, .env, node_modules KORUNUR
# .env yoksa örnekten kopyala
if [[ ! -f "$INSTALL_DIR/.env" && -f "$SOURCE_DIR/.env.example" ]]; then
    cp "$SOURCE_DIR/.env.example" "$INSTALL_DIR/.env"
    JWT_SECRET=$(openssl rand -hex 48)
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$INSTALL_DIR/.env"
    warn ".env yoktu, örnekten oluşturuldu — düzenleyin: nano $INSTALL_DIR/.env"
fi

rsync -a --delete \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.env' \
    --exclude='data/' \
    --exclude='uploads/' \
    --exclude='*.db' \
    --exclude='*.db-journal' \
    --exclude='*.db-wal' \
    --exclude='*.db-shm' \
    "$SOURCE_DIR/" "$INSTALL_DIR/"

chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
chmod 600 "$INSTALL_DIR/.env"
ok "Dosyalar senkronize edildi"

# ============ 4. Bağımlılıklar ============
if [[ $DO_DEPS -eq 1 ]]; then
    cd "$INSTALL_DIR"
    # package-lock.json değişti mi?
    if [[ -f "package-lock.json" ]]; then
        log "Bağımlılıklar kontrol ediliyor (npm ci)..."
        sudo -u "$SERVICE_USER" npm ci --omit=dev --silent 2>&1 | tail -3
    else
        log "Bağımlılıklar kontrol ediliyor (npm install)..."
        sudo -u "$SERVICE_USER" npm install --omit=dev --silent
    fi
    ok "Bağımlılıklar güncel"
fi

# ============ 5. DB migration / şema güncelleme ============
if [[ $DO_MIGRATE -eq 1 ]]; then
    log "Veritabanı şeması kontrol ediliyor..."
    # init.js idempotent — CREATE TABLE IF NOT EXISTS + INSERT OR IGNORE
    # Yeni tablolar / index'ler otomatik eklenir, mevcut veriye dokunmaz
    sudo -u "$SERVICE_USER" node "$INSTALL_DIR/server/db/init.js" 2>&1 | grep -v "^$" | tail -10 || true
    ok "Şema güncellendi"
fi

# ============ 6. Restart ============
log "Service yeniden başlatılıyor..."
systemctl restart "$SERVICE_NAME"

# Sağlık kontrolü
log "Sağlık kontrolü..."
sleep 3
for i in {1..10}; do
    if curl -sf http://127.0.0.1:3000/api/health > /dev/null 2>&1; then
        ok "Service sağlıklı (deneme $i)"
        break
    fi
    if [[ $i -eq 10 ]]; then
        err "Service sağlık kontrolünden geçemedi"
        echo ""
        warn "Son log satırları:"
        journalctl -u "$SERVICE_NAME" -n 30 --no-pager
        echo ""
        warn "Geri almak için: sudo bash $0 --rollback"
        exit 1
    fi
    sleep 1
done

# ============ 7. nginx config kontrol ============
log "nginx config kontrol ediliyor..."

CONFIG_CHANGED=0
for conf_file in "$INSTALL_DIR"/infra/nginx/*.conf; do
    [[ -f "$conf_file" ]] || continue
    target_name=$(basename "$conf_file" .conf)
    target_path="/etc/nginx/sites-available/$target_name"
    if [[ -f "$target_path" ]] && ! cmp -s "$conf_file" "$target_path"; then
        warn "nginx config değişmiş: $target_name"
        cp "$conf_file" "$target_path"
        CONFIG_CHANGED=1
    elif [[ ! -f "$target_path" ]]; then
        log "Yeni nginx config eklendi: $target_name (manuel etkinleştirin: ln -s)"
    fi
done

if [[ $CONFIG_CHANGED -eq 1 ]]; then
    if nginx -t 2>/dev/null; then
        systemctl reload nginx
        ok "nginx yeniden yüklendi"
    else
        err "nginx config testi başarısız — manuel kontrol edin: sudo nginx -t"
    fi
fi

# ============ 8. Özet ============
echo ""
echo "════════════════════════════════════════════════════════"
ok "Güncelleme tamamlandı"
echo "════════════════════════════════════════════════════════"

if [[ $DO_PULL -eq 1 && -d "$SOURCE_DIR/.git" ]]; then
    cd "$SOURCE_DIR"
    echo "📌 Güncel commit: $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"
fi

echo ""
echo "📋 Yararlı komutlar:"
echo "   sudo systemctl status $SERVICE_NAME"
echo "   sudo journalctl -u $SERVICE_NAME -f"
echo "   sudo bash $0 --backup       # önce yedek alarak güncelle"
echo "   sudo bash $0 --rollback     # son yedekten geri yükle"
echo ""
