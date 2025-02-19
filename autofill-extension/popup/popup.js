document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup loaded');
  const fillButton = document.getElementById('fillButton');
  const statusDiv = document.getElementById('status');
  
  if (!fillButton || !statusDiv) {
    console.error('Required elements not found!');
    return;
  }

  fillButton.addEventListener('click', async () => {
    try {
      const tab = await getCurrentTab();
      statusDiv.textContent = 'Getting form data...';

      const response = await fetch('http://localhost:8000/api/fill-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: tab.url, userData: {} })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${await response.text()}`);
      }

      const result = await response.json();
      // Send data to content script
      chrome.tabs.sendMessage(tab.id, {
        action: "fillForm",
        userData: result.userData  // Add this to your backend response
      });

      statusDiv.textContent = 'Form filled successfully!';
    } catch (error) {
      console.error('Error:', error);
      statusDiv.textContent = `Error: ${error.message}`;
    }
  });
});

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
} 