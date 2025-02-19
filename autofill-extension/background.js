chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// Handle any background tasks
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getFormData") {
    // Handle form data requests
    sendResponse({ status: "success" });
  }
}); 