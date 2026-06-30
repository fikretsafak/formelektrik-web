#!/usr/bin/env bash
# ============================================================
# Form Elektrik Web — VDS Kurulum Script'i
# ============================================================
# Test edildi: Ubuntu 22.04/24.04, Debian 12
#
# Kullanım:
#   sudo bash install.sh
#
# Bu script şunları yapar:
#   1. Node.js 20 LTS kurar (yoksa)
#   2. nginx kurar (yoksa) ve config dosyalarını yerleştirir
#   3. certbot kurar
#   4. 'formelektrik' user'ı oluşturur (yoksa)
#   5. Projeyi /opt/formelektrik-web içine kopyalar
#   6. npm install + db init çalıştırır
#   7. systemd service kaydeder ve başlatır
#   8. Let's Encrypt sertifikası alır (opsiyonel)
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
   err "Bu script root olarak çalıştırılmalı. Lütfen 'sudo bash install.sh' kullanın."
   exit 1
fi

INSTALL_DIR="/opt/formelektrik-web"
SERVICE_USER="formelektrik"
DOMAIN="${FORMELEKTRIK_DOMAIN:-formelektrik.com}"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# SERVICE_USER home'suz (--no-create-home) oluşturuluyor; npm/node cache
# için yazılabilir HOME + cache dizini şart, yoksa "EACCES /home/..." patlar.
# Tüm sudo -u çağrılarında bu env üzerinden çalıştır.
run_as_service() {
    sudo -u "$SERVICE_USER" env \
        HOME="$INSTALL_DIR" \
        npm_config_cache="$INSTALL_DIR/.npm-cache" \
        "$@"
}

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Form Elektrik Web — Kurulum"
echo "  Domain:  $DOMAIN"
echo "  Hedef:   $INSTALL_DIR"
echo "  Kaynak:  $SOURCE_DIR"
echo "════════════════════════════════════════════════════════"
echo ""

# ============ 1. Sistem güncellemesi + temel paketler ============
log "Sistem paketleri güncelleniyor..."
apt-get update -qq
apt-get install -y -qq curl gnupg ca-certificates lsb-release git rsync ufw

# ============ 2. Node.js 20 ============
if ! command -v node &>/dev/null || [[ $(node -v | sed 's/v\([0-9]*\).*/\1/') -lt 20 ]]; then
    log "Node.js 20 LTS kuruluyor..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
    ok "Node.js $(node -v) kuruldu"
else
    ok "Node.js zaten kurulu: $(node -v)"
fi

# ============ 3. nginx ============
if ! command -v nginx &>/dev/null; then
    log "nginx kuruluyor..."
    apt-get install -y -qq nginx
    ok "nginx kuruldu"
else
    ok "nginx zaten kurulu"
fi

# ============ 4. certbot ============
if ! command -v certbot &>/dev/null; then
    log "certbot kuruluyor..."
    apt-get install -y -qq certbot python3-certbot-nginx
    ok "certbot kuruldu"
fi

# ============ 5. Service user ============
if ! id -u "$SERVICE_USER" &>/dev/null; then
    log "Sistem kullanıcısı oluşturuluyor: $SERVICE_USER"
    useradd --system --no-create-home --shell /usr/sbin/nologin "$SERVICE_USER"
    ok "User '$SERVICE_USER' oluşturuldu"
fi

# ============ 6. Proje dosyalarını yerleştir ============
log "Proje dosyaları $INSTALL_DIR konumuna kopyalanıyor..."
mkdir -p "$INSTALL_DIR"

