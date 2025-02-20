// Listen for messages from the popup script after it receives data from the backend
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fillForm") {
        console.log("Received user data for form filling:", request.userData);
        
        // Call the original fillForm function instead of using FormFiller class in the backend
        fillForm(request.userData);
        
        // Send response synchronously
        sendResponse({ status: "success" });
        // Keep the message channel open for the async response
        return true; 
    }
});

class FormFiller {
    constructor(userData) {
        this.userData = userData;
        // Number of times to retry filling if validation fails
        this.retryCount = 3;
    }

    async fill() {
        try {
            await this.fillBasicInfo();
            await this.handleDropdowns();
            await this.handleTextAreas();
            
            for (let i = 0; i < this.retryCount; i++) {
                try {
                    await this.validateForm();
                    break;
                } catch (error) {
                    console.log(`Validation attempt ${i + 1} failed:`, error);
                    if (i === this.retryCount - 1) throw error;
                }
            }
        } catch (error) {
            console.error("Form filling failed:", error);
            throw error;
        }
    }

    async fillBasicInfo() {
        const fields = {
            'first_name': this.userData.firstName,
            'last_name': this.userData.lastName,
            'email': this.userData.email,
            'phone': this.userData.phone,
            'linkedin': this.userData.linkedin_url
        };

        for (const [id, value] of Object.entries(fields)) {
            await this.fillField(id, value);
        }
    }

    async handleDropdowns() {
        const dropdowns = {
            'gender': this.userData.gender,
            'work_authorization': this.userData.legal_authorization,
            'sponsor': this.userData.visa_sponsorship
        };

        for (const [id, value] of Object.entries(dropdowns)) {
            await handleDropdown(id, value);
        }
    }

    async handleTextAreas() {
        const coverLetter = `I am a ${this.userData.years_of_experience}-year experienced professional ` +
            `with a ${this.userData.highest_degree} degree. ` +
            `My key skills include: ${this.userData.skills.slice(0, 3).join(', ')}.`;

        await this.fillField('cover_letter', coverLetter);
    }

    async fillField(id, value) {
        const element = document.getElementById(id);
        if (!element) {
            // Try alternative selectors if ID not found
            const alternatives = document.querySelectorAll(
                `input[name*="${id}"], input[placeholder*="${id}"], input[aria-label*="${id}"]`
            );
            if (alternatives.length > 0) {
                await fillField(alternatives[0], value);
                return;
            }
            console.log(`Field ${id} not found`);
            return;
        }
        await fillField(element, value);
    }

    async validateForm() {
        // Check for error messages or validation feedback
        const errors = document.querySelectorAll('.error-message, .invalid-feedback');
        if (errors.length > 0) {
            throw new Error(`Form validation failed: ${Array.from(errors).map(e => e.textContent).join(', ')}`);
        }
    }
}

function fillForm(userData) {
    // Fill basic fields with improved field detection
    const fieldMappings = {
        'first_name': {
            patterns: ['first', 'firstname', 'first-name', 'fname', 'First Name'],
            value: userData.firstName 
        },
        'last_name': {
            patterns: ['last', 'lastname', 'last-name', 'lname', 'Last Name'],
            value: userData.lastName 
        },
        'email': {
            patterns: ['email', 'e-mail'],
            value: userData.email
        },
        'phone': {
            patterns: ['phone', 'mobile', 'telephone'],
            value: userData.phone
        },
        'linkedin': {
            patterns: ['LinkedIn Profile', 'linkedin', 'linked-in', 'LinkedIn'],
            value: userData.linkedin_url
        }
    };

    // Fill each field using the mappings
    for (const [field, config] of Object.entries(fieldMappings)) {
        if (field === 'first_name' || field === 'last_name') {
            console.log(`DEBUG - Trying to fill ${field} with patterns:`, config.patterns);
            console.log(`DEBUG - Value to fill:`, config.value);
        }
        const element = findField(config.patterns, config.value);
        if (field === 'first_name' || field === 'last_name') {
            console.log(`DEBUG - Found element for ${field}:`, element);
            if (element) {
                console.log(`DEBUG - Element details:`, {
                    id: element.id,
                    'aria-label': element.getAttribute('aria-label'),
                    type: element.type,
                    value: element.value
                });
            }
        }
        if (element) {
            fillField(element, config.value);  // Use the explicitly mapped value
        }
    }

    // Handle dropdowns with improved detection
    const dropdownMappings = {
        'gender': userData.gender,
        'work_authorization': userData.legal_authorization,
        'visa_sponsorship': userData.visa_sponsorship
    };

    // Try to fill each dropdown
    for (const [field, value] of Object.entries(dropdownMappings)) {
        console.log(`Trying to fill dropdown ${field} with value:`, value);
        // Pass true to include select elements in search
        const element = findField([field], value, true);
        if (element) {
            console.log(`Found dropdown for ${field}:`, element);
            handleDropdown(element, value);
        } else {
            console.log(`No dropdown found for ${field}`);
        }
    }

    // Fill cover letter with improved detection
    const coverLetterElement = findField(['cover.*letter', 'additional.*info', 'why.*interested']);
    if (coverLetterElement) {
        fillField(coverLetterElement, 
            `I am a ${userData.years_of_experience}-year experienced professional ` +
            `with a ${userData.highest_degree} degree. ` +
            `My key skills include: ${userData.skills.slice(0, 3).join(', ')}.`
        );
    }
}

