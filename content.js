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
    <button id="toggle-blur" title="${
      isBlurringEnabled ? "Disable Blurring" : "Enable Blurring"
    }">👁️</button>
    <label title="Blur Intensity"><input type="range" id="blur-slider" min="0" max="20" value="${blurIntensity}"></label>
    <button id="clear-blur" title="Clear All Blurs">🧹</button>
  </div>
`;
document.body.appendChild(toolbar);

// Highlight styles
const style = document.createElement("style");
style.textContent = `
  .blur-highlight {
    outline: 1px solid #ff6b6b !important;
    background-color: rgba(255, 107, 107, 0.1) !important;
    border-radius: 4px !important;
    cursor: pointer;
  }
  .blur-applied {
    transition: filter 0.3s ease;
  }
`;
document.head.appendChild(style);

// Event listeners for toolbar
document.getElementById("toggle-blur").addEventListener("click", () => {
  isBlurringEnabled = !isBlurringEnabled;
  const toggleButton = document.getElementById("toggle-blur");
  toggleButton.title = isBlurringEnabled
    ? "Disable Blurring"
    : "Enable Blurring";
  toggleButton.className = isBlurringEnabled ? "enabled" : "disabled";
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

// Function to handle all page events when blurring is active
function handlePageEvent(e) {
  // If blurring is enabled and toolbar is visible
  if (isBlurringEnabled && isToolbarVisible) {
    // Allow events on the toolbar
    if (e.target === toolbar || toolbar.contains(e.target)) {
      return;
    }
    // Prevent default behavior and stop propagation for all other elements
    e.preventDefault();
    e.stopPropagation();
    
    // For mouseover events, handle highlighting
    if (e.type === 'mouseover') {
      if (currentHover) currentHover.classList.remove("blur-highlight");
      currentHover = e.target;
      currentHover.classList.add("blur-highlight");
    }
    
    // For mouseout events, remove highlighting
    else if (e.type === 'mouseout') {
      if (currentHover) {
        currentHover.classList.remove("blur-highlight");
        currentHover = null;
      }
    }
    
    // For click events, toggle blur
    else if (e.type === 'click') {
      if (blurredElements.has(e.target)) {
        e.target.classList.remove("blur-applied");
        e.target.style.filter = "";
        blurredElements.delete(e.target);
      } else {
        e.target.classList.add("blur-applied");
        e.target.style.filter = `blur(${blurIntensity}px)`;
        blurredElements.add(e.target);
      }
    }
  }
}

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

// Add event listeners to the document with capture phase to intercept events before they reach their targets
document.addEventListener("mouseover", handlePageEvent, true);
document.addEventListener("mouseout", handlePageEvent, true);
document.addEventListener("click", handlePageEvent, true);
document.addEventListener("mousedown", handlePageEvent, true);
document.addEventListener("mouseup", handlePageEvent, true);
document.addEventListener("contextmenu", handlePageEvent, true);
document.addEventListener("dblclick", handlePageEvent, true);
document.addEventListener("touchstart", handlePageEvent, true);
document.addEventListener("touchend", handlePageEvent, true);
document.addEventListener("touchmove", handlePageEvent, true);

// Load saved state
chrome.storage.local.get(["blurringEnabled", "toolbarVisible"], (result) => {
  isBlurringEnabled = result.blurringEnabled || false;
  isToolbarVisible = result.toolbarVisible || false;
  const toggleButton = document.getElementById("toggle-blur");
  toggleButton.title = isBlurringEnabled
    ? "Disable Blurring"
    : "Enable Blurring";
  toggleButton.className = isBlurringEnabled ? "enabled" : "disabled";
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
