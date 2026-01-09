const track = document.getElementById("track");
const warp = document.getElementById("warp");
const yearEl = document.getElementById("year");

const sClick = document.getElementById("sClick");
const sPortal = document.getElementById("sPortal");
const sHover = document.getElementById("sHover");

if (yearEl) yearEl.textContent = new Date().getFullYear();

let soundOn = true;
function safePlay(aud){
  if (!soundOn) return;
  if (!aud) return;
  try { aud.currentTime = 0; aud.play(); } catch {}
}

function setSoundIcon(){
  const icon = document.getElementById("soundIcon");
  const iconM = document.getElementById("soundIconMobile");
  const glyph = soundOn ? "🔊" : "🔇";
  if (icon) icon.textContent = glyph;
  if (iconM) iconM.textContent = glyph;
}
setSoundIcon();

document.getElementById("soundToggle")?.addEventListener("click", () => {
  soundOn = !soundOn;
  setSoundIcon();
  safePlay(sClick);
});
document.getElementById("soundToggleMobile")?.addEventListener("click", () => {
  soundOn = !soundOn;
  setSoundIcon();
  safePlay(sClick);
});

/* Drawer */
const menuBtn = document.getElementById("menuBtn");
const drawer = document.getElementById("drawer");
menuBtn?.addEventListener("click", () => {
  const open = drawer.getAttribute("aria-hidden") === "false";
  drawer.setAttribute("aria-hidden", open ? "true" : "false");
  safePlay(sClick);
});

/* Cursor glow + warp center */
const glow = document.getElementById("cursorGlow");
if (glow){
  window.addEventListener("mousemove", (e) => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top  = `${e.clientY}px`;
    document.documentElement.style.setProperty("--wx", `${(e.clientX / innerWidth) * 100}%`);
    document.documentElement.style.setProperty("--wy", `${(e.clientY / innerHeight) * 100}%`);
  }, { passive: true });
}

/* Hover sound throttle */
let lastHover = 0;
function hoverPing(){
  const now = performance.now();
  if (now - lastHover < 65) return;
  lastHover = now;
  safePlay(sHover);
}

document.addEventListener("mouseover", (e) => {
  const hit = e.target.closest("button,a,.magnetic,[data-open],[data-nav]");
  if (hit) hoverPing();
}, true);

/* Global click sound */
document.addEventListener("click", (e) => {
  const isClickable = e.target.closest("button,a,[role='button'],[data-open],[data-nav]");
  if (isClickable) safePlay(sClick);
}, true);

/* Magnetic effect */
document.querySelectorAll(".magnetic").forEach((el) => {
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2);
    const y = (e.clientY - r.top - r.height / 2);
    el.style.transform = `translate(${x * 0.14}px, ${y * 0.16}px)`;
  });
  el.addEventListener("mouseleave", () => el.style.transform = "");
});

/* Warp flash */
function warpFlash(){
  if(!warp) return;
  warp.classList.add("on");
  warp.setAttribute("aria-hidden", "false");
  setTimeout(() => {
    warp.classList.remove("on");
    warp.setAttribute("aria-hidden", "true");
  }, 560);
}

/* ====== 2D RAIL COORDS ====== */
const coords = [
  { key: "home",    x: 0, y: 0 },
  { key: "projects",x: 1, y: 0 },
  { key: "resume",  x: 2, y: 0 },
  { key: "reels",   x: 2, y: 1 },
  { key: "updates", x: 1, y: 1 },
  { key: "contact", x: 0, y: 1 }
];

let idx = 0;
let lock = false;

function applyTransform(){
  if(!track) return;
  const c = coords[idx];
  const px = -c.x * innerWidth;
  const py = -c.y * (innerHeight - 72);
  track.style.transform = `translate3d(${px}px, ${py}px, 0)`;
}

function goToKey(key){
  const n = coords.findIndex(c => c.key === key);
  if (n < 0) return;
  idx = n;
  lock = true;
  warpFlash();
  safePlay(sPortal);
  applyTransform();
  setTimeout(() => lock = false, 720);
}

document.querySelectorAll("[data-nav]").forEach(el => {
  el.addEventListener("click", () => {
    const key = el.getAttribute("data-nav");
    drawer?.setAttribute("aria-hidden","true");
    goToKey(key);
  });
});

/* Wheel drives portal movement */
window.addEventListener("wheel", (e) => {
  if (lock) return;
  const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if (Math.abs(d) < 8) return;

  idx = d > 0 ? Math.min(coords.length - 1, idx + 1) : Math.max(0, idx - 1);

  lock = true;
  warpFlash();
  safePlay(sPortal);
  applyTransform();
  setTimeout(() => lock = false, 720);
}, { passive: true });

window.addEventListener("resize", applyTransform, { passive: true });
applyTransform();

/* ===== Modal ===== */
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");

