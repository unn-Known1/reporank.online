# RepoRank — Open Source Code

> **Live site: [reporank.online](https://www.reporank.online)**

RepoRank is a **repository credibility platform** that answers "can I trust this repo?" with automated health scores, AI analysis, and human reviews — for any GitHub repository.

This repository contains the **open-source code** for the [RepoRank web app](https://www.reporank.online) and browser extensions. It is synced from the main development repo and is open for community contributions, suggestions, and discussions.

---

## Features

### Web App — [reporank.online](https://www.reporank.online)

| Feature | Description |
|---|---|
| **Deterministic Scoring** | 18 factors across 5 dimensions (Maintenance, Community, Security, Documentation, Adoption) → weighted 0–100 score |
| **AI Analysis** | Auto-generated repo analysis when no human reviews exist. Schema-enforced JSON, cross-validated against deterministic score |
| **Human Reviews** | 5-dimension star ratings (Code Quality, Docs, Maintenance, Ease of Use, Security) + free text + helpfulness voting |
| **Search** | Look up any GitHub repo by URL or `owner/repo` |
| **Dynamic Badge** | Embeddable SVG badge — `[![RepoRank](badge-url)](page-url)` |
| **Personal Dashboard** | Watchlist, score change tracking, and deltas |
| **Trending Discovery** | Browse repos by trending velocity, filter by language, sort by top rated |
| **Multi-Repo Comparison** | Select 2–5 repos, side-by-side table with scores and stats |
| **Score History** | Sparkline charts of score trends over time |
| **Custom Weights** | Adjust subscore priorities with client-side sliders |
| **Dark Mode** | System-aware + manual toggle, persisted |
| **PWA** | Service worker with network-first API caching |
| **OpenSSF Scorecard** | Security sub-score augmented with OpenSSF data |
| **FAQ** | `/faq` with expandable Q&As |

### Browser Extension (Chrome + Firefox + Safari + Edge)

Inject RepoRank scores directly into repository pages across platforms:

| Platform | What you see |
|---|---|
| **GitHub** | Score panel on every repo page |
| **GitLab** | Score panel on self-hosted and SaaS repos |
| **npm** | Score panel on package pages |
| **Bitbucket** | Score panel on repo pages |
| **Codeberg** | Score panel on repo pages |

Extension features:
- One-click score lookup without leaving the platform
- Watchlist management from the popup
- Multi-platform auto-detection
- Dark mode support
- Auth integration (sign in with GitHub for personalized features)

---

## Scoring Model

| Subscore | Weight | Key Signals |
|---|---|---|
| **Maintenance** | 30% | Last commit, commit frequency (6mo), release cadence |
| **Community** | 25% | Contributors (6mo), issue close ratio, PR merge time |
| **Security** | 20% | SECURITY.md, CI/CD, test coverage, OpenSSF Scorecard |
| **Documentation** | 15% | README quality, CONTRIBUTING.md, LICENSE |
| **Adoption** | 10% | Stars, forks, watchers, dependents |

Deterministic. Reproducible. Transparent — every score links to its evidence.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js App Router · Tailwind CSS · TypeScript |
| Scoring Engine | Pure TypeScript — 18 functions, 82+ unit tests |
| Database | Supabase Postgres |
| Auth | Supabase Auth (GitHub provider), BYOT per-user tokens |
| AI | Anthropic Claude (primary) + OpenAI-compatible fallback |
| Queue | BullMQ + Redis (optional async processing) |
| Extension | Plasmo — Chrome MV3 + Firefox + Safari + Edge |

---

## Getting Started

```sh
git clone https://github.com/unn-Known1/reporank.online.git
cd reporank.online
pnpm install
```

Set up environment variables (see `.env.example` in each app):

```sh
# apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
GITHUB_APP_TOKEN=
NEXT_PUBLIC_BASE_URL=
```

```sh
# Development
pnpm dev              # Start Next.js on http://localhost:4321

# Validation
pnpm lint             # ESLint all packages
pnpm typecheck        # TypeScript all packages
pnpm test             # All tests

# Extension development
cd apps/extension
pnpm dev              # Start Plasmo dev server
```

---

## Project Structure

```
├── web/               Next.js App Router — UI + API routes + worker
│   ├── src/app/       Pages + API routes + layout
│   ├── src/components/ React components (29+)
│   └── src/lib/       Supabase, GitHub, DB, AI, badge, queue modules
├── extension/         Plasmo browser extension
│   ├── src/contents/  Platform-specific content scripts
│   ├── src/components/ ScorePanel, Popup, etc.
│   └── src/lib/       API client, storage, detection, auth
└── api/               Fastify API (deferred to V1)
```

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

- **Issues**: [Create an issue](https://github.com/unn-Known1/reporank.online/issues/new/choose) for bugs, feature requests, or questions
- **Discussions**: Start a [discussion](https://github.com/unn-Known1/reporank.online/discussions) for ideas and suggestions
- **PRs**: Fork, branch, commit, and open a pull request

---

## License

MIT — see [LICENSE](./LICENSE)

---

## Links

- **Website**: [reporank.online](https://www.reporank.online)
- **Extension**: Chrome Web Store (coming soon) · Firefox Add-ons (coming soon)
- **Main Repo**: [unn-Known1/RepoRank](https://github.com/unn-Known1/RepoRank) (private, development)
