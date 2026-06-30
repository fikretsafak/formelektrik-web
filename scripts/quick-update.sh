#!/usr/bin/env bash
# ============================================================
# Form Elektrik Web — Hızlı Güncelleme (alias için)
# ============================================================
# Kullanım: sudo formelektrik-update
#
# Bu script kurulumdan sonra /usr/local/bin/formelektrik-update olarak
# kurulur. Repo'dan en güncel sürümü çeker ve uygular.
# ============================================================

set -e

# Repo yolu: FORMELEKTRIK_REPO öncelikli; eski kurulumlardaki ENERJIONE_REPO da
# desteklenir; ikisi de yoksa varsayılan /opt/formelektrik-web-source.
REPO_DIR="${FORMELEKTRIK_REPO:-${ENERJIONE_REPO:-/opt/formelektrik-web-source}}"

if [[ $EUID -ne 0 ]]; then
   echo "Lütfen sudo ile çalıştırın: sudo formelektrik-update"
   exit 1
fi

if [[ ! -d "$REPO_DIR/.git" ]]; then
    echo "Git deposu bulunamadı: $REPO_DIR"
    echo "İlk kurulum için: git clone https://github.com/fikretsafak/formelektrik-web $REPO_DIR"
    exit 1
fi

cd "$REPO_DIR"
echo "▶ Repository: $REPO_DIR"
echo "▶ Mevcut: $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"

git fetch --all --prune
git pull --ff-only

echo "▶ Yeni: $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"

bash "$REPO_DIR/update.sh" --no-pull "$@"
