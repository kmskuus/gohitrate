/**
 * index.js
 * Main entry point for GoHitRate frontend.
 * Wires together form interactions, payload collection, and the test run request.
 * Depends on: graph.js, theme.js, results.js
 */

// tracks the last test timeline for graph redraw on theme switch
let lastTimeline = null;

// DOM references
const form = {
  url: document.getElementById("url"),
  method: document.getElementById("method"),
  rps: document.getElementById("rps"),
  duration: document.getElementById("duration"),
};
const startButton = document.getElementById("start");
const payloadToggle = document.getElementById("payload-toggle");
const payloadContent = document.getElementById("payload-content");

// --- request summary ---

/**
 * Updates the request summary line below the RPS and duration fields.
 * Recalculates total requests on every input change.
 */
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

// --- payload toggle ---

payloadToggle.addEventListener("click", () => {
  const isOpen = payloadContent.classList.contains("open");
  payloadContent.classList.toggle("open");
  payloadToggle.textContent = isOpen
    ? "▶ Request Payload (optional)"
    : "▼ Request Payload (optional)";
});

// --- headers ---

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

// --- run test ---

startButton.addEventListener("click", async () => {
  const url = form.url.value.trim();
  if (!url) {
    showError("Please enter a target URL");
    return;
  }

  // collect headers from dynamically added header rows
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

  // collect optional request body
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
    showError("Could not connect to GoHitRate server");
  } finally {
    setLoading(false);
  }
});
