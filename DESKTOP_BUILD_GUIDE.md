# Desktop Build Guide - Voice Intelligence App

Dieses Dokument beschreibt, wie Sie Production-Builds für macOS, Windows und Linux erstellen.

## Voraussetzungen

### Alle Plattformen
- **Node.js**: v18 oder höher
- **pnpm**: v10 oder höher
- **Rust**: Installieren Sie Rust von https://rustup.rs/

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### macOS
- **Xcode Command Line Tools**:
  ```bash
  xcode-select --install
  ```

### Windows
- **Visual Studio Build Tools 2022** oder **Visual Studio 2022**
- **WebView2 Runtime** (wird automatisch installiert)

### Linux
- **GTK 3.0** Entwicklungsbibliotheken:
  ```bash
  # Ubuntu/Debian
  sudo apt-get install libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf

  # Fedora
  sudo dnf install gtk3-devel webkit2gtk4.0-devel libappindicator-gtk3-devel librsvg2-devel

  # Arch
  sudo pacman -S gtk3 webkit2gtk libappindicator-gtk3 librsvg
  ```

## Installation

```bash
# Installiere Dependencies
pnpm install

# Installiere Tauri CLI
pnpm add -D @tauri-apps/cli
```

## Build-Prozess

### 1. Vorbereitung

```bash
# Stelle sicher, dass der Frontend-Build aktuell ist
pnpm build

# Überprüfe die Tauri-Konfiguration
cat tauri.conf.json
```

### 2. Development Build (für Testing)

```bash
# Starte die App im Development-Modus
pnpm tauri dev
```

### 3. Production Build

```bash
# Erstelle Production-Builds für alle Plattformen
source $HOME/.cargo/env  # Nur auf macOS/Linux
pnpm tauri build

# Oder für spezifische Plattformen:
# macOS
pnpm tauri build -- --target universal-apple-darwin

# Windows
pnpm tauri build -- --target x86_64-pc-windows-msvc

# Linux
pnpm tauri build -- --target x86_64-unknown-linux-gnu
```

## Build-Ausgaben

Die Builds werden in `src-tauri/target/release/bundle/` erstellt:

### macOS
- **DMG Installer**: `src-tauri/target/release/bundle/dmg/Voice Intelligence_1.0.0_universal.dmg`
- **App Bundle**: `src-tauri/target/release/bundle/macos/Voice Intelligence.app`

### Windows
- **MSI Installer**: `src-tauri/target/release/bundle/msi/Voice Intelligence_1.0.0_x64_en-US.msi`
- **Executable**: `src-tauri/target/release/Voice Intelligence.exe`

### Linux
- **AppImage**: `src-tauri/target/release/bundle/appimage/voice-intelligence_1.0.0_amd64.AppImage`
- **DEB Package**: `src-tauri/target/release/bundle/deb/voice-intelligence_1.0.0_amd64.deb`

## Code-Signing (Optional)

### macOS Code-Signing

```bash
# Exportiere Zertifikat
security find-identity -v -p codesigning

# Setze Umgebungsvariablen
export APPLE_CERTIFICATE="<certificate-path>"
export APPLE_CERTIFICATE_PASSWORD="<password>"
export APPLE_SIGNING_IDENTITY="<identity>"

# Erstelle signiertes Build
pnpm tauri build
```

### Windows Code-Signing

```bash
# Setze Umgebungsvariablen
export WINDOWS_SIGN_TOOL="<signtool-path>"
export WINDOWS_CERTIFICATE_PATH="<cert-path>"
export WINDOWS_CERTIFICATE_PASSWORD="<password>"

# Erstelle signiertes Build
pnpm tauri build
```

## Auto-Update Setup

Die App ist für Auto-Updates vorbereitet. Um diese zu aktivieren:

1. Hoste die Releases auf einem Server
2. Konfiguriere die Update-URL in `tauri.conf.json`:

```json
{
  "updater": {
    "active": true,
    "endpoints": ["https://your-domain.com/releases/latest.json"],
    "dialog": true,
    "pubkey": "<public-key>"
  }
}
```

## Troubleshooting

### Build schlägt fehl mit "No such file or directory"
- Stelle sicher, dass `pnpm build` erfolgreich ausgeführt wurde
- Überprüfe, dass `dist/public/` existiert und `index.html` enthält

### Rust-Fehler
```bash
# Aktualisiere Rust
rustup update

# Installiere fehlende Komponenten
rustup target add x86_64-unknown-linux-gnu  # Linux
rustup target add x86_64-pc-windows-msvc    # Windows
rustup target add aarch64-apple-darwin      # macOS ARM
```

### macOS Notarization
```bash
# Notarisiere die App für macOS Gatekeeper
xcrun notarytool submit <app-path> \
  --apple-id <apple-id> \
  --password <password> \
  --team-id <team-id>
```

## Performance-Optimierungen

Das Projekt ist bereits mit folgenden Optimierungen konfiguriert:

- **Code-Splitting**: Vendor-Chunks sind aufgeteilt für paralleles Laden
- **Terser Minification**: JavaScript wird aggressiv minimiert
- **Tree-Shaking**: Ungenutzte Code wird entfernt
- **Lazy Loading**: Komponenten werden on-demand geladen

## Release-Checkliste

- [ ] Version in `tauri.conf.json` aktualisiert
- [ ] Version in `src-tauri/Cargo.toml` aktualisiert
- [ ] Changelog aktualisiert
- [ ] Frontend-Build erfolgreich (`pnpm build`)
- [ ] Production-Build erfolgreich (`pnpm tauri build`)
- [ ] Installer getestet auf allen Plattformen
- [ ] Code-Signing durchgeführt (falls erforderlich)
- [ ] Release auf GitHub erstellt
- [ ] Binaries hochgeladen
- [ ] Download-Links aktualisiert

## Weitere Ressourcen

- [Tauri Dokumentation](https://tauri.app/docs/)
- [Tauri Build Guide](https://tauri.app/docs/building/)
- [Tauri Bundler](https://tauri.app/docs/building/windows/)
