#!/bin/bash

# Voice Intelligence Desktop Build Script
# Erstellt Production-Builds für macOS, Windows und Linux

set -e

echo "🚀 Voice Intelligence Desktop Build Script"
echo "=========================================="

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funktionen
log_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Überprüfe Voraussetzungen
log_info "Überprüfe Voraussetzungen..."

if ! command -v node &> /dev/null; then
    log_error "Node.js nicht gefunden. Bitte installiere Node.js v18+"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    log_error "pnpm nicht gefunden. Bitte installiere pnpm"
    exit 1
fi

if ! command -v cargo &> /dev/null; then
    log_error "Rust/Cargo nicht gefunden. Bitte installiere Rust von https://rustup.rs/"
    exit 1
fi

log_info "Node.js: $(node --version)"
log_info "pnpm: $(pnpm --version)"
log_info "Rust: $(rustc --version)"

# Installiere Dependencies
log_info "Installiere Dependencies..."
pnpm install

# Erstelle Frontend-Build
log_info "Erstelle Frontend-Build..."
pnpm build

if [ ! -d "dist/public" ] || [ ! -f "dist/public/index.html" ]; then
    log_error "Frontend-Build fehlgeschlagen. dist/public/index.html existiert nicht."
    exit 1
fi

log_info "Frontend-Build erfolgreich ✓"

# Überprüfe Tauri CLI
log_info "Überprüfe Tauri CLI..."
if ! pnpm tauri --version &> /dev/null; then
    log_warn "Tauri CLI nicht gefunden. Installiere..."
    pnpm add -D @tauri-apps/cli
fi

# Bestimme Zielplattform
TARGET_PLATFORM="${1:-all}"

case "$TARGET_PLATFORM" in
    macos|darwin)
        log_info "Erstelle macOS Build..."
        source $HOME/.cargo/env
        pnpm tauri build -- --target universal-apple-darwin
        log_info "macOS Build abgeschlossen ✓"
        ;;
    windows|win)
        log_info "Erstelle Windows Build..."
        source $HOME/.cargo/env
        pnpm tauri build -- --target x86_64-pc-windows-msvc
        log_info "Windows Build abgeschlossen ✓"
        ;;
    linux)
        log_info "Erstelle Linux Build..."
        source $HOME/.cargo/env
        pnpm tauri build -- --target x86_64-unknown-linux-gnu
        log_info "Linux Build abgeschlossen ✓"
        ;;
    all)
        log_info "Erstelle Builds für alle Plattformen..."
        source $HOME/.cargo/env
        
        log_info "Erstelle macOS Build..."
        pnpm tauri build -- --target universal-apple-darwin || log_warn "macOS Build übersprungen"
        
        log_info "Erstelle Windows Build..."
        pnpm tauri build -- --target x86_64-pc-windows-msvc || log_warn "Windows Build übersprungen"
        
        log_info "Erstelle Linux Build..."
        pnpm tauri build -- --target x86_64-unknown-linux-gnu || log_warn "Linux Build übersprungen"
        
        log_info "Alle Builds abgeschlossen ✓"
        ;;
    *)
        log_error "Unbekannte Plattform: $TARGET_PLATFORM"
        echo "Verwendung: $0 [macos|windows|linux|all]"
        exit 1
        ;;
esac

# Zeige Build-Ausgaben
log_info "Build-Ausgaben:"
if [ -d "src-tauri/target/release/bundle" ]; then
    find src-tauri/target/release/bundle -type f \( -name "*.dmg" -o -name "*.msi" -o -name "*.AppImage" -o -name "*.deb" \) -exec ls -lh {} \;
fi

log_info "Desktop Build abgeschlossen! 🎉"
