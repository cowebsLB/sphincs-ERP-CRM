# Branding Assets

## Source Of Truth

All logo files are stored in:

- `assets/branding/`

## Current Brand Files

- `assets/branding/favicon.ico`
- `assets/branding/favicon-16x16.png`
- `assets/branding/favicon-32x32.png`
- `assets/branding/apple-touch-icon.png`
- `assets/branding/android-chrome-192x192.png`
- `assets/branding/android-chrome-512x512.png`
- `assets/branding/site.webmanifest`

## Delivery Convention

- Source-of-truth files stay in `assets/branding/`.
- Frontend apps consume these through Vite `publicDir` pointing to `../../assets`.
- URLs used in both web apps:
  - `/branding/favicon.ico`
  - `/branding/favicon-32x32.png`
  - `/branding/favicon-16x16.png`
  - `/branding/apple-touch-icon.png`
  - `/branding/site.webmanifest`

## Intended Usage

- `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`: browser tab and bookmarks
- `apple-touch-icon.png`: iOS pinned/home-screen icon
- `android-chrome-*`: Android/PWA icon references
- `site.webmanifest`: web app metadata and icon map
