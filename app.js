/* =========================================================
   SOUND
   ========================================================= */
const sClick = document.getElementById("sClick");
const sPortal = document.getElementById("sPortal");
const sHover = document.getElementById("sHover");

let soundOn = true;
function safePlay(aud){
  if (!soundOn) return;
  if (!aud) return;
  try { aud.currentTime = 0; aud.play(); } catch {}
}

// hover + click sounds
let lastHover = 0;
document.addEventListener("mouseover", (e) => {
  const hit = e.target.closest("button,a,[role='button'],.dockItem,.iconBtn");
  if (!hit) return;
  const now = performance.now();
  if (now - lastHover < 70) return;
  lastHover = now;
  safePlay(sHover);
}, true);

document.addEventListener("click", (e) => {
  const hit = e.target.closest("button,a,[role='button'],.dockItem,.iconBtn");
  if (hit) safePlay(sClick);
}, true);

/* =========================================================
   MOLECULE BACKGROUND (dots + links)
   ========================================================= */
const fx = document.getElementById("fx");
let fxCtx, W = 0, H = 0, dots = [];

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function fxResize(){
  if(!fx) return;
  W = fx.width = innerWidth;
  H = fx.height = innerHeight;

  const count = Math.min(320, Math.floor(W / 6)); // stronger background
  dots = new Array(count).fill(0).map(() => ({
    x: Math.random()*W,
    y: Math.random()*H,
    r: 0.8 + Math.random()*2.0,
    dx: (Math.random()-0.5)*0.55,
    dy: (Math.random()-0.5)*0.55
  }));
}

