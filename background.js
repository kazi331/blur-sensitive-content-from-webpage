chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ blurringEnabled: false, toolbarVisible: false });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.storage.local.get(["toolbarVisible"], (result) => {
    const isVisible = !result.toolbarVisible;
    chrome.storage.local.set({ toolbarVisible: isVisible });
    chrome.tabs.sendMessage(tab.id, {
      action: "toggleToolbar",
      visible: isVisible,
    });
  });
});
