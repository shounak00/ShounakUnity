const menuBtn = document.getElementById("menuBtn");
const drawer = document.getElementById("drawer");
menuBtn?.addEventListener("click", () => {
  const open = drawer.getAttribute("aria-hidden") === "false";
  drawer.setAttribute("aria-hidden", open ? "true" : "false");
});
document.getElementById("year").textContent = new Date().getFullYear();

const glow = document.getElementById("cursorGlow");
if (glow){
  window.addEventListener("mousemove", (e) => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top  = `${e.clientY}px`;
  }, { passive: true });
}

const revealEls = document.querySelectorAll(".reveal");
revealEls.forEach(el => el.classList.add("hidden"));
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      e.target.classList.remove("hidden");
      io.unobserve(e.target);
    }
  });
},{ threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

// Canvas
const canvas = document.getElementById("fx");
const ctx = canvas.getContext("2d");
let W,H,dots=[];
function resize(){
  W=canvas.width=innerWidth;
  H=canvas.height=innerHeight;
  const count = Math.min(190, Math.floor(W/10));
  dots=new Array(count).fill(0).map(()=>({
    x:Math.random()*W, y:Math.random()*H,
    r:1+Math.random()*1.8,
    dx:(Math.random()-0.5)*0.4,
    dy:(Math.random()-0.5)*0.4
  }));
}
addEventListener("resize", resize);
resize();
(function anim(){
  ctx.clearRect(0,0,W,H);
  ctx.globalCompositeOperation="lighter";
  for(const p of dots){
    p.x+=p.dx; p.y+=p.dy;
    if(p.x<0||p.x>W) p.dx*=-1;
    if(p.y<0||p.y>H) p.dy*=-1;
    ctx.fillStyle="rgba(0,245,255,0.16)";
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
  }
  ctx.globalCompositeOperation="source-over";
  requestAnimationFrame(anim);
})();

const reels = [
  { id:"Tq9AtJgOwlM", title:"Demo Reel — Medical Simulation / XR" },
  { id:"IxZTBGQoEhs", title:"Demo Reel — Digital Twin / Systems" }
];

document.getElementById("reelsGrid").innerHTML = reels.map(v => `
  <div class="videoCard reveal">
    <div class="frame">
      <iframe src="https://www.youtube.com/embed/${v.id}" title="${v.title}" frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen></iframe>
    </div>
    <h3>${v.title}</h3>
    <a target="_blank" rel="noreferrer" href="https://www.youtube.com/watch?v=${v.id}">Watch on YouTube →</a>
  </div>
`).join("");
