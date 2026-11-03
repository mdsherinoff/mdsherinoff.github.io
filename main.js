// The masthead dates the issue by the page's last deploy (GitHub Pages sends
// Last-Modified); the month written in the HTML is the fallback.
const issueDate = document.getElementById("issue-date");
const modified = new Date(document.lastModified);
if (issueDate && !isNaN(modified)) {
  issueDate.textContent = modified.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

// Demos stay as still images until someone presses play, so the page loads
// light; then the real thing (or its web port) loads in place.
document.querySelectorAll(".demo").forEach((fig) => {
  const chrome = fig.querySelector(".demo__chrome");
  const stage = fig.querySelector(".demo__stage");
  const src = fig.dataset.src;
  const title = fig.dataset.title || fig.closest(".project").querySelector("h3").textContent;
  const poster = stage.innerHTML;

  const tools = document.createElement("span");
  tools.className = "demo__tools";
  tools.innerHTML = `<a href="${src}" target="_blank" rel="noopener">Open in a tab ↗</a><button type="button">Close</button>`;
  chrome.appendChild(tools);

  function play() {
    fig.classList.add("is-playing");
    stage.innerHTML = `<span class="loading">Loading ${title}…</span>`;
    const frame = document.createElement("iframe");
    frame.src = src;
    frame.title = `${title} demo`;
    frame.loading = "lazy";
    frame.allow = "clipboard-write";
    frame.addEventListener("load", () => stage.querySelector(".loading")?.remove());
    stage.appendChild(frame);
    frame.focus();
  }
  function close() {
    fig.classList.remove("is-playing");
    stage.innerHTML = poster;
    stage.querySelector(".play").addEventListener("click", play);
  }

  stage.querySelector(".play").addEventListener("click", play);
  tools.querySelector("button").addEventListener("click", close);
});

// Dashed words explain themselves: tapping one shows its glossary entry in a
// small card beside it. Without JS they're plain links to the glossary.
const pop = document.createElement("div");
pop.className = "term-pop";
pop.id = "term-pop";
pop.setAttribute("role", "dialog");
pop.hidden = true;
document.body.appendChild(pop);
let openTerm = null;

function closeTerm() {
  if (!openTerm) return;
  openTerm.setAttribute("aria-expanded", "false");
  pop.hidden = true;
  openTerm = null;
}

function showTerm(term) {
  const entry = document.querySelector(term.getAttribute("href"));
  if (!entry) return;
  closeTerm();
  const name = entry.querySelector("dt").textContent;
  pop.innerHTML = `<b>${name}</b><p>${entry.querySelector("dd").innerHTML}</p>`;
  pop.setAttribute("aria-label", name);
  pop.hidden = false;
  const r = term.getBoundingClientRect();
  const left = Math.min(Math.max(16, r.left), document.documentElement.clientWidth - pop.offsetWidth - 16);
  pop.style.left = `${left + scrollX}px`;
  pop.style.top = `${r.bottom + scrollY + 8}px`;
  term.setAttribute("aria-expanded", "true");
  openTerm = term;
}

document.querySelectorAll(".term").forEach((term) => {
  term.setAttribute("role", "button");
  term.setAttribute("aria-expanded", "false");
  term.setAttribute("aria-controls", "term-pop");
  term.addEventListener("click", (e) => {
    e.preventDefault();
    openTerm === term ? closeTerm() : showTerm(term);
  });
});
document.addEventListener("click", (e) => {
  if (openTerm && !e.target.closest(".term, .term-pop")) closeTerm();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && openTerm) { const t = openTerm; closeTerm(); t.focus(); }
});
addEventListener("resize", closeTerm);
