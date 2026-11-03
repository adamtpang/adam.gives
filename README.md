# adam.gives

Personal storefront for Adam Pangelinan (Anchor Marianas LLC). It is a static, chat-style menu of paid offers and free tools, with the price and the date on the page.

Live: [https://adam.gives/](https://adam.gives/)

## Stack

- Static HTML, CSS, and JavaScript at the repo root (`index.html`, `menu.html`, and the other pages, plus `assets/` and `shots/`)
- Node.js built-in test runner (`tests/site.test.mjs`)
- `scripts/build.mjs`, which copies the public HTML, text, XML, images, `assets/`, and `shots/` into `public/`
- Vercel (`vercel.json`): clean URLs, no trailing slash, output directory `public/`

## Local setup

The install, test, and build steps use Node.js. There is no separate dev-server script.

```bash
npm ci
npm test
npm run build
```

`npm run build` writes the deployable site to `public/` (gitignored). Open those files with any static file server; the pages reference assets from the site root (`/assets/...`).

`scripts/browser-check.mjs` is a separate local browser check and is not part of `npm run build`.

## Scripts

- `npm run lint` — syntax-check `tests/site.test.mjs` (`node --check`)
- `npm test` — run `tests/site.test.mjs` (`node --test`)
- `npm run build` — run the tests, then `node scripts/build.mjs`

No environment variables are required to install, test, or build. This repo has no `.env.example`.
