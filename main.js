// Demos stay as still images until someone presses play, so the page loads
// light; then the real thing (or its web port) loads in place.
document.querySelectorAll(".demo").forEach((fig) => {
  const chrome = fig.querySelector(".demo__chrome");
  const stage = fig.querySelector(".demo__stage");
  const src = fig.dataset.src;
  const title = fig.closest(".project").querySelector("h3").textContent;
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
