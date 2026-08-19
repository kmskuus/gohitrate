/**
 * results.js
 * Handles rendering of test results, loading state, and error messages.
 * Depends on: graph.js (drawGraph called after results are rendered)
 */

/**
 * Sets the loading state of the Run Test button.
 * Called by index.js before and after the fetch request.
 * @param {boolean} loading - true to show loading state, false to restore
 */
function setLoading(loading) {
  const startButton = document.getElementById("start");
  startButton.disabled = loading;
  startButton.textContent = loading ? "Running..." : "Run Test";
}

/**
 * Renders an error message in the results section.
 * Called by index.js when the fetch fails or the backend returns an error.
 * @param {string} message - error message to display
 */
function showError(message) {
  const resultsSection = document.querySelector(".results");
  resultsSection.innerHTML = `
    <h2>Results</h2>
    <p class="error">${message}</p>
  `;
}

/**
 * Renders the test results summary and latency graph in the results section.
 * Called by index.js after a successful test run.
 * @param {Object} data - response from /api/run
 * @param {number} data.totalRequests
 * @param {number} data.successRate
 * @param {string} data.meanLatency
 * @param {string} data.p95Latency
 * @param {string[]} data.errors
 * @param {Array<{second: number, latency: number, success: boolean}>} data.timeline
 */
function showResults(data) {
  const resultsSection = document.querySelector(".results");

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

  // draw graph if timeline data is available
  if (data.timeline && data.timeline.length > 1) {
    lastTimeline = data.timeline;
    drawGraph(data.timeline);
  }
}
