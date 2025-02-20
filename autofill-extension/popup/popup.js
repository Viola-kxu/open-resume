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

      // First ensure the content script is loaded
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['scripts/content.js']
      }).catch(err => console.log('Content script already loaded'));

      const response = await fetch('http://localhost:8000/api/fill-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: tab.url, userData: {} })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${await response.text()}`);
      }

      const result = await response.json();
      
      // Add timeout to ensure content script is ready
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: "fillForm",
            userData: result.userData
          });
          statusDiv.textContent = 'Form filled successfully!';
        } catch (error) {
          console.error('Message sending error:', error);
          statusDiv.textContent = `Error: ${error.message}`;
        }
      }, 100);

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