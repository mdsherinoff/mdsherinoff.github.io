"""Copy posts from the Hugo blog (github.com/mdsherinoff/my-blog) into this site.

The blog stays where it is; each copy here points back to the original with a
canonical link. Run it again after writing a new post:

    python3 scripts/import_blog.py

Writes writing/<slug>/index.html for every post and refreshes the list between
the <!-- writing:start --> / <!-- writing:end --> markers in index.html.
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
    return [(i["name"], i["download_url"]) for i in items if i["name"].endswith(".md")]


def parse_front_matter(text: str) -> tuple[dict, str]:
    m = re.match(r"\+\+\+\n(.*?)\n\+\+\+\n?(.*)", text, re.S)
    if not m:
        return {}, text
    meta = dict(re.findall(r"^(\w+)\s*=\s*'([^']*)'", m.group(1), re.M))
    meta.update(re.findall(r'^(\w+)\s*=\s*"([^"]*)"', m.group(1), re.M))
    return meta, m.group(2)


def inline(text: str) -> str:
    """Escape, then apply the bits of Markdown the posts use: code, bold, italics, links."""
    parts = re.split(r"(`[^`]+`)", text)
    out = []
    for p in parts:
        if p.startswith("`") and p.endswith("`") and len(p) > 1:
            out.append(f"<code>{html.escape(p[1:-1])}</code>")
            continue
        s = html.escape(p, quote=False)
        s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
        s = re.sub(r"(?<!\*)\*(?!\*)(.+?)\*", r"<em>\1</em>", s)
        s = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", lambda m: link(m.group(1), m.group(2)), s)
        out.append(s)
    return "".join(out)


def link(label: str, url: str) -> str:
    # links between blog posts point at the copies on this site
    m = re.match(re.escape(BLOG_URL) + r"([\w-]+)/?$", html.unescape(url))
    if m:
        return f'<a href="../{m.group(1)}/">{label}</a>'
    return f'<a href="{url}" target="_blank" rel="noopener">{label} ↗</a>'


def markdown(md: str) -> str:
    lines = md.strip("\n").split("\n")
    out, para, items = [], [], []

    def flush():
        if para:
            out.append(f"<p>{inline(' '.join(para))}</p>")
            para.clear()
        if items:
            out.append("<ul>" + "".join(f"<li>{inline(i)}</li>" for i in items) + "</ul>")
            items.clear()

    i = 0
    while i < len(lines):
        line = lines[i]
        fence = re.match(r"^```(\w*)\s*$", line)
        if fence:
            flush()
            code = []
            i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                code.append(lines[i])
                i += 1
            lang = fence.group(1) or "shell"
            out.append(f'<pre data-lang="{lang}"><code>{html.escape(chr(10).join(code))}</code><button class="copy" type="button">Copy</button></pre>')
        elif m := re.match(r"^(#{1,4})\s+(.*)", line):
            flush()
            level = min(len(m.group(1)) + 1, 4)  # the post title is the page's h1
            out.append(f"<h{level}>{inline(m.group(2))}</h{level}>")
        elif m := re.match(r"^\s*[-*]\s+(.*)", line):
            if para:
                flush()
            items.append(m.group(1))
        elif not line.strip():
            flush()
        else:
            if items:
                flush()
            para.append(line.strip())
        i += 1
    flush()
    return "\n".join(out)


def plain(md: str) -> str:
    md = re.sub(r"```.*?```", " ", md, flags=re.S)
    md = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", md)
    md = re.sub(r"[#*`>]", "", md)
    return re.sub(r"\s+", " ", md).strip()


def summary(md: str, limit: int = 150) -> str:
    text = plain(md)
    first = re.split(r"(?<=[.!?])\s", text, maxsplit=1)[0]
    s = first if len(first) <= limit else text[:limit].rsplit(" ", 1)[0] + "…"
    return s


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} · Mohammed Sherin</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{canonical}">
<meta name="color-scheme" content="light">
<link rel="icon" href="../../assets/avatar.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Libre+Caslon+Display&family=Libre+Franklin:wght@400;500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../editorial.css">
</head>
<body>
<header class="masthead masthead--slim">
  <div class="ears"><a href="../../">Mohammed Sherin</a><span>From the blog</span><a href="../../#writing">More writing</a></div>
</header>
<main class="post">
  <p class="kicker">From the blog · <time datetime="{iso}">{date}</time> · {minutes} min read</p>
  <h1 class="headline">{title}</h1>
  <p class="byline">By Mohammed Sherin</p>
  <div class="post__body">
{body}
  </div>
  <p class="post__foot">First published on <a href="{canonical}" target="_blank" rel="noopener">my blog ↗</a> · <a href="../../#writing">More writing</a> · <a href="../../">Back to the front page</a></p>
</main>
<script>
document.querySelectorAll("pre .copy").forEach((b) => b.addEventListener("click", async () => {{
  try {{ await navigator.clipboard.writeText(b.previousElementSibling.textContent); b.textContent = "Copied"; }} catch {{ b.textContent = "Select and copy"; }}
  setTimeout(() => (b.textContent = "Copy"), 1500);
}}));
</script>
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
        words = len(plain(body).split())
        post = {
            "slug": slug,
            "title": TITLES.get(slug, meta.get("title", slug)),
            "when": when,
            "date": when.strftime("%-d %b %Y"),
            "minutes": max(1, round(words / 200)),
            "summary": summary(body),
            "canonical": f"{BLOG_URL}{slug}/",
        }
        out = ROOT / "writing" / slug / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(PAGE.format(
            title=html.escape(post["title"]), desc=html.escape(post["summary"]), canonical=post["canonical"],
            iso=when.date().isoformat(), date=post["date"], minutes=post["minutes"], body=markdown(body),
        ))
        posts.append(post)

    posts.sort(key=lambda p: p["when"], reverse=True)
    items = "\n".join(
        f'        <li><a href="writing/{p["slug"]}/"><time datetime="{p["when"].date().isoformat()}">{p["date"]}</time>'
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
