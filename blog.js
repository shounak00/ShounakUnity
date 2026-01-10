/* =========================================================
   Blog OS Controller
   - Molecule background
   - Sounds (click/hover)
   - Dock -> navigate back to index.html#page
   - Load posts.json
   - Click post -> open window modal (scrollable)
   ========================================================= */

const ORDER = ["home","projects","resume","reels","articles","contact"];

/* ---------- Sounds ---------- */
const sClick  = document.getElementById("sClick");
const sPortal = document.getElementById("sPortal");
const sHover  = document.getElementById("sHover");

let soundOn = true;
function safePlay(aud){
  if(!soundOn || !aud) return;
  try { aud.currentTime = 0; aud.play(); } catch {}
}

document.addEventListener("click", (e) => {
  const isClickable = e.target.closest("button,a,[role='button'],[data-open],[data-close]");
  if (isClickable) safePlay(sClick);
}, true);

let lastHover = 0;
function hoverPing(){
  const now = performance.now();
  if (now - lastHover < 65) return;
  lastHover = now;
  safePlay(sHover);
}
document.addEventListener("mouseover", (e) => {
  const hit = e.target.closest("button,a,.magnetic,input,select");
  if (hit) hoverPing();
}, true);

/* ---------- Dock navigation ---------- */
/* On blog page we don't run portal state machine.
   Dock should send you back to index and jump to that page. */
document.querySelectorAll(".dockItem").forEach(btn => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.go;
    if(!key) return;

    // go to portal and jump there; portal can read ?p=key
    safePlay(sPortal);
    window.location.href = `./index.html?p=${encodeURIComponent(key)}`;
  });
});

/* ---------- Reader Window Modal ---------- */
const readerWin  = document.getElementById("readerWin");
const readerTitle = document.getElementById("readerTitle");
const readerMeta  = document.getElementById("readerMeta");
const readerBody  = document.getElementById("readerBody");

function openReader(post){
  if(!readerWin) return;
  safePlay(sPortal);

  readerTitle.textContent = post.title || "Post";
  readerMeta.textContent = `${post.date || ""}${post.tags?.length ? " • " + post.tags.join(" / ") : ""}`;
  readerBody.innerHTML = renderMarkdownLite(post.content || "");

  readerWin.setAttribute("aria-hidden","false");
}
function closeReader(){
  if(!readerWin) return;
  readerWin.setAttribute("aria-hidden","true");
  safePlay(sClick);
}

document.addEventListener("click", (e) => {
  if(e.target.closest("[data-close]")) closeReader();
});
document.addEventListener("keydown", (e) => {
  if(e.key === "Escape") closeReader();
});

/* ---------- Load posts.json and render grid ---------- */
const postsGrid = document.getElementById("postsGrid");
const searchEl = document.getElementById("search");
const tagFilter = document.getElementById("tagFilter");
const sortBtn = document.getElementById("sortBtn");

let posts = [];
let sortNewest = true;

function normalize(s){ return (s || "").toLowerCase().trim(); }

function buildTagOptions(){
  if(!tagFilter) return;
  const tags = new Set();
  posts.forEach(p => (p.tags || []).forEach(t => tags.add(t)));
  const list = Array.from(tags).sort((a,b)=>a.localeCompare(b));

  tagFilter.innerHTML = `<option value="all">All tags</option>` + list.map(t =>
    `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`
  ).join("");
}

function matchesFilters(p){
  const q = normalize(searchEl?.value);
  const tag = tagFilter?.value || "all";

  const hay = normalize(
    `${p.title||""} ${(p.tags||[]).join(" ")} ${p.excerpt||""} ${p.content||""}`
  );

  const qOk = !q || hay.includes(q);
  const tagOk = tag === "all" || (p.tags || []).includes(tag);

  return qOk && tagOk;
}

function renderGrid(){
  if(!postsGrid) return;

  const filtered = posts.filter(matchesFilters);
  const ordered = filtered.slice().sort((a,b) => {
    const da = new Date(a.date || "1970-01-01").getTime();
    const db = new Date(b.date || "1970-01-01").getTime();
    return sortNewest ? (db - da) : (da - db);
  });

  if(!ordered.length){
    postsGrid.innerHTML = `<div class="card"><div class="muted">No posts found.</div></div>`;
    return;
  }

  postsGrid.innerHTML = ordered.map(p => `
    <div class="card magnetic" style="cursor:pointer;" data-open-post="${escapeHtml(p.id)}">
      <div class="cardTop">
        <strong>${escapeHtml(p.title)}</strong>
        <span class="pill">${escapeHtml(p.date || "")}</span>
      </div>
      <div class="muted small">${escapeHtml((p.tags||[]).join(" / "))}</div>
      <div class="muted" style="margin-top:8px; line-height:1.5;">
        ${escapeHtml(p.excerpt || "")}
      </div>
      <div class="muted small" style="margin-top:10px; font-weight:950;">Open →</div>
    </div>
  `).join("");

  // click handlers
  postsGrid.querySelectorAll("[data-open-post]").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-open-post");
      const post = posts.find(x => x.id === id);
      if(post) openReader(post);
    });
  });
}

