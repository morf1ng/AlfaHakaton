// scripts/loader.js
const canvas = document.getElementById('loader-canvas');
const ctx = canvas.getContext('2d');

let start = performance.now();
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

// Атом: три синусоиды разного цвета и фаза
function drawAtom(time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // glow mask
  ctx.save();
  ctx.shadowColor = '#fff8';
  ctx.shadowBlur = 16;

  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = ['#ff595e', '#ffca3a', '#8ac926'][i];
    let phase = i * Math.PI / 3 + time/980;
    for (let t = 0; t <= Math.PI * 2; t += 0.02) {
      let R = 34;
      let x = centerX + Math.cos(t + phase) * R + Math.cos(t * 3 + i + time/850) * 5;
      let y = centerY + Math.sin(t + phase) * R + Math.sin(t * 2 + i + time/930) * 5;
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function animate() {
  const now = performance.now();
  drawAtom(now - start);
  requestAnimationFrame(animate);
}

if (canvas && ctx) {
  animate();
}
