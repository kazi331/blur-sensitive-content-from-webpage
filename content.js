let isBlurringEnabled = false;
let isToolbarVisible = false;
let blurIntensity = 5; // Default blur radius in pixels
const blurredElements = new Set();

// Create toolbar
const toolbar = document.createElement("div");
toolbar.id = "blur-extension-toolbar";
toolbar.style.display = "none"; // Initially hidden
toolbar.innerHTML = `
  <div class="blur-toolbar">
    <button id="toggle-blur">Enable Blurring</button>
    <label>Blur Intensity: <input type="range" id="blur-slider" min="0" max="20" value="${blurIntensity}"></label>
    <button id="clear-blur">Clear All Blurs</button>
    <span id="blur-status">Blurring: ${isBlurringEnabled ? "ON" : "OFF"}</span>
  </div>
`;
document.body.appendChild(toolbar);

// Highlight styles
const style = document.createElement("style");
style.textContent = `
  .blur-highlight {
    outline: 2px solid #ff6b6b !important;
    background-color: rgba(255, 107, 107, 0.2) !important;
    cursor: pointer;
  }
  .blur-applied {
    filter: blur(${blurIntensity}px) !important;
    transition: filter 0.3s ease;
  }
`;
document.head.appendChild(style);

// Event listeners for toolbar
document.getElementById("toggle-blur").addEventListener("click", () => {
  isBlurringEnabled = !isBlurringEnabled;
  document.getElementById("blur-status").textContent = `Blurring: ${
    isBlurringEnabled ? "ON" : "OFF"
  }`;
  document.getElementById("toggle-blur").textContent = isBlurringEnabled
    ? "Disable Blurring"
    : "Enable Blurring";
  chrome.storage.local.set({ blurringEnabled: isBlurringEnabled });
  if (!isBlurringEnabled && currentHover) {
    currentHover.classList.remove("blur-highlight");
    currentHover = null;
  }
});

document.getElementById("blur-slider").addEventListener("input", (e) => {
  blurIntensity = parseInt(e.target.value, 10);
  blurredElements.forEach((element) => {
    element.style.filter = `blur(${blurIntensity}px)`;
  });
});

document.getElementById("clear-blur").addEventListener("click", () => {
  blurredElements.forEach((element) => {
    element.classList.remove("blur-applied");
    element.style.filter = "";
  });
  blurredElements.clear();
});

// Hover and click handling
let currentHover = null;

function handleMouseOver(e) {
  if (!isBlurringEnabled || !isToolbarVisible) return;
  const target = e.target;
  if (target === toolbar || toolbar.contains(target)) return;
  if (currentHover) currentHover.classList.remove("blur-highlight");
  currentHover = target;
  currentHover.classList.add("blur-highlight");
}

function handleMouseOut(e) {
  if (!isBlurringEnabled || !isToolbarVisible) return;
  if (currentHover) {
    currentHover.classList.remove("blur-highlight");
    currentHover = null;
  }
}

function handleClick(e) {
  if (!isBlurringEnabled || !isToolbarVisible) return;
  const target = e.target;
  if (target === toolbar || toolbar.contains(target)) return;
  e.preventDefault(); // Prevent default actions like clicking links
  if (blurredElements.has(target)) {
    target.classList.remove("blur-applied");
    target.style.filter = "";
    blurredElements.delete(target);
  } else {
    target.classList.add("blur-applied");
    target.style.filter = `blur(${blurIntensity}px)`;
    blurredElements.add(target);
  }
}

// Add event listeners to the document
document.addEventListener("mouseover", handleMouseOver);
document.addEventListener("mouseout", handleMouseOut);
document.addEventListener("click", handleClick);

// Load saved state
chrome.storage.local.get(["blurringEnabled", "toolbarVisible"], (result) => {
  isBlurringEnabled = result.blurringEnabled || false;
  isToolbarVisible = result.toolbarVisible || false;
  document.getElementById("blur-status").textContent = `Blurring: ${
    isBlurringEnabled ? "ON" : "OFF"
  }`;
  document.getElementById("toggle-blur").textContent = isBlurringEnabled
    ? "Disable Blurring"
    : "Enable Blurring";
  toolbar.style.display = isToolbarVisible ? "block" : "none";
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleToolbar") {
    isToolbarVisible = !isToolbarVisible;
    toolbar.style.display = isToolbarVisible ? "block" : "none";
    chrome.storage.local.set({ toolbarVisible: isToolbarVisible });
    if (!isToolbarVisible && currentHover) {
      currentHover.classList.remove("blur-highlight");
      currentHover = null;
    }
    sendResponse({ status: "success" });
  }
});
