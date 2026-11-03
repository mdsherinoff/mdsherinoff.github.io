"""List the Hugo blog's posts (github.com/mdsherinoff/my-blog) on the front page.

Each entry links straight to the post on the blog. Run it again after writing a
new post:

    python3 scripts/import_blog.py

Refreshes the list between the <!-- writing:start --> / <!-- writing:end -->
markers in index.html, and writes writing/<slug>/index.html as a redirect to
the blog so links to the old copies on this site keep working.
Standard library only.
"""

from __future__ import annotations

import html
import json
import re
import urllib.request
from datetime import datetime
from pathlib import Path

REPO = "mdsherinoff/my-blog"
POSTS_DIR = "mohammedsherinblog/content/posts"
BLOG_URL = "https://mdsherinoff.github.io/posts/"
ROOT = Path(__file__).resolve().parent.parent

# posts left off this site, and titles tidied up for it (the blog keeps its own)
SKIP = {"myfirstpost"}
TITLES = {"exitnode-athome": "How I Set Up an Exit Node Through My Home Network"}


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "portfolio-import", "Accept": "application/vnd.github+json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


def list_posts() -> list[tuple[str, str]]:
    items = json.loads(fetch(f"https://api.github.com/repos/{REPO}/contents/{POSTS_DIR}"))
    return [(i["name"], i["download_url"]) for i in items if i["name"].endswith(".md") and not i["name"].startswith("_")]


def parse_front_matter(text: str) -> tuple[dict, str]:
    m = re.match(r"\+\+\+\n(.*?)\n\+\+\+\n?(.*)", text, re.S)
    if not m:
        return {}, text
    meta = dict(re.findall(r"^(\w+)\s*=\s*'([^']*)'", m.group(1), re.M))
    meta.update(re.findall(r'^(\w+)\s*=\s*"([^"]*)"', m.group(1), re.M))
    return meta, m.group(2)


REDIRECT = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title} · Mohammed Sherin</title>
<link rel="canonical" href="{url}">
<meta http-equiv="refresh" content="0; url={url}">
<meta name="robots" content="noindex">
</head>
<body>
<p>This post is on my blog: <a href="{url}">{title}</a>.</p>
</body>
</html>
"""


def main() -> None:
    posts = []
    for name, url in list_posts():
        slug = name[:-3].lower()
        if slug in SKIP:
            continue
        meta, body = parse_front_matter(fetch(url).decode("utf-8"))
        if meta.get("draft") == "true":
            continue
        when = datetime.fromisoformat(meta["date"])
        post = {
            "slug": slug,
            "title": TITLES.get(slug, meta.get("title", slug)),
            "when": when,
            "date": when.strftime("%-d %b %Y"),
            "canonical": f"{BLOG_URL}{slug}/",
        }
        out = ROOT / "writing" / slug / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(REDIRECT.format(title=html.escape(post["title"]), url=post["canonical"]))
        posts.append(post)

    posts.sort(key=lambda p: p["when"], reverse=True)
    items = "\n".join(
        f'        <li><a href="{p["canonical"]}"><time datetime="{p["when"].date().isoformat()}">{p["date"]}</time>'
        f'<b>{html.escape(p["title"])}</b></a></li>'
        for p in posts
    )
    index = ROOT / "index.html"
    page = index.read_text()
    page, n = re.subn(r"(<!-- writing:start -->).*?(<!-- writing:end -->)", lambda m: f"{m.group(1)}\n{items}\n        {m.group(2)}", page, flags=re.S)
    if not n:
        raise SystemExit("index.html has no <!-- writing:start --> marker")
    index.write_text(page)
    print(f"Imported {len(posts)} post(s): " + ", ".join(p["slug"] for p in posts))


if __name__ == "__main__":
    main()
