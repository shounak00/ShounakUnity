// Drawer + year + reveals + canvas (same vibe)
const menuBtn = document.getElementById("menuBtn");
const drawer = document.getElementById("drawer");
menuBtn?.addEventListener("click", () => {
  const open = drawer.getAttribute("aria-hidden") === "false";
  drawer.setAttribute("aria-hidden", open ? "true" : "false");
});
document.getElementById("year").textContent = new Date().getFullYear();

// Reveal
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

// Canvas background
const canvas = document.getElementById("fx");
const ctx = canvas.getContext("2d");
let W,H,dots=[];
function resize(){
  W = canvas.width = innerWidth;
  H = canvas.height = innerHeight;
  const count = Math.min(150, Math.floor(W/12));
  dots = new Array(count).fill(0).map(()=>({
    x:Math.random()*W, y:Math.random()*H,
    r:1+Math.random()*1.6,
    dx:(Math.random()-0.5)*0.3,
    dy:(Math.random()-0.5)*0.3
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
    ctx.fillStyle="rgba(177,108,255,0.14)";
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
  }
  ctx.globalCompositeOperation="source-over";
  requestAnimationFrame(anim);
})();

// ------------------------------
// Load metadata from posts.json then load markdown
// ------------------------------
const slug = new URLSearchParams(location.search).get("slug");
const metaEl = document.getElementById("postMeta");
const titleEl = document.getElementById("postTitle");
const excerptEl = document.getElementById("postExcerpt");
const bodyEl = document.getElementById("postBody");

function escapeHtml(s){
  return (s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

(async function load(){
  if(!slug){
    titleEl.textContent = "Post not found";
    bodyEl.innerHTML = "<p class='small'>Missing ?slug= in URL.</p>";
    return;
  }

  try{
    const res = await fetch("./posts/posts.json", { cache:"no-store" });
    const posts = await res.json();
    const post = posts.find(p => p.slug === slug);

    if(!post){
      titleEl.textContent = "Post not found";
      bodyEl.innerHTML = "<p class='small'>This post slug does not exist in posts.json.</p>";
      return;
    }

    document.title = `${post.title} — Shounak`;
    metaEl.textContent = `${new Date(post.date).toDateString()} • ${post.tag}`;
    titleEl.textContent = post.title;
    excerptEl.textContent = post.excerpt || "";

    // Load markdown
    const mdRes = await fetch(`./posts/${slug}.md`, { cache:"no-store" });
    if(!mdRes.ok) throw new Error("Markdown not found");
    const md = await mdRes.text();

    // Render markdown safely (marked)
    bodyEl.innerHTML = marked.parse(md);

    // Add some basic styling hooks
    bodyEl.querySelectorAll("h1,h2,h3").forEach(h => {
      h.style.marginTop = "18px";
      h.style.marginBottom = "10px";
    });
    bodyEl.querySelectorAll("p,li").forEach(p => {
      p.style.color = "rgba(255,255,255,.88)";
      p.style.lineHeight = "1.65";
    });
    bodyEl.querySelectorAll("a").forEach(a => {
      a.setAttribute("target","_blank");
      a.setAttribute("rel","noreferrer");
    });

  }catch(e){
    titleEl.textContent = "Could not load post";
    bodyEl.innerHTML = `<p class="small">Make sure <code>posts/posts.json</code> and <code>posts/${escapeHtml(slug)}.md</code> exist.</p>`;
  }
})();
