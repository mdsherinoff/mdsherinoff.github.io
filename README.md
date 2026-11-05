# portfolio

Lives at https://mdsherinoff.github.io/ (this repo is named `mdsherinoff.github.io` on GitHub). The blog is a separate Hugo site (`my-blog` repo), published to the `blog` repo and served at `/blog/`.

One page, laid out like a magazine: who I am, what I'm looking for, and my projects, each with something you can try.

Plain HTML, CSS and a few lines of JS. No framework and no build step.

- `index.html`: the page
- `editorial.css`: everything visual, for the homepage and the blog posts
- `main.js`: swaps a demo's still image for the live demo when you press play
- `assets/shots/`: preview images (screenshots of the live sites and demos)
- `demos/`: the demos that run on this site
  - `manglish/`: Raycast-style UI around the extension's real transliteration code (calls Google Input Tools, like the extension)
  - `wc-pool/`: the prediction pool's look and its real scoring functions (`lib/scoring.ts`), with simulated results
  - `telefin/`: a simulation using the bot's real rules and message text
  - `odins-garden/`: the Flutter app's Dictionary tab ported to the web: same GBIF and Wikipedia requests, same keyword extraction
- `scripts/import_blog.py`: refreshes the homepage's list of blog posts, which link to the blog
- `404.html`: the not-found page
- `assets/avatar.png`: my GitHub avatar, used as the logo and favicon
- `assets/mohammed-sherin-cv.pdf`: the CV the page links to; replace the file to update it
- `archive/`: earlier designs (2D VHS, 3D store, the first one-page "programme" layout) and retired demos (Ringlog, Language Sort)

openMinistry, Bingely and AreYouFreeYet are embedded straight from their live sites.

## Run locally

```bash
python3 -m http.server 4173
```

## Bringing in new blog posts

Write on the blog as usual, then:

```bash
python3 scripts/import_blog.py
```

## Deploy

Any static host works. Pushing to `main` publishes it: GitHub Pages serves this repo at the root of mdsherinoff.github.io.
