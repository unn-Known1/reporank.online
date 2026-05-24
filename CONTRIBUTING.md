# Contributing to RepoRank

Thank you for your interest in contributing! RepoRank is an open platform for repository credibility, and community involvement is essential to its success.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Commit Convention](#commit-convention)
- [Code Style](#code-style)
- [Testing](#testing)
- [Issue Reporting](#issue-reporting)

---

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Report unacceptable behavior by opening an issue.

---

## How to Contribute

### 1. Issues

- **Bug reports**: Include steps to reproduce, expected vs actual behavior, browser/OS info, and screenshots if applicable
- **Feature requests**: Describe the problem you're solving and the proposed solution
- **Questions**: Use the "question" template or start a discussion

Before creating an issue, search existing issues to avoid duplicates.

### 2. Discussions

Use GitHub Discussions for:
- Ideas and feature brainstorming
- Questions about usage or architecture
- Community support

### 3. Pull Requests

We welcome PRs for:
- Bug fixes
- Feature improvements
- Documentation updates
- Performance optimizations
- Test coverage improvements

---

## Development Setup

### Prerequisites

- Node.js 22+
- pnpm 9+
- Redis (optional, for async queue)

### Steps

```sh
# Clone the repo
git clone https://github.com/unn-Known1/reporank.online.git
cd reporank.online

# Install dependencies
pnpm install

# Set up environment (see .env.example in each app)
cp web/.env.example web/.env.local

# Start development server
pnpm dev
```

---

## Pull Request Guidelines

1. **Fork the repo** and create your branch from `main`
2. **Use the commit convention** described below
3. **Keep PRs focused** — one feature or fix per PR
4. **Write meaningful commit messages** — they should explain *why* a change was made
5. **Keep changes small** — large PRs are harder to review. Split major features into multiple PRs
6. **Update documentation** if your change affects public APIs, config, or workflows
7. **Add tests** for new functionality
8. **Ensure CI passes** — run `pnpm lint`, `pnpm typecheck`, and `pnpm test` locally before pushing

### PR Title Format

Use the same prefix convention as commits:

```
feat: add score comparison view
fix: correct rate limiting for unauthenticated requests
docs: update README with new badge examples
```

### PR Description Template

```markdown
## What does this PR do?

Brief description of the change.

## Related Issues

Closes #ISSUE_NUMBER

## How to Test

Steps to verify the change works.

## Screenshots (if applicable)

## Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Lint and typecheck pass
- [ ] All existing tests pass
```

---

## Commit Convention

Use prefixes for searchable history:

| Prefix | When to use |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `chore:` | Tooling, config, dependencies |
| `refactor:` | Code restructuring (no behavior change) |
| `test:` | Adding or updating tests |
| `perf:` | Performance improvement |
| `style:` | Formatting, whitespace (no logic change) |
| `sec:` | Security-related fix |

Examples:

```
feat: add language filter to trending repos
fix: handle null score in badge SVG rendering
docs: update installation instructions
chore: upgrade pnpm to v9
```

---

## Code Style

- **TypeScript** — strict mode, no `any` unless absolutely necessary
- **React** — functional components, hooks, no class components
- **CSS** — Tailwind CSS utility classes
- **Formatting** — Prettier (run on save)
- **Imports** — group by external/internal, alphabetized

The project uses shared ESLint and TypeScript configs from `packages/config/`. Run `pnpm lint` to check.

---

## Testing

- **Core engine**: Vitest unit tests in `packages/core`
- **Web integration**: Vitest integration tests in `web/`
- **Frontend**: Playwright E2E tests (see `e2e/` directory)

Run all tests:

```sh
pnpm test
```

Run specific test suites:

```sh
pnpm --filter @reporank/web test:integration
pnpm exec playwright test --config e2e/playwright.config.ts
```

All new features should include tests. Bug fixes should include a regression test.

---

## Issue Reporting

### Bug Report

When filing a bug report, include:

- **Steps to reproduce** — minimal, complete, verifiable
- **Expected behavior** — what you expected to happen
- **Actual behavior** — what actually happened
- **Environment** — OS, browser, extension version (if applicable)
- **Screenshots** — if the issue is visual

### Feature Request

When suggesting a feature:

- **Problem** — what need does this address?
- **Solution** — what does the feature look like?
- **Alternative approaches** — what else have you considered?

---

## Review Process

1. A maintainer will review your PR within a few days
2. CI must pass before merging
3. PRs to `main` require at least one approving review
4. Squash merge is preferred for clean history

---

## Getting Help

- Open an issue with the `question` label
- Start a GitHub Discussion
- Check the [FAQ](https://www.reporank.online/faq)

Thank you for contributing!
