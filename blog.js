/* blog.js — No CDN, event delegation, modal reader, search/tag/sort */

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* Drawer (mobile menu) */
const menuBtn = document.getElementById("menuBtn");
const drawer = document.getElementById("drawer");
menuBtn?.addEventListener("click", () => {
  const open = drawer?.getAttribute("aria-hidden") === "false";
  drawer?.setAttribute("aria-hidden", open ? "true" : "false");
});

/* Elements */
const grid = document.getElementById("postsGrid");
const searchEl = document.getElementById("search");
const tagFilterEl = document.getElementById("tagFilter");
const sortBtn = document.getElementById("sortBtn");

const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");

let posts = [];
let sortNewest = true;

/* ----------------- helpers ----------------- */

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* Minimal markdown → HTML (enough for your posts) */
function mdToHtml(md = "") {
  const lines = String(md).replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let inUl = false;

  function closeUl() {
    if (inUl) {
      html += "</ul>";
      inUl = false;
    }
  }

  for (let raw of lines) {
    const line = raw.trimEnd();

    // blank line
    if (!line.trim()) {
      closeUl();
      continue;
    }

    // headings
    if (line.startsWith("### ")) { closeUl(); html += `<h3>${inlineMd(line.slice(4))}</h3>`; continue; }
    if (line.startsWith("## "))  { closeUl(); html += `<h2>${inlineMd(line.slice(3))}</h2>`; continue; }
    if (line.startsWith("# "))   { closeUl(); html += `<h1>${inlineMd(line.slice(2))}</h1>`; continue; }

    // list item "- "
    if (line.startsWith("- ")) {
      if (!inUl) { html += "<ul>"; inUl = true; }
      html += `<li>${inlineMd(line.slice(2))}</li>`;
      continue;
    }

    // normal paragraph
    closeUl();
    html += `<p>${inlineMd(line)}</p>`;
  }

  closeUl();
  return html;

  function inlineMd(text) {
    let t = escapeHtml(text);

    // **bold**
    t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // inline `code`
    t = t.replace(/`(.+?)`/g, "<code>$1</code>");

    // auto-link http(s)
    t = t.replace(/(https?:\/\/[^\s]+)/g, `<a href="$1" target="_blank" rel="noreferrer">$1</a>`);

    return t;
  }
}

function normalizeDate(d) {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? new Date(0) : dt;
}

function uniqueTags(allPosts) {
  const set = new Set();
  allPosts.forEach(p => (p.tags || []).forEach(t => set.add(String(t))));
  return Array.from(set).sort((a,b) => a.localeCompare(b));
}

/* ----------------- rendering ----------------- */

function renderTagOptions() {
  if (!tagFilterEl) return;
  const tags = uniqueTags(posts);
  tagFilterEl.innerHTML = `<option value="all">All tags</option>` + tags.map(t =>
    `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`
  ).join("");
}

function getFilteredPosts() {
  const q = (searchEl?.value || "").trim().toLowerCase();
  const tag = tagFilterEl?.value || "all";

  let out = posts.slice();

  if (q) {
    out = out.filter(p => {
      const hay = [
        p.title || "",
        p.excerpt || "",
        (p.tags || []).join(" "),
        p.content || ""
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  if (tag !== "all") {
    out = out.filter(p => (p.tags || []).includes(tag));
  }

  out.sort((a,b) => {
    const da = normalizeDate(a.date).getTime();
    const db = normalizeDate(b.date).getTime();
    return sortNewest ? (db - da) : (da - db);
  });

  return out;
}

function renderGrid() {
  if (!grid) return;
  const list = getFilteredPosts();

  if (!list.length) {
    grid.innerHTML = `<div class="postCard">No posts found.</div>`;
    return;
  }

  grid.innerHTML = list.map(p => `
    <article class="postCard magnetic">
      <h3>${escapeHtml(p.title || "Untitled")}</h3>
      <div class="date">${escapeHtml(p.date || "")} • ${(p.tags || []).map(escapeHtml).join(" / ")}</div>
      <div class="excerpt">${escapeHtml(p.excerpt || "")}</div>
      <div style="margin-top:12px;">
        <button class="btn btn--ghost magnetic" type="button" data-open="${escapeHtml(p.id)}">
          Click to Read →
        </button>
      </div>
    </article>
  `).join("");
}

/* ----------------- modal ----------------- */

function openModalById(id) {
  const p = posts.find(x => x.id === id);
  if (!p || !modal || !modalBody) return;

  modalBody.innerHTML = `
    <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:10px;">
      <div style="font-weight:950; font-size:20px;">${escapeHtml(p.title || "Untitled")}</div>
    </div>
    <div class="small" style="margin-bottom:14px;">
      ${escapeHtml(p.date || "")}${p.tags?.length ? " • " + p.tags.map(escapeHtml).join(" / ") : ""}
    </div>
    <div class="card" style="padding:14px;">
      ${mdToHtml(p.content || "")}
    </div>
  `;

  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
}

/* Event delegation: works even if you re-render */
document.addEventListener("click", (e) => {
  const openBtn = e.target.closest("[data-open]");
  if (openBtn) {
    e.preventDefault();
    const id = openBtn.getAttribute("data-open");
    openModalById(id);
    return;
  }

  if (e.target.closest("[data-close]")) {
    e.preventDefault();
    closeModal();
    return;
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

/* ----------------- load ----------------- */

async function loadPosts() {
  if (!grid) return;
  try {
    const res = await fetch("./posts.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`posts.json HTTP ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data)) throw new Error("posts.json is not an array");

    posts = data.map(p => ({
      id: String(p.id || ""),
      title: p.title || "Untitled",
      date: p.date || "",
      tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
      excerpt: p.excerpt || "",
      content: p.content || ""
    })).filter(p => p.id);

    renderTagOptions();
    renderGrid();
  } catch (err) {
    console.error("Could not load posts.json", err);
    grid.innerHTML = `
      <div class="postCard">
        <strong>Posts failed to load.</strong><br/>
        Check that <code>posts.json</code> is beside <code>blog.html</code>.<br/>
        Also open DevTools → Console for the exact error.
      </div>
    `;
  }
}

/* Inputs */
searchEl?.addEventListener("input", renderGrid);
tagFilterEl?.addEventListener("change", renderGrid);

sortBtn?.addEventListener("click", () => {
  sortNewest = !sortNewest;
  sortBtn.textContent = `Sort: ${sortNewest ? "Newest" : "Oldest"}`;
  renderGrid();
});

/* Start */
loadPosts();
