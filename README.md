# portfolio

One page: who I am, what I'm looking for, and my projects, each with something you can try.

Plain HTML, CSS and a few lines of JS. No framework and no build step.

- `index.html`: the page
- `styles.css`: everything visual (light and dark follow the system setting)
- `main.js`: swaps a demo's still image for the live demo when you press play
- `assets/shots/`: preview images (screenshots of the live sites and demos)
- `demos/`: the demos that run on this site
  - `manglish/`: Raycast-style UI around the extension's real transliteration code (calls Google Input Tools, like the extension)
  - `ringlog/`: Ringlog's real `app.html` with `mock.js` standing in for the local Python server; `calls.json` and the sample exports were generated with Ringlog's own exporter from made-up calls
  - `telefin/`: a simulation using the bot's real rules and message text
  - `languagesort/`: the plugin's script detector ported from C#, over a demo library
- `writing/`: blog posts copied from the Hugo blog (`my-blog` repo) by `scripts/import_blog.py`; the blog stays the original and each copy links back to it
- `assets/avatar.png`: my GitHub avatar, used as the logo and favicon
- `archive/`: earlier experiments (2D VHS version, 3D store), kept for reference

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

## Refreshing demo data

Ringlog's sample data comes from a small generator script that builds made-up `Call`s and runs them through `ringlog.export.WRITERS`. Re-run it if the exporter changes so the sample report matches the real one.

## Deploy

Any static host works. For GitHub Pages: push, then Settings → Pages → deploy from `main`, root folder.
