const canvas = document.querySelector("#latent-canvas");
const ctx = canvas.getContext("2d");
const pointer = { x: 0.68, y: 0.42, active: false };
let width = 0;
let height = 0;
let dpr = 1;
let nodes = [];
let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildNodes();
}

function buildNodes() {
  const count = Math.max(34, Math.floor(width / 24));
  nodes = Array.from({ length: count }, (_, i) => {
    const cluster = i % 3;
    const baseX = cluster === 0 ? 0.58 : cluster === 1 ? 0.76 : 0.88;
    const baseY = cluster === 0 ? 0.35 : cluster === 1 ? 0.58 : 0.24;
    return {
      x: width * (baseX + (Math.random() - 0.5) * 0.24),
      y: height * (baseY + (Math.random() - 0.5) * 0.38),
      r: 2 + Math.random() * 4,
      phase: Math.random() * Math.PI * 2,
      kind: cluster,
    };
  });
}

function drawGrid(time) {
  const spacing = Math.max(44, Math.floor(width / 18));
  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.strokeStyle = "#f5f1e8";
  ctx.lineWidth = 1;
  for (let x = -spacing; x < width + spacing; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x + Math.sin(time * 0.0002 + x) * 5, 0);
    ctx.lineTo(x - width * 0.1, height);
    ctx.stroke();
  }
  for (let y = -spacing; y < height + spacing; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(width * 0.42, y);
    ctx.lineTo(width, y + Math.cos(time * 0.0003 + y) * 6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawReachability(time) {
  const px = width * pointer.x;
  const py = height * pointer.y;
  const radius = Math.min(width, height) * (0.19 + Math.sin(time * 0.001) * 0.012);
  const colors = ["#43d9b8", "#f0b35f", "#ec6f5f"];

  ctx.save();
  const glow = ctx.createRadialGradient(px, py, 0, px, py, radius * 1.8);
  glow.addColorStop(0, "rgba(67, 217, 184, 0.34)");
  glow.addColorStop(0.48, "rgba(159, 218, 103, 0.12)");
  glow.addColorStop(1, "rgba(67, 217, 184, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(px, py, radius * 1.8, 0, Math.PI * 2);
  ctx.fill();

  [1, 1.42, 1.84].forEach((scale, idx) => {
    ctx.globalAlpha = 0.5 - idx * 0.11;
    ctx.strokeStyle = idx === 0 ? "#43d9b8" : idx === 1 ? "#f0b35f" : "#ec6f5f";
    ctx.lineWidth = idx === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.arc(px, py, radius * scale, 0, Math.PI * 2);
    ctx.stroke();
  });

  nodes.forEach((node, i) => {
    const bob = reducedMotion ? 0 : Math.sin(time * 0.001 + node.phase) * 7;
    const x = node.x + (reducedMotion ? 0 : Math.cos(time * 0.0007 + node.phase) * 5);
    const y = node.y + bob;
    const dist = Math.hypot(x - px, y - py);
    const reachable = dist < radius * 1.42;
    ctx.globalAlpha = reachable ? 0.86 : 0.32;
    ctx.fillStyle = reachable ? colors[node.kind] : "#f5f1e8";
    ctx.beginPath();
    ctx.arc(x, y, node.r, 0, Math.PI * 2);
    ctx.fill();

    for (let j = i + 1; j < nodes.length; j += 5) {
      const other = nodes[j];
      const ox = other.x + (reducedMotion ? 0 : Math.cos(time * 0.0007 + other.phase) * 5);
      const oy = other.y + (reducedMotion ? 0 : Math.sin(time * 0.001 + other.phase) * 7);
      const linkDist = Math.hypot(x - ox, y - oy);
      if (linkDist < 150) {
        ctx.globalAlpha = reachable ? 0.22 : 0.08;
        ctx.strokeStyle = reachable ? "#43d9b8" : "#f5f1e8";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(ox, oy);
        ctx.stroke();
      }
    }
  });

  const path = [
    [width * 0.52, height * 0.72],
    [width * 0.6, height * 0.62],
    [width * 0.67, height * 0.52],
    [px, py],
    [width * 0.82, height * 0.31],
  ];
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = "#9fda67";
  ctx.lineWidth = 3;
  ctx.beginPath();
  path.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
}

function draw(time = 0) {
  ctx.clearRect(0, 0, width, height);
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#0b1110");
  bg.addColorStop(0.52, "#17231f");
  bg.addColorStop(1, "#30241c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  drawGrid(time);
  drawReachability(time);

  if (!reducedMotion) {
    requestAnimationFrame(draw);
  }
}

window.addEventListener("resize", resizeCanvas);
canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer.x = (event.clientX - rect.left) / rect.width;
  pointer.y = (event.clientY - rect.top) / rect.height;
  pointer.active = true;
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.querySelector(button.dataset.copy);
    const text = target ? target.innerText.trim() : "";
    if (!text) return;
    const original = button.textContent;
    let copied = false;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch (error) {
      copied = false;
    }

    if (!copied) {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      copied = document.execCommand("copy");
      helper.remove();
    }

    button.textContent = copied ? "Copied" : "Select BibTeX";
    setTimeout(() => {
      button.textContent = original;
    }, 1300);
  });
});

resizeCanvas();
draw();
