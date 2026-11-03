# portfolio

One page, laid out like a magazine: who I am, what I'm looking for, and my projects, each with something you can try.

Plain HTML, CSS and a few lines of JS. No framework and no build step.

- `index.html`: the page
- `editorial.css`: everything visual, for the homepage and the blog posts
- `main.js`: swaps a demo's still image for the live demo when you press play
- `assets/shots/`: preview images (screenshots of the live sites and demos)
- `demos/`: the demos that run on this site
  - `areyoufreeyet/`: the real app, built as a static export of the `areyoufreeyet` repo (see below)
  - `manglish/`: Raycast-style UI around the extension's real transliteration code (calls Google Input Tools, like the extension)
  - `wc-pool/`: the prediction pool's look and its real scoring functions (`lib/scoring.ts`), with simulated results
  - `telefin/`: a simulation using the bot's real rules and message text
  - `odins-garden/`: the Flutter app's Dictionary tab ported to the web: same GBIF and Wikipedia requests, same keyword extraction
- `writing/`: blog posts copied from the Hugo blog (`my-blog` repo) by `scripts/import_blog.py`; the blog stays the original and each copy links back to it
- `assets/avatar.png`: my GitHub avatar, used as the logo and favicon
- `assets/mohammed-sherin-cv.pdf`: the CV the page links to; replace the file to update it
- `archive/`: earlier designs (2D VHS, 3D store, the first one-page "programme" layout) and retired demos (Ringlog, Language Sort)

openMinistry and Bingely are embedded straight from their live sites.

## Run locally

```bash
python3 -m http.server 4173
```

## Bringing in new blog posts

Write on the blog as usual, then:

```bash
python3 scripts/import_blog.py
```

## Rebuilding the AreYouFreeYet demo

It's the real Next.js app exported as static files. From a copy of the `areyoufreeyet` repo, set `next.config.ts` to:

```ts
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/portfolio/demos/areyoufreeyet",
  trailingSlash: true,
  images: { unoptimized: true },
};
```

then `npx next build` and copy `out/` to `demos/areyoufreeyet/`. The homepage opens it with a `#s=…` share link (the app's own format) so it starts on a sample plan. Because of the `basePath`, test it under `/portfolio/` locally, not at the server root.

## Deploy

Any static host works. For GitHub Pages: push, then Settings → Pages → deploy from `main`, root folder.
