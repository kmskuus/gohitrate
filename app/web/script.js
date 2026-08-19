let lastTimeline = null;

//theme toggle
const themeToggle = document.getElementById("theme-toggle");
const toggleDark = document.getElementById("toggle-dark");
const toggleLight = document.getElementById("toggle-light");
const pillHighlight = document.getElementById("pill-highlight");

function setTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  localStorage.setItem("theme", theme);

  const activeEl = theme === "dark" ? toggleDark : toggleLight;
  const inactiveEl = theme === "dark" ? toggleLight : toggleDark;

  activeEl.classList.add("active");
  inactiveEl.classList.remove("active");

  pillHighlight.style.width = activeEl.offsetWidth + "px";
  pillHighlight.style.transform = `translateX(${activeEl.offsetLeft - 3}px)`;

  // redraw graph with new theme colors if results exist
  if (lastTimeline) {
    drawGraph(lastTimeline);
  }
}

const savedTheme = localStorage.getItem("theme");
const systemPrefersDark = window.matchMedia(
  "(prefers-color-scheme: dark)",
).matches;
setTheme(savedTheme || (systemPrefersDark ? "dark" : "light"));

toggleDark.addEventListener("click", () => setTheme("dark"));
toggleLight.addEventListener("click", () => setTheme("light"));

//form handling
const form = {
  url: document.getElementById("url"),
  method: document.getElementById("method"),
  rps: document.getElementById("rps"),
  duration: document.getElementById("duration"),
};

const startButton = document.getElementById("start");
const resultsSection = document.querySelector(".results");

startButton.addEventListener("click", async () => {
  const url = form.url.value.trim();
  if (!url) {
    showError("Please enter a target URL");
    return;
  }

  // collect headers
  const headerRows = document.querySelectorAll(".header-row");
  const headers = {};
  headerRows.forEach((row) => {
    const inputs = row.querySelectorAll("input");
    const key = inputs[0].value.trim();
    const value = inputs[1].value.trim();
    if (key && value) {
      headers[key] = value;
    }
  });

  // collect body
  const body = document.getElementById("body").value.trim();

  setLoading(true);

  try {
    const response = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: url,
        method: form.method.value,
        rps: parseInt(form.rps.value),
        duration: parseInt(form.duration.value),
        body: body,
        headers: headers,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      showError(data.error);
      return;
    }

    showResults(data);
  } catch (err) {
    console.log("Fetch error:", err);
    showError("Could not connect to GoHitRate server");
  } finally {
    setLoading(false);
  }
});

// payload toggle
const payloadToggle = document.getElementById("payload-toggle");
const payloadContent = document.getElementById("payload-content");

payloadToggle.addEventListener("click", () => {
  const isOpen = payloadContent.classList.contains("open");
  payloadContent.classList.toggle("open");
  payloadToggle.textContent = isOpen
    ? "▶ Request Payload (optional)"
    : "▼ Request Payload (optional)";
});

// headers
document.getElementById("add-header").addEventListener("click", () => {
  const row = document.createElement("div");
  row.className = "header-row";
  row.innerHTML = `
        <input type="text" placeholder="Header name">
        <input type="text" placeholder="Value">
        <button class="remove-header" onclick="this.parentElement.remove()">×</button>
    `;
  document.getElementById("headers-list").appendChild(row);
});

function setLoading(loading) {
  startButton.disabled = loading;
  startButton.textContent = loading ? "Running..." : "Run Test";
}

function showError(message) {
  resultsSection.innerHTML = `
        <h2>Results</h2>
        <p class="error">${message}</p>
    `;
}

function showResults(data) {
  resultsSection.innerHTML = `
        <h2>Results</h2>
        <div class="result-grid">
            <div class="result-item">
                <span class="result-label">Total Requests</span>
                <span class="result-value">${data.totalRequests}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Success Rate</span>
                <span class="result-value">${data.successRate.toFixed(1)}%</span>
            </div>
            <div class="result-item">
                <span class="result-label">Mean Latency</span>
                <span class="result-value">${data.meanLatency}</span>
            </div>
            <div class="result-item">
                <span class="result-label">P95 Latency</span>
                <span class="result-value">${data.p95Latency}</span>
            </div>
        </div>
        ${
          data.errors && data.errors.length > 0
            ? `
        <div class="errors">
            <h3>Errors</h3>
            ${data.errors.map((e) => `<p class="error">${e}</p>`).join("")}
        </div>`
            : ""
        }
        <div id="graph-container">
            <h3 class="graph-title">Latency Over Time</h3>
            <canvas id="latency-graph"></canvas>
        </div>
    `;

  if (data.timeline && data.timeline.length > 1) {
    lastTimeline = data.timeline;
    drawGraph(data.timeline);
  }
}

function updateRequestSummary() {
  const rps = parseInt(form.rps.value) || 0;
  const duration = parseInt(form.duration.value) || 0;
  const total = rps * duration;
  document.getElementById("request-summary").textContent =
    `${rps} req/s × ${duration}s = ${total} total requests`;
}

form.rps.addEventListener("input", updateRequestSummary);
form.duration.addEventListener("input", updateRequestSummary);
updateRequestSummary();

function drawGraph(timeline) {
  const container = document.getElementById("graph-container");
  const canvas = document.getElementById("latency-graph");
  container.style.display = "block";

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

  // clear
  ctx.clearRect(0, 0, width, height);

  const latencies = timeline.map((d) => d.latency);
  const maxLatency = Math.max(...latencies);
  const minLatency = 0;

  // grid lines
  const isDark = !document.body.classList.contains("light");
  ctx.strokeStyle = isDark ? "#2d3148" : "#e2e8f0";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartWidth, y);
    ctx.stroke();

    // y axis labels
    const value = maxLatency - (maxLatency / 4) * i;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px system-ui";
    ctx.textAlign = "right";
    ctx.fillText(value.toFixed(2) + "ms", padding.left - 6, y + 4);
  }

  // x axis labels
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

  // line
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

  // fill under line
  ctx.fillStyle = isDark
    ? "rgba(79, 110, 247, 0.1)"
    : "rgba(79, 110, 247, 0.15)";
  ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  ctx.lineTo(padding.left, padding.top + chartHeight);
  ctx.closePath();
  ctx.fill();

  // dots on data points
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
