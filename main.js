// The masthead dates the issue by the page's last deploy (GitHub Pages sends
// Last-Modified); the month written in the HTML is the fallback.
const issueDate = document.getElementById("issue-date");
const modified = new Date(document.lastModified);
if (issueDate && !isNaN(modified)) {
  issueDate.textContent = modified.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

// Demos stay as still images until someone presses play, so the page loads
// light. Play lifts the demo out of the page: its still grows from where it
// sits to fill most of the screen over a dimmed, blurred page, then the real
// thing (or its web port) fades in. Closing shrinks it back into its spot, so
// the page itself never changes shape.
const calm = matchMedia("(prefers-reduced-motion: reduce)");
const modal = document.createElement("div");
modal.className = "demo-modal";
modal.hidden = true;
modal.innerHTML = `<div class="demo demo-modal__panel" role="dialog" aria-modal="true">
  <div class="demo__chrome"><span class="url"></span><span class="tag"></span><span class="demo__tools"><a target="_blank" rel="noopener">Open in a tab ↗</a><button type="button">Close</button></span></div>
  <div class="demo__stage"></div>
</div>`;
const panel = modal.firstElementChild;
const panelStage = panel.querySelector(".demo__stage");
const closeButton = panel.querySelector(".demo__tools button");
let current = null;

// where the demo sits on the page: its label bar down to the bottom of the still
function spotOf(fig) {
  const top = fig.querySelector(".demo__chrome").getBoundingClientRect();
  const bottom = fig.querySelector(".demo__stage").getBoundingClientRect();
  return { left: bottom.left, top: top.top, width: bottom.width, height: bottom.bottom - top.top };
}
function move(from, to, options) {
  if (calm.matches) return Promise.resolve();
  const px = (r) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
  return panel.animate([px(from), px(to)], { duration: 460, easing: "cubic-bezier(.2,.8,.2,1)", ...options }).finished;
}
function setPageInert(on) {
  document.querySelectorAll("body > header, body > main, body > footer").forEach((el) => (el.inert = on));
  document.documentElement.classList.toggle("has-demo-open", on);
}

function openDemo(fig) {
  const src = fig.dataset.src;
  const title = fig.dataset.title || fig.closest(".project").querySelector("h3").textContent;
  panel.querySelector(".url").textContent = fig.querySelector(".url").textContent;
  panel.querySelector(".tag").textContent = fig.querySelector(".tag").textContent;
  panel.querySelector(".demo__tools a").href = src;
  panel.setAttribute("aria-label", `${title} demo`);
  panelStage.innerHTML = fig.querySelector(".demo__stage img").outerHTML;

  const from = spotOf(fig);
  modal.hidden = false;
  fig.classList.add("is-lifted");
  setPageInert(true);
  requestAnimationFrame(() => modal.classList.add("is-open"));
  closeButton.focus({ preventScroll: true });
  current = fig;

  move(from, panel.getBoundingClientRect()).then(() => {
    if (current !== fig) return;
    const loading = document.createElement("span");
    loading.className = "loading";
    loading.textContent = `Loading ${title}…`;
    const frame = document.createElement("iframe");
    frame.src = src;
    frame.title = `${title} demo`;
    frame.allow = "clipboard-write";
    frame.addEventListener("load", () => { loading.remove(); frame.classList.add("is-ready"); });
    panelStage.append(loading, frame);
  });
}

function closeDemo() {
  const fig = current;
  if (!fig) return;
  current = null;
  // shrink the still, not the live page, back into its spot
  panelStage.innerHTML = fig.querySelector(".demo__stage img").outerHTML;
  modal.classList.remove("is-open");
  move(panel.getBoundingClientRect(), spotOf(fig), { duration: 380, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }).then(() => {
    if (current) return;
    modal.hidden = true;
    panelStage.innerHTML = "";
    panel.getAnimations().forEach((a) => a.cancel());
    fig.classList.remove("is-lifted");
    setPageInert(false);
    fig.querySelector(".play").focus({ preventScroll: true });
  });
}

document.querySelectorAll(".demo").forEach((fig) => {
  fig.querySelector(".play").addEventListener("click", () => openDemo(fig));
});
document.body.appendChild(modal);
closeButton.addEventListener("click", closeDemo);
modal.addEventListener("click", (e) => { if (e.target === modal) closeDemo(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && current) closeDemo(); });

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
