/**
 * theme.js
 * Manages dark/light theme switching, system preference detection,
 * and theme persistence via localStorage.
 * Depends on: graph.js (redraws graph on theme change if results exist)
 */

// theme toggle DOM elements
const themeToggle = document.getElementById("theme-toggle");
const toggleDark = document.getElementById("toggle-dark");
const toggleLight = document.getElementById("toggle-light");
const pillHighlight = document.getElementById("pill-highlight");

/**
 * Sets the active theme and updates the pill toggle position.
 * Persists the selection to localStorage and redraws the graph if results exist.
 * Called on page load and when the user clicks either toggle option.
 * @param {string} theme - "dark" or "light"
 */
function setTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  localStorage.setItem("theme", theme);

  // update pill toggle active state
  const activeEl = theme === "dark" ? toggleDark : toggleLight;
  const inactiveEl = theme === "dark" ? toggleLight : toggleDark;
  activeEl.classList.add("active");
  inactiveEl.classList.remove("active");

  // slide the pill highlight to the active option
  pillHighlight.style.width = activeEl.offsetWidth + "px";
  pillHighlight.style.transform = `translateX(${activeEl.offsetLeft - 3}px)`;

  // redraw graph with updated theme colors if results are visible
  if (typeof lastTimeline !== "undefined" && lastTimeline) {
    drawGraph(lastTimeline);
  }
}

// initialize theme from localStorage or fall back to system preference
const savedTheme = localStorage.getItem("theme");
const systemPrefersDark = window.matchMedia(
  "(prefers-color-scheme: dark)",
).matches;
setTheme(savedTheme || (systemPrefersDark ? "dark" : "light"));

// toggle handlers — each option sets its specific theme
toggleDark.addEventListener("click", () => setTheme("dark"));
toggleLight.addEventListener("click", () => setTheme("light"));