# rsync — node_modules, data, uploads, .git hariç (ilk kurulumda)
rsync -a --delete \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.env' \
    --exclude='data/' \
    --exclude='uploads/*' \
    --exclude='*.db' \
    "$SOURCE_DIR/" "$INSTALL_DIR/"

# data ve uploads dizinlerini koru
mkdir -p "$INSTALL_DIR/data" "$INSTALL_DIR/uploads"

# .env yoksa örnekten kopyala
if [[ ! -f "$INSTALL_DIR/.env" ]]; then
    cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
    # Rastgele JWT secret üret
    JWT_SECRET=$(openssl rand -hex 48)
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$INSTALL_DIR/.env"
    sed -i "s|NODE_ENV=.*|NODE_ENV=production|" "$INSTALL_DIR/.env"
    warn ".env dosyası örnekten kopyalandı. SMTP ve admin şifrelerini güncellemek için:"
    warn "  sudo nano $INSTALL_DIR/.env"
fi

chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
chmod 600 "$INSTALL_DIR/.env"
ok "Dosyalar yerleştirildi"

# ============ 7. npm install ============
log "Node.js bağımlılıkları kuruluyor..."
cd "$INSTALL_DIR"
run_as_service npm ci --omit=dev --silent 2>&1 | tail -5 || run_as_service npm install --omit=dev --silent
ok "Bağımlılıklar kuruldu"

# ============ 8. Veritabanı init ============
if [[ ! -f "$INSTALL_DIR/data/formelektrik.db" ]]; then
    log "Veritabanı oluşturuluyor..."
    run_as_service node "$INSTALL_DIR/server/db/init.js"
    ok "Veritabanı hazır"
else
    ok "Veritabanı zaten mevcut, atlanıyor"
fi

# ============ 9. systemd service ============
log "systemd service kaydediliyor..."
cp "$INSTALL_DIR/infra/systemd/formelektrik-web.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable formelektrik-web
systemctl restart formelektrik-web
sleep 2
if systemctl is-active --quiet formelektrik-web; then
    ok "formelektrik-web service çalışıyor"
else
    err "Service başlatılamadı. Log: journalctl -u formelektrik-web -n 50"
    exit 1
fi

# ============ 10. nginx config ============
log "nginx config dosyaları yerleştiriliyor..."
mkdir -p /var/www/letsencrypt
cp "$INSTALL_DIR/infra/nginx/$DOMAIN.conf" "/etc/nginx/sites-available/$DOMAIN" 2>/dev/null || \
    cp "$INSTALL_DIR/infra/nginx/formelektrik.com.conf" "/etc/nginx/sites-available/$DOMAIN"
ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"

# Alt domain config'leri de yerleştir (henüz aktive etme — kullanıcı kararına bırak)
for sub in grid.formelektrik.com solar.formelektrik.com; do
    if [[ -f "$INSTALL_DIR/infra/nginx/$sub.conf" ]]; then
        cp "$INSTALL_DIR/infra/nginx/$sub.conf" "/etc/nginx/sites-available/$sub"
    fi
done

# Default config'i kaldır (port 80 çakışmasın)
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx
ok "nginx config aktif"

# ============ 11. Firewall ============
if command -v ufw &>/dev/null; then
    log "Firewall (ufw) ayarlanıyor..."
    ufw allow 'Nginx Full' >/dev/null 2>&1 || true
    ufw allow ssh >/dev/null 2>&1 || true
    ok "Firewall ayarlandı (manuel etkinleştirme: 'sudo ufw enable')"
fi

# ============ 12. SSL sertifikası ============
echo ""
read -p "Şimdi Let's Encrypt SSL sertifikası alalım mı? (Domain DNS'i bu sunucuya yönlendirilmiş olmalı) [y/N]: " ssl_now
if [[ "$ssl_now" =~ ^[Yy]$ ]]; then
    log "SSL sertifikası alınıyor: $DOMAIN ve www.$DOMAIN"
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --redirect --agree-tos -m "admin@$DOMAIN" -n || \
        warn "Sertifika alınamadı. Sonradan: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

# ============ 13. Update alias kur ============
if [[ -f "$INSTALL_DIR/scripts/quick-update.sh" ]]; then
    log "Hızlı güncelleme alias'ı kuruluyor: 'formelektrik-update'"
    install -m 755 "$INSTALL_DIR/scripts/quick-update.sh" /usr/local/bin/formelektrik-update
    # Kaynak repo lokasyonunu env olarak işaretle
    if ! grep -q "FORMELEKTRIK_REPO" /etc/environment 2>/dev/null; then
        echo "FORMELEKTRIK_REPO=$SOURCE_DIR" >> /etc/environment
    fi
    ok "Artık 'sudo formelektrik-update' ile tek komutla güncelleyebilirsiniz"
fi

# ============ 14. Özet ============
echo ""
echo "════════════════════════════════════════════════════════"
ok "Kurulum tamamlandı!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📋 Komutlar:"
echo "   sudo systemctl status formelektrik-web    # durum"
echo "   sudo systemctl restart formelektrik-web   # yeniden başlat"
echo "   sudo journalctl -u formelektrik-web -f    # canlı log"
echo "   sudo nano /opt/formelektrik-web/.env      # config düzenle"
echo ""
echo "🌐 Erişim:"
echo "   https://$DOMAIN/                # ana site"
echo "   https://$DOMAIN/admin/          # admin paneli"
echo "   https://$DOMAIN/account/        # müşteri portalı"
echo ""
echo "🔐 İlk admin girişi:"
echo "   E-posta: .env içindeki DEFAULT_ADMIN_EMAIL"
echo "   Şifre:   .env içindeki DEFAULT_ADMIN_PASSWORD"
echo "   ⚠️  İLK GİRİŞTE MUTLAKA ŞİFREYİ DEĞİŞTİRİN"
echo ""
echo "🔄 Güncelleme:"
echo "   sudo formelektrik-update                  # repo'dan çek + uygula"
echo "   sudo bash $INSTALL_DIR/update.sh --backup  # yedek alarak güncelle"
echo "   sudo bash $INSTALL_DIR/update.sh --rollback # son yedekten geri yükle"
echo ""
echo "🔗 Alt modüller (grid, solar) için:"
echo "   sudo ln -s /etc/nginx/sites-available/grid.formelektrik.com /etc/nginx/sites-enabled/"
echo "   sudo certbot --nginx -d grid.formelektrik.com"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
