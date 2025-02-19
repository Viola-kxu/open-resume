// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fillForm") {
        console.log("Filling form with data:", request.userData);
        fillForm(request.userData);
        sendResponse({ status: "success" });
    }
});

function fillForm(userData) {
    // Fill basic fields
    fillField('first_name', userData.firstName);
    fillField('last_name', userData.lastName);
    fillField('email', userData.email);
    fillField('phone', userData.phone);

    // Fill LinkedIn URL
    const linkedinInputs = document.querySelectorAll('input[placeholder*="LinkedIn"], input[aria-label*="LinkedIn"]');
    if (linkedinInputs.length > 0) {
        fillField(linkedinInputs[0], userData.linkedin_url);
    }

    // Handle both React-Select and standard dropdowns
    handleDropdown('gender', userData.gender);
    handleDropdown('[id*="work_authorization"]', userData.legal_authorization);
    handleDropdown('[id*="sponsor"]', userData.visa_sponsorship);

    // Fill cover letter or additional info
    fillField('cover_letter', 
        `I am a ${userData.years_of_experience}-year experienced professional ` +
        `with a ${userData.highest_degree} degree. ` +
        `My key skills include: ${userData.skills.slice(0, 3).join(', ')}.`
    );
}

function fillField(selector, value) {
    const element = typeof selector === 'string' ? document.getElementById(selector) : selector;
    if (!element) return;

    // Highlight the element being filled
    element.style.border = '2px solid red';
    element.style.backgroundColor = 'yellow';

    // Set the value and trigger events
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
}

function handleDropdown(selector, value) {
    // First try standard HTML select
    const standardSelect = document.querySelector(`select${selector}, select[id="${selector}"]`);
    if (standardSelect) {
        console.log('Found standard select:', selector);
        return handleStandardSelect(standardSelect, value);
    }

    // Then try React-Select
    const reactSelect = typeof selector === 'string' 
        ? document.getElementById(selector)
        : selector;
    
    if (reactSelect && reactSelect.closest('.select__input-container')) {
        console.log('Found React select:', selector);
        return handleReactSelect(reactSelect, value);
    }

    console.log(`No select element found for: ${selector}`);
}

function handleStandardSelect(select, value) {
    // Highlight the element
    select.style.border = '2px solid red';
    select.style.backgroundColor = 'yellow';

    const options = Array.from(select.options);
    const targetValue = value.toLowerCase();
    
    // Try to find matching option
    const option = options.find(opt => 
        opt.text.toLowerCase().includes(targetValue) ||
        targetValue.includes(opt.text.toLowerCase())
    );

    if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.dispatchEvent(new Event('blur', { bubbles: true }));
        console.log(`Selected "${option.text}" for ${select.id}`);
    }
}

function handleReactSelect(input, value) {
    // Highlight the element
    const container = input.closest('.select__input-container');
    if (container) {
        container.style.border = '2px solid red';
        container.style.backgroundColor = 'yellow';
    }

    // 1. Focus the input to open dropdown
    input.focus();
    input.click();

    // 2. Simulate typing to filter options
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // 3. Wait for dropdown to appear and click the matching option
    setTimeout(() => {
        const options = document.querySelectorAll('[class*="select__option"]');
        for (const option of options) {
            if (option.textContent.toLowerCase().includes(value.toLowerCase())) {
                option.click();
                break;
            }
        }
        // 4. Blur the input to close dropdown
        input.blur();
    }, 500);
} 