async function loadPosts(){
  try{
    const res = await fetch("./posts.json", { cache: "no-store" });
    if(!res.ok) throw new Error("posts.json not found");
    posts = await res.json();
    buildTagOptions();
    renderGrid();
  }catch(err){
    console.warn(err);
    if(postsGrid) postsGrid.innerHTML = `<div class="card"><div class="muted">Could not load posts.json</div></div>`;
  }
}

searchEl?.addEventListener("input", renderGrid);
tagFilter?.addEventListener("change", renderGrid);
sortBtn?.addEventListener("click", () => {
  sortNewest = !sortNewest;
  sortBtn.textContent = `Sort: ${sortNewest ? "Newest" : "Oldest"}`;
  renderGrid();
});

loadPosts();

/* ---------- Tiny markdown renderer (safe, minimal) ---------- */
function renderMarkdownLite(md){
  const lines = (md || "").split("\n");
  let out = "";
  let inList = false;

  function endList(){
    if(inList){ out += "</ul>"; inList = false; }
  }

  for(const raw of lines){
    const line = raw.trim();

    // headings
    if(line.startsWith("# ")){ endList(); out += `<h1>${escapeHtml(line.slice(2))}</h1>`; continue; }
    if(line.startsWith("## ")){ endList(); out += `<h2>${escapeHtml(line.slice(3))}</h2>`; continue; }

    // list
    if(line.startsWith("- ")){
      if(!inList){ out += "<ul>"; inList = true; }
      out += `<li>${linkify(escapeHtml(line.slice(2)))}</li>`;
      continue;
    }

    // blank
    if(!line){ endList(); continue; }

    // paragraph
    endList();
    out += `<p>${linkify(escapeHtml(raw))}</p>`;
  }

  endList();
  return out;
}

function linkify(html){
  // basic url linkifier
  return html.replace(/(https?:\/\/[^\s<]+)/g, `<a href="$1" target="_blank" rel="noreferrer">$1</a>`);
}

function escapeHtml(s){
  return (s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* =========================================================
   Molecule background (same as your portal version)
   ========================================================= */
const fx = document.getElementById("fx");
let fxCtx, W=0, H=0, dots=[];

function fxResize(){
  if(!fx) return;
  W = fx.width = innerWidth;
  H = fx.height = innerHeight;

  const count = Math.min(260, Math.floor(W/7));
  dots = new Array(count).fill(0).map(() => ({
    x: Math.random()*W,
    y: Math.random()*H,
    r: 1 + Math.random()*1.8,
    dx: (Math.random()-0.5)*0.55,
    dy: (Math.random()-0.5)*0.55
  }));
}
function fxAnimate(){
  if(!fx) return;
  if(!fxCtx) fxCtx = fx.getContext("2d");

  fxCtx.clearRect(0,0,W,H);

  for(let i=0;i<dots.length;i++){
    const p=dots[i];
    p.x+=p.dx; p.y+=p.dy;
    if(p.x<0||p.x>W) p.dx*=-1;
    if(p.y<0||p.y>H) p.dy*=-1;

    fxCtx.fillStyle="rgba(0,0,0,.16)";
    fxCtx.beginPath(); fxCtx.arc(p.x,p.y,p.r,0,Math.PI*2); fxCtx.fill();

    for(let j=i+1;j<dots.length;j++){
      const q=dots[j];
      const dx=p.x-q.x, dy=p.y-q.y;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<150){
        const a = 0.22*(1 - d/150);
        fxCtx.strokeStyle = `rgba(0,0,0,${Math.max(0,a)})`;
        fxCtx.lineWidth = 1;
        fxCtx.beginPath();
        fxCtx.moveTo(p.x,p.y);
        fxCtx.lineTo(q.x,q.y);
        fxCtx.stroke();
      }
    }
  }
  requestAnimationFrame(fxAnimate);
}

if(fx){
  addEventListener("resize", fxResize, {passive:true});
  fxResize();
  fxAnimate();
}
