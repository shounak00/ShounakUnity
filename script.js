// --------- CANVAS BACKGROUND (your proven logic) ----------
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
let dots = [];

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

for (let i = 0; i < 120; i++) {
  dots.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    dx: (Math.random() - 0.5) * 0.6,
    dy: (Math.random() - 0.5) * 0.6,
    r: Math.random() * 2 + 1
  });
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dots.forEach(d => {
    d.x += d.dx; d.y += d.dy;
    if (d.x < 0 || d.x > canvas.width) d.dx *= -1;
    if (d.y < 0 || d.y > canvas.height) d.dy *= -1;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fillStyle = "#5fa8ff";
    ctx.fill();
  });
  requestAnimationFrame(animate);
}
animate();

// --------- SAFE REVEAL ----------
const reveals = document.querySelectorAll(".reveal");
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      io.unobserve(e.target);
    }
  });
});
reveals.forEach(r => {
  r.classList.add("hidden");
  io.observe(r);
});

// --------- YEAR ----------
document.getElementById("year").textContent = new Date().getFullYear();
