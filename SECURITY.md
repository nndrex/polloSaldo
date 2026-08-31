# Security Policy

## Supported version

Only the `main` branch is supported. The deployed site always reflects the tip
of `main`.

## Reporting a vulnerability

Use **GitHub private vulnerability reporting** (Security tab → Report a
vulnerability) instead of a public issue. You should get a response within a
few days.

## Scope notes

- This is a fully static site (GitHub Pages) with no backend, no auth, and no
  user data storage. There are no secrets in this repository — the daily
  scraper only reads public menu pages and commits the result to
  `data/prices.json`.
- If you find a security issue in the repository settings or workflows
  (e.g. an Actions privilege problem), report it the same way.
