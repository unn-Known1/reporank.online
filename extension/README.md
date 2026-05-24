# RepoRank Browser Extension

View RepoRank credibility scores for any GitHub, GitLab, or npm package directly in your browser.

## Features

- **GitHub injection** — Score panel appears in GitHub repo sidebar with subscores and verdict
- **GitLab + npm support** — Auto-resolves associated GitHub repo and injects score panel
- **SPA navigation** — Detects GitHub Turbo/History API route changes, refreshes panel automatically
- **Popup** — Click the toolbar icon to search any repo by `owner/name`, view recent searches
- **Settings** — Configure API server URL, theme preference, badge toggle, auto-refresh
- **Dark mode** — Panel adapts to your system or page theme automatically
- **Keyboard shortcut** — `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac) to open the popup

## Browser Support

| Browser | Status |
|---------|--------|
| Chrome (MV3) | ✅ Supported |
| Firefox (MV2) | ✅ Supported |
| Edge | ✅ Via Chrome build |
| Safari | ⚠ Requires Xcode build (see below) |

## Installation

### Chrome Web Store

[Install from Chrome Web Store](#) (coming soon)

### Firefox Add-ons

[Install from Firefox Add-ons](#) (coming soon)

### Manual (Development)

```bash
# Clone the repo
git clone git@github.com:unn-Known1/RepoRank.git
cd RepoRank/apps/extension

# Install dependencies
pnpm install

# Build for your target
pnpm build:chrome   # Chrome / Edge
pnpm build:firefox  # Firefox

# Load unpacked extension
# Chrome: chrome://extensions → Load unpacked → select build/chrome-mv3-prod/
# Firefox: about:debugging#/runtime/this-firefox → Load Temporary Add-on → select build/firefox-mv2-prod/
```

## Development

```bash
pnpm dev     # Chrome hot-reload
pnpm dev --target=firefox-mv2  # Firefox hot-reload
```

### Safari Build

```bash
pnpm build:safari
xcrun safari-web-extension-converter --bundle-identifier com.reporank.extension --force ./build/safari-mv3-prod/
```

Open the generated Xcode project, configure your team signing, and run.

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `PLASMO_PUBLIC_API_URL` | Yes | RepoRank API base URL (default: `https://reporank.online`) |

Set in `.env.chrome`, `.env.firefox` etc.

## Project Structure

```
apps/extension/src/
├── background/        # Service worker + badge updater
├── components/        # Reusable UI components
├── contents/          # Content scripts (github, gitlab, npm)
├── lib/               # Shared utilities
│   ├── resolvers/     # Platform repo resolvers (gitlab, npm)
├── popup.tsx          # Browser action popup
├── options.tsx        # Settings page
└── assets/            # Icons
```

## Testing

```bash
pnpm test:unit    # Vitest unit tests
```

## License

MIT
