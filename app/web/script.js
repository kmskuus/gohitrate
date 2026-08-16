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
    `;
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
