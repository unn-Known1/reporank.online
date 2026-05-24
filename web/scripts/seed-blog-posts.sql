-- Run this in Supabase Dashboard → SQL Editor
-- It creates a blog category and two published blog posts.

-- 1. Create category
INSERT INTO blog_categories (name, slug, description)
VALUES ('Announcements', 'announcements', 'Product updates and announcements about RepoRank')
ON CONFLICT (slug) DO NOTHING;

-- 2. Create posts
-- Replace the author_id below with YOUR Supabase auth user ID.
-- To find your user ID: Supabase Dashboard → Authentication → Users → copy your UUID
-- Or run: SELECT id FROM auth.users LIMIT 1;
DO $$
DECLARE
  cat_id uuid;
  author_id uuid;
BEGIN
  SELECT id INTO cat_id FROM blog_categories WHERE slug = 'announcements';

  -- Get first user (change this to your specific user ID if needed)
  SELECT id INTO author_id FROM auth.users LIMIT 1;

  IF author_id IS NULL THEN
    RAISE EXCEPTION 'No user found in auth.users. Please sign in via GitHub first.';
  END IF;

  -- Post 1: Welcome
  INSERT INTO blog_posts (title, slug, body, excerpt, author_id, category_id, status, published_at, seo_meta_title, seo_meta_description)
  VALUES (
    'Welcome to RepoRank — Making Open Source Credibility Transparent',
    'welcome-to-reporank',
    'We''re excited to introduce **RepoRank** — a transparency-first platform that helps developers evaluate the credibility of open source repositories.

## Why RepoRank?

The open source ecosystem runs on trust. When choosing a library, framework, or tool, developers need to answer questions like:

- Is this project actively maintained?
- Are security issues addressed promptly?
- Is the community healthy and welcoming?
- Will this project still be here next year?

Traditional signals like star counts and fork numbers only tell part of the story. A repo can have thousands of stars but be poorly maintained, while a lesser-known project might be more reliable.

## The RepoRank Score

Our scoring system evaluates repositories across **five dimensions**:

- **Activity** — Commit frequency, release cadence, issue/PR response times
- **Community** — Contributor diversity, review quality, governance
- **Maintenance** — Documentation quality, CI/CD practices, dependency hygiene
- **Popularity** — Stars, forks, downloads, ecosystem adoption
- **Safety** — Security policy, vulnerability handling, license clarity

Each dimension is weighted and combined into a single **0–100 credibility score**.

## AI Analysis

For repos with no human reviews yet, our AI provides an analysis baseline. AI analysis always includes a disclaimer, and we encourage human reviews to complement it.

## Human Reviews

Registered users can submit reviews with ratings across the five dimensions. The community votes on review helpfulness, so the most useful reviews rise to the top.

## Open Data, Transparent Scoring

All scoring logic is open source. Metrics are sourced from public GitHub data, and we provide evidence links for every data point. What you see is what you get — no black boxes.

## What''s Next?

We''re launching with MVP features: repo lookup, scoring, AI analysis, human reviews, and badge embeds. Stay tuned for:

- Browser extension (Chrome + Firefox)
- GitLab support
- Comparison tools
- Trending repos
- Personal dashboard and watchlists

## Get Involved

RepoRank is open source. Check us out on [GitHub](https://github.com/unn-Known1/RepoRank), contribute, and help us make open source more transparent for everyone.

Happy coding!',
    'Introducing RepoRank — a transparency-first platform for evaluating open source repository credibility. Learn how our scoring system works and what''s coming next.',
    author_id,
    cat_id,
    'published',
    NOW(),
    'Welcome to RepoRank — Open Source Credibility Platform',
    'Introducing RepoRank: a transparency-first platform that evaluates open source repository credibility across five dimensions: Activity, Community, Maintenance, Popularity, and Safety.'
  )
  ON CONFLICT (slug) DO NOTHING;

  -- Post 2: Improve your score
  INSERT INTO blog_posts (title, slug, body, excerpt, author_id, category_id, status, published_at, seo_meta_title, seo_meta_description)
  VALUES (
    '5 Ways to Improve Your GitHub Repository''s Credibility Score',
    'improve-repo-credibility-score',
    'A high RepoRank score signals to potential users and contributors that your project is trustworthy and well-maintained. Here are five actionable ways to boost your repository''s credibility score.

## 1. Maintain Consistent Release Cadence

Regular releases signal active maintenance — one of the most important credibility signals. Even small patch releases matter.

**Tip:** Use GitHub''s release workflow to tag versions with release notes. Aim for at least one release every 1–3 months. Automated release-please or semantic-release tools can help keep your cadence consistent.

## 2. Write a Clear README and Contributing Guide

A well-structured README is often a developer''s first impression of your project. It should include:

- What the project does
- Quick-start installation
- Usage examples
- API documentation
- Link to a contributing guide

A contributing guide (CONTRIBUTING.md) shows that you''ve thought about how others can help. This directly boosts your **Maintenance** and **Community** dimension scores.

## 3. Respond to Issues and PRs Promptly

Timely responses to issues and pull requests signal an active, healthy community. Even a "we''ll look into this" within 48 hours goes a long way.

Key signals our scoring tracks:

- Time to first response on issues
- PR review turnaround time
- Percentage of issues closed
- Whether PRs receive meaningful code review

## 4. Add a Security Policy

A SECURITY.md file tells users how to responsibly report vulnerabilities. This is a significant signal for the **Safety** dimension.

At minimum, your security policy should include:

- Where to report vulnerabilities (email, private issue tracker, etc.)
- Expected response time
- Whether you support responsible disclosure

## 5. Keep Dependencies Updated

Outdated dependencies are both a credibility risk and a security risk. Regularly updating dependencies shows you care about the long-term health of your project.

**Tip:** Enable Dependabot or Renovate to automate dependency updates. Configure CI to fail on known vulnerabilities using tools like `npm audit`, `pip-audit`, or GitHub''s Dependabot alerts.

## Bonus: Use Standard Project Conventions

Adopting conventional commits, having a code of conduct, using issue templates, and maintaining a changelog all contribute to a professional, credible open source presence. These small touches add up significantly in the scoring model.

---

Start with these five steps, and you''ll see your RepoRank credibility score improve over time as our scoring engine picks up the positive changes in your repository''s metrics.',
    'Five practical ways to boost your GitHub repository''s RepoRank credibility score, from consistent releases to security policies and dependency management.',
    author_id,
    cat_id,
    'published',
    NOW(),
    '5 Ways to Improve Your GitHub Repository''s Credibility Score | RepoRank',
    'Learn five actionable strategies to boost your GitHub repository''s RepoRank credibility score: release cadence, README quality, issue response time, security policies, and dependency management.'
  )
  ON CONFLICT (slug) DO NOTHING;

  RAISE NOTICE 'Blog posts created successfully! Author ID: %', author_id;
END $$;