function findField(patterns, value, includeSelect = false) {
    // Try multiple attribute types
    const attributes = ['id', 'name', 'aria-label', 'placeholder', 'label'];
    
    for (const pattern of patterns) {
        const regexPattern = new RegExp(pattern, 'i');  // case-insensitive
        
        // Try each attribute
        for (const attr of attributes) {
            // Include select elements if requested
            const selector = includeSelect ? 
                `input[${attr}*="${pattern}" i], textarea[${attr}*="${pattern}" i], select[${attr}*="${pattern}" i]` :
                `input[${attr}*="${pattern}" i], textarea[${attr}*="${pattern}" i]`;
                
            console.log(`Trying selector: ${selector}`);
            const element = document.querySelector(selector);
            console.log(`Found element:`, element);

            if (element) return element;

            // Try finding associated label
            const labels = document.querySelectorAll('label');
            for (const label of labels) {
                if (regexPattern.test(label.textContent)) {
                    const forId = label.getAttribute('for');
                    if (forId) {
                        const element = document.getElementById(forId);
                        if (element) return element;
                    }
                }
            }
        }
    }

    return null;
}

function fillField(selector, value) {
    let element;
    
    if (selector instanceof Element) {
        element = selector;
    } else {
        const patterns = [selector];
        element = findField(patterns, value);
    }

    if (!element) {
        console.log(`Field not found for: ${selector}`);
        return;
    }

    // Skip file inputs
    if (element.type === 'file') {
        console.log('Skipping file input field');
        return;
    }

    try {
        // Set the value and trigger events
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));

        // Highlight the element being filled
        element.style.border = '2px solid red';
        element.style.backgroundColor = 'yellow';
    } catch (error) {
        console.error(`Error filling field:`, error);
    }
}

function handleDropdown(element, value) {
    // Handle standard HTML select
    if (element.tagName.toLowerCase() === 'select') {
        console.log('Handling standard select dropdown');
        return handleStandardSelect(element, value);
    }

    // Handle React-Select
    if (element.closest('.select__input-container')) {
        console.log('Handling React-Select dropdown');
        return handleReactSelect(element, value);
    }

    // Try to find a select element nearby
    const nearbySelect = element.closest('div')?.querySelector('select');
    if (nearbySelect) {
        console.log('Found nearby select element');
        return handleStandardSelect(nearbySelect, value);
    }

    console.log('Unknown dropdown type:', element);
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

    // Focus the input to open dropdown
    input.focus();
    input.click();

    // Simulate typing to filter options
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Wait for dropdown to appear and click the matching option
    setTimeout(() => {
        const options = document.querySelectorAll('[class*="select__option"]');
        for (const option of options) {
            if (option.textContent.toLowerCase().includes(value.toLowerCase())) {
                option.click();
                break;
            }
        }
        // Blur the input to close dropdown
        input.blur();
    }, 500);
} 