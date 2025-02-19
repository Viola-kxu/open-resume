document.getElementById('fillButton').addEventListener('click', async () => {
  const tab = await getCurrentTab();
  
  // Get the current URL
  const url = tab.url;
  
  // This would come from your database or storage
  const userData = {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "1234567890",
    gender: "male"
  };

  try {
    const response = await fetch('http://localhost:8000/api/fill-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        userData: userData,
        resumePath: "/path/to/resume.pdf" // Optional
      })
    });

    const result = await response.json();
    
    const status = document.getElementById('status');
    if (response.ok) {
      status.textContent = 'Form filled successfully!';
    } else {
      status.textContent = 'Error filling form: ' + result.detail;
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('status').textContent = 'Error connecting to server';
  }
});

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
} 