function fxAnimate(){
  if(!fx) return;
  if(!fxCtx) fxCtx = fx.getContext("2d");

  fxCtx.clearRect(0,0,W,H);

  const dotCol = cssVar("--dot", "rgba(0,0,0,.18)");

  for(let i=0;i<dots.length;i++){
    const p = dots[i];
    p.x += p.dx; p.y += p.dy;
    if(p.x<0||p.x>W) p.dx*=-1;
    if(p.y<0||p.y>H) p.dy*=-1;

    // dots
    fxCtx.fillStyle = dotCol;
    fxCtx.beginPath();
    fxCtx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    fxCtx.fill();

    // links
    for(let j=i+1;j<dots.length;j++){
      const q = dots[j];
      const dx = p.x-q.x, dy = p.y-q.y;
      const d = Math.sqrt(dx*dx+dy*dy);
      if(d < 170){
        const a = 0.26*(1 - d/170);
        fxCtx.strokeStyle = `rgba(0,0,0,${Math.max(0, a)})`;
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

if (fx){
  addEventListener("resize", fxResize, { passive:true });
  fxResize();
  fxAnimate();
}

/* =========================================================
   BLOG PREVIEW (Articles page loads posts.json)
   ========================================================= */
async function loadLatestPosts(){
  const host = document.getElementById("latestPosts");
  if(!host) return;

  try{
    const res = await fetch("./posts.json", { cache: "no-store" });
    if(!res.ok) throw new Error("posts.json not found");
    const posts = await res.json();
    posts.sort((a,b) => new Date(b.date) - new Date(a.date));

    const top = posts.slice(0, 4);
    host.innerHTML = top.map(p => `
      <div class="card">
        <div class="strong">${escapeHtml(p.title)}</div>
        <div class="muted small">${escapeHtml(p.date)} • ${(p.tags||[]).map(escapeHtml).join(" / ")}</div>
        <div class="muted" style="margin-top:8px; line-height:1.5;">${escapeHtml(p.excerpt || "")}</div>
        <div style="margin-top:10px;">
          <br>
          <a class="btn ghost" href="./blog.html">Open in Blog →</a>
          <br>
        </div>
        <br>
      </div>
    `).join("\n");
  }catch(err){
    host.innerHTML = `<div class="card"><div class="muted">Could not load posts.json</div></div>`;
    console.warn(err);
  }
}

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

loadLatestPosts();

/* =========================================================
   PORTAL / STATE MACHINE (FIXED)
   - Start: circle visible
   - First scroll (or click circle): enter content mode -> Home expands out of inner portal
   - Scroll down: current page collapses INTO inner portal, circle full lap, next page expands
   - Scroll up: same, backwards
   - Resume scroll works: while scrolling inside .scrollCard, it does NOT change pages
   ========================================================= */
const ORDER = ["home","projects","resume","reels","articles","contact"];

const circleZone  = document.getElementById("circleZone");
const circleWrap  = document.getElementById("circleWrap");
const innerPortal = document.getElementById("innerPortal");

const pages = Array.from(document.querySelectorAll(".page"));
const dockItems = Array.from(document.querySelectorAll(".dockItem"));

let idx = 0;
let lock = false;
let inContentMode = false;
let circleLap = 0;

function setActivePage(i){
  idx = Math.max(0, Math.min(ORDER.length - 1, i));
  const key = ORDER[idx];

  pages.forEach(p => p.classList.toggle("active", p.dataset.key === key));
  dockItems.forEach(b => b.classList.toggle("active", b.dataset.go === key));
}

function showCircle(){
  circleZone?.classList.remove("off");
  circleZone?.classList.remove("hidden");
}

function hideCircle(){
  // fade out quickly, then turn fully OFF so it cannot overlap
  circleZone?.classList.add("hidden");
  setTimeout(() => circleZone?.classList.add("off"), 220);
}


function getPortalOriginVars(){
  const r = innerPortal?.getBoundingClientRect();
  if (!r) return { x: "50%", y: "50%" };

  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;

  return {
    x: `${(cx / innerWidth) * 100}%`,
    y: `${(cy / innerHeight) * 100}%`
  };
}

function spinCircleFullLap(direction /* +1 or -1 */){
  // full 360 lap each transition, plus slight index-based drift
  circleLap += 360 * direction;
  const drift = idx * 6; // tiny aesthetic drift
  const deg = circleLap + drift;
  if (circleWrap) circleWrap.style.setProperty("--circle-rot", `${deg}deg`);
}

function canScrollInside(el){
  if(!el) return false;
  const max = el.scrollHeight - el.clientHeight;
  return max > 2;
}

function shouldLetInnerScroll(e){
  const scroller = e.target.closest(".scrollCard");
  if(!scroller) return false;
  if(!canScrollInside(scroller)) return false;

  const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if (Math.abs(delta) < 2) return true;

  // If user can scroll within content, do it.
  const atTop = scroller.scrollTop <= 0;
  const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;

  if (delta > 0 && !atBottom) return true;  // scrolling down inside
  if (delta < 0 && !atTop) return true;     // scrolling up inside

  // If at edge, allow page transition.
  return false;
}

function enterContentMode(){
  if (inContentMode || lock) return;

  lock = true;
  inContentMode = true;

  // make sure no page is showing before the portal animation
  hideAllPages();

  showCircle();

  const origin = getPortalOriginVars();
  document.documentElement.style.setProperty("--portal-x", origin.x);
  document.documentElement.style.setProperty("--portal-y", origin.y);

  idx = 0;
  setActivePage(0);

  const home = pages.find(p => p.dataset.key === "home");
  if(home){
    home.classList.add("active");
    home.classList.add("portalIn");
  }

  safePlay(sPortal);

  // after page expands, completely remove the circle layer
  setTimeout(() => {
    home?.classList.remove("portalIn");
    hideCircle();    // <- now this removes it fully (display none)
    lock = false;
  }, 680);
}


function portalTransition(nextIdx, direction){
  if (!inContentMode) return;
  if (lock) return;

  const clamped = Math.max(0, Math.min(ORDER.length - 1, nextIdx));
  if (clamped === idx) return;

  lock = true;

  // circle ON for the transition only
  showCircle();

  const fromKey = ORDER[idx];
  const toKey = ORDER[clamped];

  const fromPage = pages.find(p => p.dataset.key === fromKey);
  const toPage   = pages.find(p => p.dataset.key === toKey);

  const origin = getPortalOriginVars();
  document.documentElement.style.setProperty("--portal-x", origin.x);
  document.documentElement.style.setProperty("--portal-y", origin.y);

  // collapse
  if (fromPage){
    fromPage.classList.remove("portalIn");
    fromPage.classList.add("portalOut");
  }

  idx = clamped;
  dockItems.forEach(b => b.classList.toggle("active", b.dataset.go === ORDER[idx]));

  spinCircleFullLap(direction);
  safePlay(sPortal);

  setTimeout(() => {
    if (fromPage){
      fromPage.classList.remove("active","portalOut");
    }

    setActivePage(clamped);

    if (toPage){
      toPage.classList.add("active");
      toPage.classList.add("portalIn");
    }

    setTimeout(() => {
      toPage?.classList.remove("portalIn");

      // circle OFF after transition
      hideCircle();

      lock = false;
    }, 620);

  }, 560);
}

/* CLICK CIRCLE to enter */
circleZone?.addEventListener("click", () => {
  if(!inContentMode) enterContentMode();
});

/* Dock click */
dockItems.forEach(btn => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.go;
    const n = ORDER.indexOf(k);
    if (n < 0) return;

    if (!inContentMode){
      enterContentMode();
      if (n !== 0){
        // wait a bit then jump
        setTimeout(() => portalTransition(n, +1), 260);
      }
      return;
    }

    const dir = n > idx ? +1 : -1;
    portalTransition(n, dir);
  });
});

/* Wheel scroll (MAIN TRANSITION) */
window.addEventListener("wheel", (e) => {
  // allow resume inner scrolling
  if (shouldLetInnerScroll(e)) return;

  const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if (Math.abs(d) < 12) return;

  if (!inContentMode){
    enterContentMode();
    return;
  }

  if (lock) return;

  if (d > 0) portalTransition(idx + 1, +1);
  else portalTransition(idx - 1, -1);
}, { passive: true });

// Jump support: index.html?p=projects
(function jumpFromQuery(){
  const p = new URLSearchParams(location.search).get("p");
  if(!p) return;
  const key = p.toLowerCase();
  const n = ORDER.indexOf(key);
  if(n >= 0){
    // enter content mode then jump
    enterContentMode();
    if(n !== 0) setTimeout(() => portalTransition(n), 220);
  }
})();



/* Init */
pages.forEach(p => p.classList.remove("active"));
dockItems.forEach(b => b.classList.remove("active"));

inContentMode = false;
lock = false;
idx = 0;

setActivePage(0);

// Start: circle visible, pages NOT visible
pages.forEach(p => p.classList.remove("active"));
showCircle();

function hideAllPages(){
  pages.forEach(p => {
    p.classList.remove("active","portalIn","portalOut");
  });
}