const cases = {
  sit: `
    <h2>SIT CPREP — Clinical Preparedness (NDA)</h2>
    <p class="small">Demo visuals withheld due to NDA.</p>
    <img style="width:100%;border-radius:14px;border:1px solid rgba(255,255,255,.12);" src="./Images/NoNDA.png" alt="NDA"/>
    <ul>
      <li>Scenario execution + assessment systems</li>
      <li>Authoring workflows for SMEs</li>
      <li>xAPI → LRS/LMS analytics</li>
    </ul>
  `,
  jlg: `
    <h2>JLG Crane — Digital Twin (VR) (NDA)</h2>
    <p class="small">Demo visuals withheld due to NDA.</p>
    <img style="width:100%;border-radius:14px;border:1px solid rgba(255,255,255,.12);" src="./Images/NoNDA.png" alt="NDA"/>
    <ul>
      <li>Interaction + constraints + validation</li>
      <li>Physics coordination + safety logic</li>
      <li>VR performance tuning</li>
    </ul>
  `,
  bsbd: `
    <h2>Bus Simulator BD (BSBD) — 2M+ Downloads</h2>
    <ul>
      <li>Android build + release management</li>
      <li>Low-end optimization</li>
      <li>Performance stability improvements</li>
    </ul>
  `,
  trench: `
    <h2>Trench Warfare — 1M+ Downloads</h2>
    <ul><li>AI-driven gameplay systems</li></ul>
  `,
  rem: `
    <h2>The Rem — 500K+ Downloads</h2>
    <ul><li>Modular system architecture</li><li>Performance tuning</li></ul>
  `,
  alex: `
    <h2>AlexanderBall: A Countryball Tale (Steam)</h2>
    <ul><li>Optimized pathfinding</li><li>Large-scale simulation performance</li></ul>
  `
};

function openModal(key){
  if(!modal || !modalBody) return;
  modalBody.innerHTML = cases[key] || "<p>No details yet.</p>";
  modal.setAttribute("aria-hidden", "false");
  safePlay(sPortal);
}
function closeModal(){
  if(!modal) return;
  modal.setAttribute("aria-hidden", "true");
  safePlay(sClick);
}

document.addEventListener("click", (e) => {
  const open = e.target.closest("[data-open]");
  if(open) openModal(open.getAttribute("data-open"));
  if(e.target.closest("[data-close]")) closeModal();
});
document.addEventListener("keydown", (e) => { if(e.key === "Escape") closeModal(); });

/* ===== Reels ===== */
const videos = [
  { id: "Tq9AtJgOwlM", title: "Games Demo Reel 01" },
  { id: "IxZTBGQoEhs", title: "Games Demo Reel 02" }
];
(function renderVideos(){
  const grid = document.getElementById("videoGrid");
  if (!grid) return;
  grid.innerHTML = videos.map(v => `
    <div class="videoCard magnetic">
      <div class="frame">
        <iframe src="https://www.youtube.com/embed/${v.id}" title="${v.title}" frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen></iframe>
      </div>
      <h3>${v.title}</h3>
      <a target="_blank" rel="noreferrer" href="https://www.youtube.com/watch?v=${v.id}">Watch on YouTube →</a>
    </div>
  `).join("");
})();

/* ===== Updates: load posts.json ===== */
async function loadPosts(){
  try{
    const res = await fetch("./posts.json", { cache: "no-store" });
    if(!res.ok) throw new Error("posts.json not found");
    const posts = await res.json();

    posts.sort((a,b) => new Date(b.date) - new Date(a.date));

    // latest 3 on Home
    const latestGrid = document.getElementById("latestGrid");
    if(latestGrid){
      latestGrid.innerHTML = posts.slice(0,3).map(p => `
        <div class="latestItem magnetic">
          <div class="t">${p.title}</div>
          <div class="m">${p.date} • ${(p.tags||[]).join(" / ")}</div>
        </div>
      `).join("");
    }

    // all on Updates page
    const updatesGrid = document.getElementById("updatesGrid");
    if(updatesGrid){
      updatesGrid.innerHTML = posts.map(p => `
        <div class="postCard magnetic">
          <h3>${p.title}</h3>
          <div class="date">${p.date} • ${(p.tags||[]).join(" / ")}</div>
          <div class="excerpt">${p.excerpt}</div>
        </div>
      `).join("");
    }
  }catch(err){
    console.warn("Could not load posts.json", err);
  }
}
loadPosts();

/* ===== Portrait fallback if missing ===== */
(function portraitCheck(){
  const img = document.getElementById("portraitImg");
  const fb = document.getElementById("portraitFallback");
  if(!img || !fb) return;

  img.addEventListener("error", () => {
    fb.classList.add("show");
    fb.setAttribute("aria-hidden","false");
  });
})();

/* ===== Canvas particles ===== */
const canvas = document.getElementById("fx");
if (canvas){
  const ctx = canvas.getContext("2d");
  let W,H,dots=[];
  function resize(){
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
    const count = Math.min(260, Math.floor(W/7));
    dots = new Array(count).fill(0).map(() => ({
      x: Math.random()*W, y: Math.random()*H,
      r: 1 + Math.random()*1.8,
      dx: (Math.random()-0.5)*0.55,
      dy: (Math.random()-0.5)*0.55
    }));
  }
  addEventListener("resize", resize);
  resize();

  (function animate(){
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation = "lighter";

    for (let i=0;i<dots.length;i++){
      const p=dots[i];
      p.x+=p.dx; p.y+=p.dy;
      if(p.x<0||p.x>W) p.dx*=-1;
      if(p.y<0||p.y>H) p.dy*=-1;

      ctx.fillStyle="rgba(0,229,255,0.16)";
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();

      for(let j=i+1;j<dots.length;j++){
        const q=dots[j];
        const dx=p.x-q.x, dy=p.y-q.y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<140){
          const a = 0.14*(1-d/140);
          ctx.strokeStyle = `rgba(255,23,68,${a})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x,p.y);
          ctx.lineTo(q.x,q.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(animate);
  })();
}
