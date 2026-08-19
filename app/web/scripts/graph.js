/**
 * graph.js
 * Draws the latency over time chart on a canvas element.
 * Called by results.js after a test completes and by theme.js on theme switch.
 */

/**
 * Draws a latency over time line chart on the #latency-graph canvas.
 * Adapts grid and fill colors based on the current theme.
 * @param {Array<{second: number, latency: number, success: boolean}>} timeline
 */
function drawGraph(timeline) {
  const container = document.getElementById("graph-container");
  const canvas = document.getElementById("latency-graph");
  container.style.display = "block";

  // scale canvas for high DPI displays
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = 200 * dpr;

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const width = canvas.offsetWidth;
  const height = 200;
  const padding = { top: 10, right: 20, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  const latencies = timeline.map((d) => d.latency);
  const maxLatency = Math.max(...latencies);
  const minLatency = 0;

  // use theme-appropriate colors for grid and fill
  const isDark = !document.body.classList.contains("light");

  // grid lines and y axis labels
  ctx.strokeStyle = isDark ? "#2d3148" : "#e2e8f0";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartWidth, y);
    ctx.stroke();

    const value = maxLatency - (maxLatency / 4) * i;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px system-ui";
    ctx.textAlign = "right";
    ctx.fillText(value.toFixed(2) + "ms", padding.left - 6, y + 4);
  }

  // x axis labels — show first, last, and evenly spaced points
  ctx.fillStyle = "#94a3b8";
  ctx.font = "11px system-ui";
  ctx.textAlign = "center";
  timeline.forEach((d, i) => {
    if (
      i === 0 ||
      i === timeline.length - 1 ||
      i % Math.ceil(timeline.length / 5) === 0
    ) {
      const x = padding.left + (i / (timeline.length - 1)) * chartWidth;
      ctx.fillText(d.second + "s", x, height - 8);
    }
  });

  // latency line
  ctx.strokeStyle = "#4f6ef7";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  timeline.forEach((d, i) => {
    const x = padding.left + (i / (timeline.length - 1)) * chartWidth;
    const y =
      padding.top +
      chartHeight -
      ((d.latency - minLatency) / (maxLatency - minLatency)) * chartHeight;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // fill area under the line
  ctx.fillStyle = isDark
    ? "rgba(79, 110, 247, 0.1)"
    : "rgba(79, 110, 247, 0.15)";
  ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  ctx.lineTo(padding.left, padding.top + chartHeight);
  ctx.closePath();
  ctx.fill();

  // dots at each data point
  ctx.fillStyle = "#4f6ef7";
  timeline.forEach((d, i) => {
    const x = padding.left + (i / (timeline.length - 1)) * chartWidth;
    const y =
      padding.top +
      chartHeight -
      ((d.latency - minLatency) / (maxLatency - minLatency)) * chartHeight;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}
