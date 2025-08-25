// Registration Form JavaScript with Security Enhancements
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    const totalAmount = document.getElementById('totalAmount');
    const email = document.getElementById('email');
    const emailConfirm = document.getElementById('emailConfirm');
    const contact = document.getElementById('contact');
    const countryCode = document.getElementById('country-code');
    const successMessage = document.getElementById('successMessage');
    const nameField = document.getElementById('name');
    
    // Security: Form submission state with timestamp to prevent multiple submissions and rate limiting
    let isSubmitting = false;
    let lastSubmissionTime = 0;
    const SUBMISSION_COOLDOWN = 5000; // 5 seconds between submissions
    
    // Security: Server-side price configuration (should match backend)
    const TICKET_PRICES = Object.freeze({
        adult: 65,
        children: 35,
        students: 55,
        'children-under-5': 0,
        'day-pass': 25
    });
    
    // Security: Form integrity tracking
    let formInitialState = null;
    let securityToken = null;
    
    // Security: Generate session token and capture initial form state
    function initializeSecurity() {
        securityToken = generateSecureToken();
        formInitialState = captureFormState();
        
        // Add hidden security fields
        addSecurityFields();
        
        // Start integrity monitoring
        startIntegrityMonitoring();
    }
    
    // Security: Generate cryptographically secure token
    function generateSecureToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // Security: Capture initial form state for integrity checking
    function captureFormState() {
        return {
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language
        };
    }
    
    // Security: Add hidden security fields to form
    function addSecurityFields() {
        // Remove existing security fields first
        const existingToken = document.querySelector('input[name="security_token"]');
        const existingTimestamp = document.querySelector('input[name="form_timestamp"]');
        if (existingToken) existingToken.remove();
        if (existingTimestamp) existingTimestamp.remove();
        
        const securityField = document.createElement('input');
        securityField.type = 'hidden';
        securityField.name = 'security_token';
        securityField.value = securityToken;
        form.appendChild(securityField);
        
        const timestampField = document.createElement('input');
        timestampField.type = 'hidden';
        timestampField.name = 'form_timestamp';
        timestampField.value = formInitialState.timestamp;
        form.appendChild(timestampField);
    }
    
    // Security: Monitor form integrity
    function startIntegrityMonitoring() {
        // Monitor for suspicious DOM modifications
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'value' || mutation.attributeName === 'data-price')) {
                    logSecurityEvent('DOM_MANIPULATION', mutation.target);
                }
            });
        });
        
        observer.observe(form, {
            attributes: true,
            subtree: true,
            attributeFilter: ['value', 'data-price', 'min', 'max']
        });
        

    }
    
    // Security: Log security events
    function logSecurityEvent(eventType, element) {
        console.warn(`🚨 Security Event: ${eventType}`, {
            timestamp: Date.now(),
            element: element?.id || element?.tagName,
            userAgent: navigator.userAgent,
            token: securityToken
        });
    }
    
    // Security: Enhanced input sanitization
    function sanitizeInput(input, type = 'text') {
        if (typeof input !== 'string') return '';
        
        switch (type) {
            case 'name':
                return input
                    .replace(/[<>\"'&]/g, '') // Remove dangerous characters only
                    .substring(0, 100); // Limit length
                    
            case 'email':
                return input.trim()
                    .toLowerCase()
                    .replace(/[<>\"'&]/g, '')
                    .substring(0, 254);
                    
            case 'phone':
                return input.replace(/[^0-9]/g, '').substring(0, 15);
                
            case 'text':
            default:
                return input.trim()
                    .replace(/[<>\"'&]/g, '')
                    .substring(0, 500);
        }
    }
    
    // Security: Bot detection function
    function detectBot() {
        // Check for rapid form filling (human-like timing)
        const formFillTime = Date.now() - formInitialState.timestamp;
        if (formFillTime < 3000) { // Less than 3 seconds is suspicious
            return true;
        }
        

        
        // Check for suspicious patterns
        const nameValue = nameField.value;
        const emailValue = email.value;
        
        // Bot-like patterns
        if (nameValue.toLowerCase().includes('test') || 
            nameValue.toLowerCase().includes('demo') ||
            nameValue.toLowerCase().includes('@') ||
            emailValue.toLowerCase().includes('test@test') ||
            nameValue === emailValue.split('@')[0]) {
            return true;
        }
        
        return false;
    }
    
    // Security: Form integrity verification
    function verifyFormIntegrity() {
        // Check if security token exists
        const tokenField = document.querySelector('input[name="security_token"]');
        if (!tokenField || tokenField.value !== securityToken) {
            return false;
        }
        
        // Verify timestamp is reasonable
        const timestampField = document.querySelector('input[name="form_timestamp"]');
        if (!timestampField) return false;
        
        const formAge = Date.now() - parseInt(timestampField.value);
        if (formAge > 3600000 || formAge < 0) { // 1 hour max, no future dates
            return false;
        }
        
        // Check for price tampering by comparing with secure prices
        const calculatedTotal = calculateTicketPrice();
        const displayedTotal = parseFloat(totalAmount.textContent.replace('€', '')) || 0;
        const donationAmount = parseFloat(document.getElementById('custom-donation-amount').value) || 0;
        const expectedTotal = calculatedTotal + donationAmount;
        
        if (Math.abs(displayedTotal - expectedTotal) > 0.01) { // Allow for rounding
            return false;
        }
        
        return true;
    }
    
    // Security: Generate form data hash for integrity
    function generateFormHash(data) {
        const hashInput = JSON.stringify(data) + securityToken + formInitialState.timestamp;
        return btoa(hashInput).substring(0, 32); // Simple hash for client-side
    }
    
    // Security: Get secure form data with validation
    function getSecureFormData() {
        try {
            // Get values with security checks
            const adultCountElement = document.getElementById('adult-count');
            const childrenCountElement = document.getElementById('children-count');
            const childrenUnder5CountElement = document.getElementById('children-under-5-count');
            const dayPassCountElement = document.getElementById('day-pass-count');
            const customDonationElement = document.getElementById('custom-donation-amount');
            const studentElement = document.getElementById('students');
            
            // Security: Validate elements exist
            if (!adultCountElement || !childrenCountElement || !childrenUnder5CountElement || !dayPassCountElement || !customDonationElement || !studentElement) {
                logSecurityEvent('MISSING_FORM_ELEMENTS', null);
                return null;
            }
            
            // Security: Parse and validate counts
            const adultCount = Math.max(0, Math.min(50, parseInt(adultCountElement.value) || 0));
            const childAboveCount = Math.max(0, Math.min(50, parseInt(childrenCountElement.value) || 0));
            const childBelowCount = Math.max(0, Math.min(50, parseInt(childrenUnder5CountElement.value) || 0));
            const dayPassCount = Math.max(0, Math.min(50, parseInt(dayPassCountElement.value) || 0));
            const isStudentSelected = Boolean(studentElement.checked);
            
            // Security: Recalculate prices using secure method
            const ticketPrice = calculateTicketPrice();
            const donationFieldValue = Math.max(0, Math.min(10000, parseFloat(customDonationElement.value) || 0));
            
            // Simple system: ticket price + optional donation
            const totalAmount = ticketPrice + donationFieldValue;
            const customDonationAmount = donationFieldValue; // Just the donation amount
            
            // Security: Cross-validate displayed total
            const displayedTotal = parseFloat(document.getElementById('totalAmount').textContent.replace('€', '')) || 0;
            if (Math.abs(displayedTotal - totalAmount) > 0.01) {
                logSecurityEvent('TOTAL_MISMATCH', null);
                return null;
            }
            
            return {
                adultCount,
                childAboveCount,
                childBelowCount,
                dayPassCount,
                customDonationAmount,
                isStudentSelected,
                ticketPrice,
                totalAmount
            };
        } catch (error) {
            logSecurityEvent('FORM_DATA_ERROR', null);
            return null;
        }
    }
    
    // Security: Track user interaction
    window.hasUserInteracted = false;
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, () => {
            window.hasUserInteracted = true;
        }, { once: true });
    });
    
    // Initialize security measures
    initializeSecurity();
    
    // Clean name field validation - no interference with typing
    function validateName() {
        const rawValue = nameField.value;
        
        let nameMsg = document.getElementById('name-validation-msg');
        
        if (!nameMsg) {
            nameMsg = document.createElement('div');
            nameMsg.id = 'name-validation-msg';
            nameMsg.style.fontSize = '0.85rem';
            nameMsg.style.marginTop = '0.25rem';
            nameMsg.style.transition = 'all 0.3s ease';
            // Insert the validation message after the name input field, not after the entire form group
            nameField.parentNode.insertBefore(nameMsg, nameField.nextSibling);
        }
        
        // Only sanitize when submitting, not while typing
        const nameValue = rawValue;
        
        if (!nameValue) {
            nameField.setCustomValidity('Name is required');
            nameField.style.borderColor = '#ff4444';
            nameField.style.boxShadow = '0 0 0 3px rgba(255, 68, 68, 0.1)';
            nameMsg.textContent = '❌ Name is required';
            nameMsg.style.color = '#ff4444';
            return false;
        } else if (nameValue.length < 2) {
            nameField.setCustomValidity('Name must be at least 2 characters long');
            nameField.style.borderColor = '#ff4444';
            nameField.style.boxShadow = '0 0 0 3px rgba(255, 68, 68, 0.1)';
            nameMsg.textContent = '❌ Name must be at least 2 characters long';
            nameMsg.style.color = '#ff4444';
            return false;
        } else {
            nameField.setCustomValidity('');
            nameField.style.borderColor = '#228B22';
            nameField.style.boxShadow = '0 0 0 3px rgba(34, 139, 34, 0.1)';
            nameMsg.textContent = '✅ Valid name';
            nameMsg.style.color = '#228B22';
            return true;
        }
    }
    
    // Final name validation for form submission (with security)
    function validateNameFinal() {
        const rawValue = nameField.value;
        const sanitizedValue = sanitizeInput(rawValue, 'name');
        
        // Check for dangerous characters
        if (rawValue !== sanitizedValue) {
            const hasDangerousChars = /[<>\"'&]/.test(rawValue);
            if (hasDangerousChars) {
                logSecurityEvent('INPUT_SANITIZED', nameField);
                nameField.value = sanitizedValue;
            }
        }
        
        // Final validation with sanitized value
        const nameValue = sanitizedValue;
        
        if (!nameValue || nameValue.length < 2) {
            return false;
        }
        
        // Check for valid characters (letters, spaces, international)
        if (!/^[a-zA-Z\s\u00C0-\u017F\u0100-\u024F\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+$/.test(nameValue)) {
            return false;
        }
        
        return true;
    }
    
    // Security-enhanced contact number validation with country-specific rules
    function validatePhone() {
        // Security: Sanitize phone input
        const rawValue = contact.value;
        const sanitizedValue = sanitizeInput(rawValue, 'phone');
        
        // Security: Check for actual dangerous content (not just number cleaning)
        if (rawValue !== sanitizedValue) {
            // Only log if dangerous characters were actually removed
            const hasDangerousChars = /[<>\"'&]/.test(rawValue);
            if (hasDangerousChars) {
                logSecurityEvent('PHONE_SANITIZED', contact);
            }
            contact.value = sanitizedValue;
        }
        
        const phoneValue = sanitizedValue;
        const selectedCountryCode = countryCode.value;
        let phoneMsg = document.getElementById('phone-validation-msg');
        
        if (!phoneMsg) {
            phoneMsg = document.createElement('div');
            phoneMsg.id = 'phone-validation-msg';
            phoneMsg.style.fontSize = '0.85rem';
            phoneMsg.style.marginTop = '0.25rem';
            phoneMsg.style.transition = 'all 0.3s ease';
            // Insert the validation message after the contact input field, not after the entire form group
            contact.parentNode.parentNode.insertBefore(phoneMsg, contact.parentNode.nextSibling);
        }
        
        // Remove any non-numeric characters
        const cleanPhone = phoneValue.replace(/[^0-9]/g, '');
        if (cleanPhone !== phoneValue) {
            contact.value = cleanPhone;
        }
        
        // Country-specific validation rules
        const countryRules = {
            '+34': { min: 9, max: 9, name: 'Spain' },      // Spain
            '+91': { min: 10, max: 10, name: 'India' },    // India
            '+44': { min: 10, max: 11, name: 'UK' },       // UK
            '+1': { min: 10, max: 10, name: 'US/Canada' }, // US/Canada
            '+33': { min: 9, max: 10, name: 'France' },    // France
            '+49': { min: 10, max: 12, name: 'Germany' },  // Germany
            '+39': { min: 9, max: 10, name: 'Italy' },     // Italy
            '+31': { min: 9, max: 9, name: 'Netherlands' }, // Netherlands
            '+32': { min: 8, max: 9, name: 'Belgium' },    // Belgium
            '+351': { min: 9, max: 9, name: 'Portugal' }   // Portugal
        };
        
        const rule = countryRules[selectedCountryCode] || { min: 9, max: 15, name: 'International' };
        
        if (!cleanPhone) {
            contact.setCustomValidity('Phone number is required');
            contact.style.borderColor = '#ff4444';
            contact.style.boxShadow = '0 0 0 3px rgba(255, 68, 68, 0.1)';
            phoneMsg.textContent = '❌ Phone number is required';
            phoneMsg.style.color = '#ff4444';
            return false;
        } else if (cleanPhone.length < rule.min) {
            contact.setCustomValidity(`Phone number must be at least ${rule.min} digits for ${rule.name}`);
            contact.style.borderColor = '#ff4444';
            contact.style.boxShadow = '0 0 0 3px rgba(255, 68, 68, 0.1)';
            phoneMsg.textContent = `❌ Must be at least ${rule.min} digits for ${rule.name}`;
            phoneMsg.style.color = '#ff4444';
            return false;
        } else if (cleanPhone.length > rule.max) {
            contact.setCustomValidity(`Phone number must be at most ${rule.max} digits for ${rule.name}`);
            contact.style.borderColor = '#ff4444';
            contact.style.boxShadow = '0 0 0 3px rgba(255, 68, 68, 0.1)';
            phoneMsg.textContent = `❌ Must be at most ${rule.max} digits for ${rule.name}`;
            phoneMsg.style.color = '#ff4444';
            return false;
        } else {
            contact.setCustomValidity('');
            contact.style.borderColor = '#228B22';
            contact.style.boxShadow = '0 0 0 3px rgba(34, 139, 34, 0.1)';
            phoneMsg.textContent = `✅ Valid ${rule.name} phone number`;
            phoneMsg.style.color = '#228B22';
            return true;
        }
    }
    
    // Add event listeners for name validation
    nameField.addEventListener('input', validateName);
    nameField.addEventListener('blur', validateName);
    
    // Contact number validation
    contact.addEventListener('input', validatePhone);
    contact.addEventListener('blur', validatePhone);

    // Style country code select on focus and change
    countryCode.addEventListener('focus', function() {
        this.style.borderColor = 'var(--red)';
        this.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';
    });

    countryCode.addEventListener('change', function() {
        this.style.borderColor = 'var(--green)';
        this.style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.1)';
    });

    countryCode.addEventListener('blur', function() {
        if (this.value) {
            this.style.borderColor = 'var(--green)';
            this.style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.1)';
        } else {
            this.style.borderColor = '#ddd';
            this.style.boxShadow = 'none';
        }
    });
    
    // Prevent 'e', '+', '-' in number input
    contact.addEventListener('keydown', function(e) {
        if (e.key === 'e' || e.key === '+' || e.key === '-' || e.key === '.') {
            e.preventDefault();
        }
    });
    
    // Get all contribution checkboxes and their count inputs
    const contributionCheckboxes = document.querySelectorAll('input[name="contributionTypes"]');
    const countInputs = document.querySelectorAll('input[id$="-count"]');
    
    // Security-enhanced ticket price calculation using server-side prices
    function calculateTicketPrice() {
        let ticketTotal = 0;
        
        contributionCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                // Security: Use server-side prices instead of DOM data-price attributes
                if (checkbox.id === 'students') {
                    // Students checkbox doesn't have a count input - it's just checked/unchecked
                    ticketTotal += TICKET_PRICES.students;
                } else if (checkbox.id !== 'custom-donation') {
                    // Security: Get price from secure constant, not DOM
                    const securePrice = TICKET_PRICES[checkbox.id];
                    if (securePrice === undefined) {
                        logSecurityEvent('INVALID_TICKET_TYPE', checkbox);
                        return 0; // Invalid ticket type
                    }
                    
                    const countId = checkbox.id + '-count';
                    const countInput = document.getElementById(countId);
                    if (!countInput) {
                        logSecurityEvent('MISSING_COUNT_INPUT', checkbox);
                        return 0; // Count input not found
                    }
                    
                    const rawCount = countInput.value;
                    const count = parseInt(rawCount) || 0;
                    
                    // Security: Validate count is reasonable
                    if (count < 0 || count > 50) { // Max 50 tickets per type
                        logSecurityEvent('SUSPICIOUS_COUNT', countInput);
                        return 0;
                    }
                    
                    ticketTotal += securePrice * count;
                }
            }
        });
        
        // Security: Validate total is reasonable
        if (ticketTotal < 0 || ticketTotal > 10000) {
            logSecurityEvent('SUSPICIOUS_TOTAL', null);
            return 0;
        }
        
        return ticketTotal;
    }
    
    // Calculate total amount - simple addition of tickets + optional donation
    function calculateTotal() {
        let ticketPrice = calculateTicketPrice();
        let hasValidSelections = ticketPrice > 0;
        
        // Get optional donation amount
        const donationAmount = parseFloat(document.getElementById('custom-donation-amount').value) || 0;
        
        // Simple addition: ticket price + donation
        let total = ticketPrice + donationAmount;
        
        // Check if we have valid selections (either tickets or donation)
        if (ticketPrice > 0 || donationAmount > 0) {
            hasValidSelections = true;
        }
        
        totalAmount.textContent = `€${total.toFixed(2)}`;
        
        // Update donation controls based on ticket selection
        updateDonationControls(ticketPrice);
    }
    
    // Simple donation controls - optional donation field
    function updateDonationControls(ticketPrice) {
        const donationInput = document.getElementById('custom-donation-amount');
        const minusBtn = document.getElementById('donation-minus');
        const plusBtn = document.getElementById('donation-plus');
        
        if (ticketPrice > 0) {
            // Tickets selected - enable optional donation
            donationInput.placeholder = 'Optional donation amount';
            donationInput.title = 'Optional: Add any donation amount you wish to contribute (€5 increments with buttons)';
            donationInput.min = 0; // No minimum required
            donationInput.disabled = false;
            donationInput.style.backgroundColor = 'white';
            donationInput.style.cursor = 'text';
            
            // Button logic - simple increment/decrement
            const currentValue = parseFloat(donationInput.value) || 0;
            
            // Minus button: disabled if value is 0 or empty
            minusBtn.disabled = currentValue <= 0;
            minusBtn.style.opacity = minusBtn.disabled ? '0.5' : '1';
            minusBtn.style.cursor = minusBtn.disabled ? 'not-allowed' : 'pointer';
            
            // Plus button: always enabled when tickets are selected
            plusBtn.disabled = false;
            plusBtn.style.opacity = '1';
            plusBtn.style.cursor = 'pointer';
        } else {
            // No tickets selected - disable donation
            donationInput.placeholder = 'Please select tickets first';
            donationInput.title = 'Ticket selection is mandatory. Please select tickets first.';
            donationInput.value = ''; // Clear value when no tickets
            donationInput.disabled = true;
            donationInput.style.backgroundColor = '#f5f5f5';
            donationInput.style.cursor = 'not-allowed';
            donationInput.min = 0;
            
            // Disable both buttons when no tickets
            minusBtn.disabled = true;
            plusBtn.disabled = true;
            minusBtn.style.opacity = '0.3';
            plusBtn.style.opacity = '0.3';
            minusBtn.style.cursor = 'not-allowed';
            plusBtn.style.cursor = 'not-allowed';
        }
        
        // Trigger validation to update the display messages
        validateCustomDonation();
    }
    
    // Function to handle option disabling
    function handleOptionDisabling(checkbox) {
        const adultCheckbox = document.getElementById('adult');
        const childrenCheckbox = document.getElementById('children');
        const childrenUnder5Checkbox = document.getElementById('children-under-5');
        const studentCheckbox = document.getElementById('students');
        const dayPassCheckbox = document.getElementById('day-pass');
        
        // Get the container divs
        const adultOption = adultCheckbox.closest('.contribution-option');
        const childrenOption = childrenCheckbox.closest('.contribution-option');
        const childrenUnder5Option = childrenUnder5Checkbox.closest('.contribution-option');
        const studentOption = studentCheckbox.closest('.contribution-option');
        const dayPassOption = dayPassCheckbox.closest('.contribution-option');

        if (checkbox.id === 'students') {
            // If student is selected/deselected
            const isStudentSelected = checkbox.checked;
            
            // Handle Regular, Children, and Day Pass options
            adultCheckbox.disabled = isStudentSelected;
            childrenCheckbox.disabled = isStudentSelected;
            childrenUnder5Checkbox.disabled = isStudentSelected;
            dayPassCheckbox.disabled = isStudentSelected;
            
            // Add visual indication for disabled options
            adultOption.style.opacity = isStudentSelected ? '0.5' : '1';
            childrenOption.style.opacity = isStudentSelected ? '0.5' : '1';
            childrenUnder5Option.style.opacity = isStudentSelected ? '0.5' : '1';
            dayPassOption.style.opacity = isStudentSelected ? '0.5' : '1';
            adultOption.style.cursor = isStudentSelected ? 'not-allowed' : 'pointer';
            childrenOption.style.cursor = isStudentSelected ? 'not-allowed' : 'pointer';
            childrenUnder5Option.style.cursor = isStudentSelected ? 'not-allowed' : 'pointer';
            dayPassOption.style.cursor = isStudentSelected ? 'not-allowed' : 'pointer';
            
            if (isStudentSelected) {
                // Uncheck other options if student is selected
                if (adultCheckbox.checked) {
                    adultCheckbox.checked = false;
                    const adultCount = document.getElementById('adult-count');
                    adultCount.style.display = 'none';
                    adultCount.value = '0';
                    adultOption.style.borderColor = '#ddd';
                    adultOption.style.background = '#f8f9fa';
                }
                if (childrenCheckbox.checked) {
                    childrenCheckbox.checked = false;
                    const childrenCount = document.getElementById('children-count');
                    childrenCount.style.display = 'none';
                    childrenCount.value = '0';
                    childrenOption.style.borderColor = '#ddd';
                    childrenOption.style.background = '#f8f9fa';
                }
                if (childrenUnder5Checkbox.checked) {
                    childrenUnder5Checkbox.checked = false;
                    const childrenUnder5Count = document.getElementById('children-under-5-count');
                    childrenUnder5Count.style.display = 'none';
                    childrenUnder5Count.value = '0';
                    childrenUnder5Option.style.borderColor = '#ddd';
                    childrenUnder5Option.style.background = '#f8f9fa';
                }
                if (dayPassCheckbox.checked) {
                    dayPassCheckbox.checked = false;
                    const dayPassCount = document.getElementById('day-pass-count');
                    dayPassCount.style.display = 'none';
                    dayPassCount.value = '0';
                    dayPassOption.style.borderColor = '#ddd';
                    dayPassOption.style.background = '#f8f9fa';
                }
            }
        } else {
            // If Regular, Children, or Day Pass options are selected/deselected
            const isRegularOrChildrenSelected = adultCheckbox.checked || childrenCheckbox.checked || childrenUnder5Checkbox.checked || dayPassCheckbox.checked;
            
            // Handle Student option
            studentCheckbox.disabled = isRegularOrChildrenSelected;
            
            // Add visual indication for disabled student option
            studentOption.style.opacity = isRegularOrChildrenSelected ? '0.5' : '1';
            studentOption.style.cursor = isRegularOrChildrenSelected ? 'not-allowed' : 'pointer';
            
            if (isRegularOrChildrenSelected && studentCheckbox.checked) {
                // Uncheck student if Regular, Children, or Day Pass are selected
                studentCheckbox.checked = false;
                studentOption.style.borderColor = '#ddd';
                studentOption.style.background = '#f8f9fa';
            }
        }
        
        calculateTotal();
    }

    // Handle checkbox changes
    contributionCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const countId = this.id + '-count';
            const countInput = document.getElementById(countId);
            const optionDiv = this.closest('.contribution-option');
            
            // Call handleOptionDisabling with the current checkbox
            handleOptionDisabling(this);
            
            if (this.checked) {
                if (this.id === 'custom-donation') {
                    // Handle custom donation
                    const customInputs = document.getElementById('custom-donation-inputs');
                    customInputs.style.display = 'block';
                    optionDiv.style.borderColor = '#FF6B35';
                    optionDiv.style.background = 'rgba(255, 107, 53, 0.05)';
                } else if (this.id === 'students') {
                    // Handle student option - no count needed
                    optionDiv.style.borderColor = '#FF6B35';
                    optionDiv.style.background = 'rgba(255, 107, 53, 0.05)';
                } else {
                    // Handle regular options
                    countInput.style.display = 'block';
                    countInput.value = '1';
                    optionDiv.style.borderColor = '#FF6B35';
                    optionDiv.style.background = 'rgba(255, 107, 53, 0.05)';
                }
            } else {
                if (this.id === 'custom-donation') {
                    // Handle custom donation
                    const customInputs = document.getElementById('custom-donation-inputs');
                    const warningElement = document.getElementById('custom-donation-warning');
                    customInputs.style.display = 'none';
                    document.getElementById('custom-donation-amount').value = '';
                    if (warningElement) {
                        warningElement.style.display = 'none';
                    }
                    optionDiv.style.borderColor = '#ddd';
                    optionDiv.style.background = '#f8f9fa';
                } else if (this.id === 'students') {
                    // Handle student option unchecked
                    optionDiv.style.borderColor = '#ddd';
                    optionDiv.style.background = '#f8f9fa';
                } else {
                    // Handle regular options
                    if (countInput) {
                        countInput.style.display = 'none';
                        countInput.value = '0';
                    }
                    optionDiv.style.borderColor = '#ddd';
                    optionDiv.style.background = '#f8f9fa';
                }
            }
            
            // Handle children-under-5 visibility based on adult selection
            updateChildrenUnder5Visibility();
            
            calculateTotal();
        });
    });
    
    // Function to update children-under-5 option visibility
    function updateChildrenUnder5Visibility() {
        const adultCheckbox = document.getElementById('adult');
        const childrenUnder5Option = document.getElementById('children-under-5').closest('.contribution-option');
        
        if (adultCheckbox.checked) {
            // Show children-under-5 option when adult is selected
            childrenUnder5Option.style.display = 'block';
            childrenUnder5Option.style.opacity = '1';
        } else {
            // Hide children-under-5 option when adult is not selected
            childrenUnder5Option.style.display = 'none';
            childrenUnder5Option.style.opacity = '0';
            
            // Uncheck and reset children-under-5 if adult is unchecked
            const childrenUnder5Checkbox = document.getElementById('children-under-5');
            const childrenUnder5Count = document.getElementById('children-under-5-count');
            if (childrenUnder5Checkbox.checked) {
                childrenUnder5Checkbox.checked = false;
                childrenUnder5Count.style.display = 'none';
                childrenUnder5Count.value = '0';
                childrenUnder5Option.style.borderColor = '#ddd';
                childrenUnder5Option.style.background = '#f8f9fa';
            }
        }
    }
    
    // Initialize children-under-5 visibility on page load
    updateChildrenUnder5Visibility();
    
    // Initialize donation controls on page load (no tickets selected initially)
    updateDonationControls(0);
    
    // Handle count input changes
    countInputs.forEach(input => {
        input.addEventListener('input', calculateTotal);
    });
    
    // Simple donation validation - optional donation field
    function validateCustomDonation() {
    const customDonationAmount = document.getElementById('custom-donation-amount');
        if (!customDonationAmount) return true;
    
        const amount = parseFloat(customDonationAmount.value) || 0;
        const ticketPrice = calculateTicketPrice();
            const warningElement = document.getElementById('custom-donation-warning');
        let donationMsg = document.getElementById('donation-validation-msg');
        
        if (!donationMsg) {
            donationMsg = document.createElement('div');
            donationMsg.id = 'donation-validation-msg';
            donationMsg.style.fontSize = '0.85rem';
            donationMsg.style.marginTop = '0.5rem';
            donationMsg.style.transition = 'all 0.3s ease';
            donationMsg.style.wordWrap = 'break-word';
            donationMsg.style.lineHeight = '1.4';
            donationMsg.style.maxWidth = '100%';
            donationMsg.style.boxSizing = 'border-box';
            
            // Append to the donation-controls container for better responsive positioning
            const donationControlsContainer = document.querySelector('.donation-controls');
            if (donationControlsContainer) {
                donationControlsContainer.appendChild(donationMsg);
            } else {
                customDonationAmount.parentNode.parentNode.appendChild(donationMsg);
            }
        }
        
        // Remove non-numeric characters except decimal point
        const cleanValue = customDonationAmount.value.replace(/[^0-9.]/g, '');
        if (cleanValue !== customDonationAmount.value) {
            customDonationAmount.value = cleanValue;
        }
        
        // If no tickets selected, donation field should be disabled
        if (ticketPrice === 0) {
            customDonationAmount.style.borderColor = '#ddd';
            customDonationAmount.style.boxShadow = 'none';
            donationMsg.textContent = '';
                if (warningElement) {
                    warningElement.style.display = 'none';
                }
            return true; // Let main validation handle ticket requirement
        }
        
        // Tickets are selected - validate donation amount (if provided)
        if (customDonationAmount.value && amount <= 0) {
            customDonationAmount.style.borderColor = '#ff4444';
            customDonationAmount.style.boxShadow = '0 0 0 3px rgba(255, 68, 68, 0.1)';
            donationMsg.textContent = '❌ Donation amount must be greater than €0';
            donationMsg.style.color = '#ff4444';
            if (warningElement) {
                warningElement.style.display = 'block';
            }
            return false;
        } else if (amount > 10000) {
            customDonationAmount.style.borderColor = '#ff4444';
            customDonationAmount.style.boxShadow = '0 0 0 3px rgba(255, 68, 68, 0.1)';
            donationMsg.textContent = '❌ Donation amount seems too high. Please contact us for large donations.';
            donationMsg.style.color = '#ff4444';
            return false;
        } else if (amount > 0) {
            // Valid donation amount
            customDonationAmount.style.borderColor = '#228B22';
            customDonationAmount.style.boxShadow = '0 0 0 3px rgba(34, 139, 34, 0.1)';
            donationMsg.textContent = `✅ Thank you for your €${amount.toFixed(2)} donation!`;
            donationMsg.style.color = '#228B22';
            if (warningElement) {
                warningElement.style.display = 'none';
            }
            return true;
            } else {
            // Empty donation (which is fine)
            customDonationAmount.style.borderColor = '#ddd';
            customDonationAmount.style.boxShadow = 'none';
            donationMsg.textContent = '';
                if (warningElement) {
                    warningElement.style.display = 'none';
            }
            return true;
        }
    }
    
    // Handle custom donation input changes
    const customDonationAmount = document.getElementById('custom-donation-amount');
    const donationMinusBtn = document.getElementById('donation-minus');
    const donationPlusBtn = document.getElementById('donation-plus');
    
    if (customDonationAmount) {
        customDonationAmount.addEventListener('input', function() {
            validateCustomDonation();
            calculateTotal();
        });
        
        customDonationAmount.addEventListener('blur', validateCustomDonation);
    }
    
    // Simple Plus/Minus button functionality for donations
    if (donationMinusBtn && donationPlusBtn && customDonationAmount) {
        donationMinusBtn.addEventListener('click', function() {
            const currentValue = parseFloat(customDonationAmount.value) || 0;
            const ticketPrice = calculateTicketPrice();
            
            // Only allow if tickets are selected
            if (ticketPrice === 0) {
                return; // Do nothing if no tickets selected
            }
            
            // Simple decrease by €5, minimum 0
            const newValue = Math.max(0, currentValue - 5);
            
            if (newValue === 0) {
                customDonationAmount.value = ''; // Clear field if 0
            } else {
                customDonationAmount.value = newValue.toFixed(2);
            }
            
            validateCustomDonation();
            calculateTotal();
            updateDonationControls(ticketPrice); // Update button states
            
            // Update button styles
            this.style.background = newValue > 0 ? '#f8f9fa' : 'white';
            this.style.borderColor = newValue > 0 ? 'var(--red)' : '#ddd';
        });
        
        donationPlusBtn.addEventListener('click', function() {
            const currentValue = parseFloat(customDonationAmount.value) || 0;
            const ticketPrice = calculateTicketPrice();
            
            // Only allow if tickets are selected
            if (ticketPrice === 0) {
                return; // Do nothing if no tickets selected
            }
            
            // Simple increment by €5 (start from €5 if empty)
            const newValue = currentValue === 0 ? 5 : Math.min(10000, currentValue + 5);
            
            customDonationAmount.value = newValue.toFixed(2);
            validateCustomDonation();
            calculateTotal();
            updateDonationControls(ticketPrice); // Update button states
            
            // Update button styles
            this.style.background = '#f8f9fa';
            this.style.borderColor = 'var(--red)';
            
            // Reset after a short delay
            setTimeout(() => {
                this.style.background = 'white';
                this.style.borderColor = '#ddd';
            }, 150);
        });
        
        // Button hover effects
        [donationMinusBtn, donationPlusBtn].forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                if (!this.disabled) {
                    this.style.borderColor = 'var(--red)';
                    this.style.color = 'var(--red)';
                }
            });
            
            btn.addEventListener('mouseleave', function() {
                if (!this.disabled) {
                    this.style.borderColor = '#ddd';
                    this.style.color = '#666';
                }
            });
        });
    }
    
    // Security-enhanced email validation with comprehensive checks
    function validateEmails() {
        // Security: Sanitize email inputs
        const rawEmailValue = email.value;
        const rawEmailConfirmValue = emailConfirm.value;
        
        const emailValue = sanitizeInput(rawEmailValue, 'email');
        const emailConfirmValue = sanitizeInput(rawEmailConfirmValue, 'email');
        
        // Security: Check for sanitization (potential tampering)
        if (rawEmailValue !== emailValue) {
            logSecurityEvent('EMAIL_SANITIZED', email);
            email.value = emailValue;
        }
        if (rawEmailConfirmValue !== emailConfirmValue) {
            logSecurityEvent('EMAIL_CONFIRM_SANITIZED', emailConfirm);
            emailConfirm.value = emailConfirmValue;
        }
        
        // Enhanced email regex for better validation
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        // Get or create validation message elements
        let emailMsg = document.getElementById('email-validation-msg');
        let emailConfirmMsg = document.getElementById('email-confirm-validation-msg');
        
        if (!emailMsg) {
            emailMsg = document.createElement('div');
            emailMsg.id = 'email-validation-msg';
            emailMsg.style.fontSize = '0.85rem';
            emailMsg.style.marginTop = '0.25rem';
            emailMsg.style.transition = 'all 0.3s ease';
            email.parentNode.appendChild(emailMsg);
        }
        
        if (!emailConfirmMsg) {
            emailConfirmMsg = document.createElement('div');
            emailConfirmMsg.id = 'email-confirm-validation-msg';
            emailConfirmMsg.style.fontSize = '0.85rem';
            emailConfirmMsg.style.marginTop = '0.25rem';
            emailConfirmMsg.style.transition = 'all 0.3s ease';
            emailConfirm.parentNode.appendChild(emailConfirmMsg);
        }
        
        // Validate first email field
        let emailValid = false;
        if (!emailValue) {
            email.setCustomValidity('Email is required');
            email.style.borderColor = '#ff4444';
            email.style.boxShadow = '0 0 0 3px rgba(255, 68, 68, 0.1)';
            emailMsg.textContent = '❌ Email is required';
            emailMsg.style.color = '#ff4444';
        } else if (emailValue.length > 254) {
            email.setCustomValidity('Email address is too long');
            email.style.borderColor = '#ff4444';
            email.style.boxShadow = '0 0 0 3px rgba(255, 68, 68, 0.1)';
            emailMsg.textContent = '❌ Email address is too long';
            emailMsg.style.color = '#ff4444';
        } else if (!emailRegex.test(emailValue)) {
                email.setCustomValidity('Please enter a valid email address');
                email.style.borderColor = '#ff4444';
                email.style.boxShadow = '0 0 0 3px rgba(255, 68, 68, 0.1)';
                emailMsg.textContent = '❌ Please enter a valid email address';
                emailMsg.style.color = '#ff4444';
        } else if (emailValue.includes('..') || emailValue.startsWith('.') || emailValue.endsWith('.')) {
            email.setCustomValidity('Email contains invalid characters');
            email.style.borderColor = '#ff4444';
            email.style.boxShadow = '0 0 0 3px rgba(255, 68, 68, 0.1)';
            emailMsg.textContent = '❌ Email contains invalid characters';
                emailMsg.style.color = '#ff4444';
            } else {
                email.setCustomValidity('');
                email.style.borderColor = '#228B22';
                email.style.boxShadow = '0 0 0 3px rgba(34, 139, 34, 0.1)';
                emailMsg.textContent = '✅ Valid email format';
                emailMsg.style.color = '#228B22';
            emailValid = true;
        }
        
        // Validate second email field
        let emailConfirmValid = false;
        if (!emailConfirmValue) {
            emailConfirm.setCustomValidity('Please confirm your email');
            emailConfirm.style.borderColor = '#ff4444';
            emailConfirm.style.boxShadow = '0 0 0 3px rgba(255, 68, 68, 0.1)';
            emailConfirmMsg.textContent = '❌ Please confirm your email';
            emailConfirmMsg.style.color = '#ff4444';
        } else if (!emailRegex.test(emailConfirmValue)) {
                emailConfirm.setCustomValidity('Please enter a valid email address');
                emailConfirm.style.borderColor = '#ff4444';
                emailConfirm.style.boxShadow = '0 0 0 3px rgba(255, 68, 68, 0.1)';
                emailConfirmMsg.textContent = '❌ Please enter a valid email address';
                emailConfirmMsg.style.color = '#ff4444';
            } else if (emailValue && emailValue !== emailConfirmValue) {
                emailConfirm.setCustomValidity('Emails do not match');
                emailConfirm.style.borderColor = '#ff4444';
                emailConfirm.style.boxShadow = '0 0 0 3px rgba(255, 68, 68, 0.1)';
                emailConfirmMsg.textContent = '❌ Emails do not match';
                emailConfirmMsg.style.color = '#ff4444';
        } else if (emailValue && emailValue === emailConfirmValue && emailValid) {
                emailConfirm.setCustomValidity('');
                emailConfirm.style.borderColor = '#228B22';
                emailConfirm.style.boxShadow = '0 0 0 3px rgba(34, 139, 34, 0.1)';
                emailConfirmMsg.textContent = '✅ Emails match perfectly!';
                emailConfirmMsg.style.color = '#228B22';
            emailConfirmValid = true;
            } else {
                emailConfirm.setCustomValidity('');
                emailConfirm.style.borderColor = '#228B22';
                emailConfirm.style.boxShadow = '0 0 0 3px rgba(34, 139, 34, 0.1)';
                emailConfirmMsg.textContent = '✅ Valid email format';
                emailConfirmMsg.style.color = '#228B22';
            emailConfirmValid = true;
        }
        
        return emailValid && emailConfirmValid;
    }
    
    // Add real-time validation with multiple event listeners for instant feedback
    email.addEventListener('input', validateEmails);
    email.addEventListener('blur', validateEmails);
    email.addEventListener('keyup', validateEmails);
    
    emailConfirm.addEventListener('input', validateEmails);
    emailConfirm.addEventListener('blur', validateEmails);
    emailConfirm.addEventListener('keyup', validateEmails);
    
    // Security-enhanced comprehensive form validation with integrity checks
    function validateForm() {
        const errors = [];
        
        // Security: Rate limiting check
        const now = Date.now();
        if (now - lastSubmissionTime < SUBMISSION_COOLDOWN) {
            errors.push('Please wait before submitting again (rate limit)');
            logSecurityEvent('RATE_LIMIT_EXCEEDED', null);
            return errors;
        }
        
        // Security: Basic bot detection
        if (detectBot()) {
            errors.push('Automated submission detected');
            logSecurityEvent('BOT_DETECTED', null);
            return errors;
        }
        
        // Security: Form integrity check
        if (!verifyFormIntegrity()) {
            errors.push('Form integrity check failed');
            logSecurityEvent('INTEGRITY_FAILURE', null);
            return errors;
        }
        
        // Validate name (final validation with security)
        if (!validateNameFinal()) {
            errors.push('Please enter a valid name');
        }
        
        // Validate phone
        if (!validatePhone()) {
            errors.push('Please enter a valid phone number');
        }
        
        // Validate emails
        if (!validateEmails()) {
            errors.push('Please enter valid matching email addresses');
        }
        
        // Validate custom donation if there's a value entered
        const customDonationInput = document.getElementById('custom-donation-amount');
        const customDonationValue = parseFloat(customDonationInput.value) || 0;
        if (customDonationInput.value && !validateCustomDonation()) {
            errors.push('Please enter a valid donation amount');
        }
        
        // Security: Get form data with validation and sanitization
        const formData = getSecureFormData();
        if (!formData) {
            errors.push('Form data validation failed');
            return errors;
        }
        
        const { adultCount, childAboveCount, childBelowCount, dayPassCount, customDonationAmount, isStudentSelected, ticketPrice, totalAmount } = formData;
        const totalPeople = adultCount + (isStudentSelected ? 1 : 0) + childAboveCount + childBelowCount + dayPassCount;
        
        // Tickets are now mandatory - must select at least one ticket type
        if (totalPeople === 0) {
            errors.push('Please select at least one ticket type. Ticket selection is mandatory.');
        }
        
        // Ticket price must be greater than 0
        if (ticketPrice === 0) {
            errors.push('Please select valid ticket types with proper counts.');
        }
        
        // Total amount should never be 0 if we reach this point
        if (totalAmount === 0) {
            errors.push('Total amount cannot be €0. Please select valid ticket types.');
        }
        
        // Validate that selected checkboxes have proper counts
        const selectedContributions = document.querySelectorAll('input[name="contributionTypes"]:checked');
        for (let checkbox of selectedContributions) {
            if (checkbox.id === 'adult' && adultCount === 0) {
                errors.push('Please enter a count for adults (above 12 years)');
            }
            if (checkbox.id === 'children' && childAboveCount === 0) {
                errors.push('Please enter a count for children (5-12 years)');
            }
            if (checkbox.id === 'children-under-5' && childBelowCount === 0) {
                errors.push('Please enter a count for children (up to 5 years)');
            }
            if (checkbox.id === 'day-pass' && dayPassCount === 0) {
                errors.push('Please enter a count for day pass (guests)');
            }
        }
        
        return errors;
    }
    
    // Show validation errors in a user-friendly way
    function showValidationErrors(errors) {
        // Remove existing error display
        const existingErrorDiv = document.getElementById('validation-errors');
        if (existingErrorDiv) {
            existingErrorDiv.remove();
        }
        
        if (errors.length === 0) return;
        
        const errorDiv = document.createElement('div');
        errorDiv.id = 'validation-errors';
        errorDiv.style.cssText = `
            background: rgba(255, 68, 68, 0.1);
            border: 2px solid #ff4444;
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
            color: #ff4444;
            font-weight: 600;
        `;
        
        const errorTitle = document.createElement('h4');
        errorTitle.textContent = '⚠️ Please fix the following errors:';
        errorTitle.style.margin = '0 0 0.5rem 0';
        errorDiv.appendChild(errorTitle);
        
        const errorList = document.createElement('ul');
        errorList.style.margin = '0';
        errorList.style.paddingLeft = '1.5rem';
        
        errors.forEach(error => {
            const listItem = document.createElement('li');
            listItem.textContent = error;
            listItem.style.marginBottom = '0.25rem';
            errorList.appendChild(listItem);
        });
        
        errorDiv.appendChild(errorList);
        
        // Insert before the form
        form.parentNode.insertBefore(errorDiv, form);
        
        // Scroll to error message
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Function to show success message and reset form (prevent duplicate success messages)
    function showSuccessMessage() {
        // Only show success message if it's not already displayed
        if (successMessage.style.display !== 'block') {
            
            // Remove please wait message
            const pleaseWaitMsg = document.getElementById('please-wait-message');
            if (pleaseWaitMsg) {
                pleaseWaitMsg.remove();
            }
            
            // Hide form and show success message
            form.style.display = 'none';
            successMessage.style.display = 'block';
            
            // Reset form
            form.reset();
            totalAmount.textContent = '€0';
            
            // Reset contribution options styling
            contributionCheckboxes.forEach(checkbox => {
                const countId = checkbox.id + '-count';
                const countInput = document.getElementById(countId);
                const optionDiv = checkbox.closest('.contribution-option');
                
                if (checkbox.id !== 'students') {
                    // Handle regular options
                    if (countInput) {
                        countInput.style.display = 'none';
                        countInput.value = '0';
                    }
                }
                
                // Reset styling for all options
                checkbox.checked = false;
                optionDiv.style.borderColor = '#ddd';
                optionDiv.style.background = '#f8f9fa';
                optionDiv.style.opacity = '1';
                optionDiv.style.cursor = 'pointer';
                
                // Re-enable all options
                checkbox.disabled = false;
            });
            
            // Clear donation field
            document.getElementById('custom-donation-amount').value = '';
            
            // Reset children-under-5 visibility
            updateChildrenUnder5Visibility();
            
            // Reset form state
            isSubmitting = false;
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Register Now';
            submitBtn.disabled = false;
            
            // Scroll to success message
            successMessage.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Form submission to Google Sheets
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Prevent multiple submissions
        if (isSubmitting) {
            return;
        }

        // Comprehensive validation
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            showValidationErrors(validationErrors);
            return;
        }
        
        // Remove any existing error messages
        const existingErrorDiv = document.getElementById('validation-errors');
        if (existingErrorDiv) {
            existingErrorDiv.remove();
        }
        
        // Security: Update rate limiting
        const now = Date.now();
        lastSubmissionTime = now;
        
        // Set submitting state
        isSubmitting = true;
        
            // Show loading state
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    
    // Show please wait message
    const pleaseWaitMsg = document.createElement('div');
    pleaseWaitMsg.id = 'please-wait-message';
    pleaseWaitMsg.style.cssText = `
        background: linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%);
        border: 2px solid var(--red);
        border-radius: 12px;
        padding: 1.5rem;
        margin: 1.5rem 0;
        color: var(--red);
        font-weight: 600;
        text-align: center;
        font-size: 1.2rem;
        box-shadow: 0 4px 15px rgba(255, 107, 53, 0.2);
        animation: pulse 2s infinite;
    `;
    pleaseWaitMsg.innerHTML = `
        <div style="margin-bottom: 0.5rem;">
            <i class="fas fa-clock" style="font-size: 1.5rem; margin-right: 0.5rem;"></i>
            Please wait while you are registering...
        </div>
        <div style="font-size: 0.9rem; color: #666; font-weight: 400; margin-bottom: 1rem;">
            This may take a few moments. Please do not refresh the page.
        </div>
        <div style="width: 100%; height: 4px; background: rgba(255, 107, 53, 0.2); border-radius: 2px; overflow: hidden;">
            <div style="width: 100%; height: 100%; background: var(--red); border-radius: 2px; animation: loading 2s infinite;"></div>
        </div>
    `;
    
    // Insert before the form
    form.parentNode.insertBefore(pleaseWaitMsg, form);
        
        // Security: Get secure form data
        const secureFormData = getSecureFormData();
        if (!secureFormData) {
            // Remove please wait message
            const pleaseWaitMsg = document.getElementById('please-wait-message');
            if (pleaseWaitMsg) {
                pleaseWaitMsg.remove();
            }
            
            showValidationErrors(['Security validation failed. Please refresh and try again.']);
            isSubmitting = false;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }
        
        // Prepare form data for Google Sheets with security
        const htmlFormData = new FormData(form);
        
        // Security: Sanitize all inputs
        const sanitizedName = sanitizeInput(htmlFormData.get('name'), 'name');
        const sanitizedEmail = sanitizeInput(htmlFormData.get('email'), 'email');
        const sanitizedContact = sanitizeInput(htmlFormData.get('contact'), 'phone');
        const sanitizedTransactionId = sanitizeInput(document.getElementById('transactionId').value.trim(), 'text');
        
                    // Security: Use secure calculation instead of user input
            const { adultCount, childAboveCount, childBelowCount, dayPassCount, customDonationAmount, isStudentSelected, totalAmount } = secureFormData;
        
        // Security: Create data object with integrity hash
        const data = {
            // Sanitized user inputs
            name: sanitizedName,
            whatsapp: countryCode.value + sanitizedContact,
            email: sanitizedEmail,
            member_type: 'BCA Member',
            
            // Secure calculated values
            adult: adultCount,
            student: isStudentSelected ? 1 : 0,
            child_above: childAboveCount,
            child_below: childBelowCount,
            day_pass: dayPassCount,
            total_amount: totalAmount,
            payment_proof: sanitizedTransactionId || 'Not provided',
            
            // Security fields
            security_token: securityToken,
            form_timestamp: formInitialState.timestamp,
            submission_time: now,
            user_agent: navigator.userAgent.substring(0, 200),
            form_hash: generateFormHash({
                name: sanitizedName,
                email: sanitizedEmail,
                total_amount: totalAmount,
                adult: adultCount,
                student: isStudentSelected ? 1 : 0,
                child_above: childAboveCount,
                child_below: childBelowCount,
                day_pass: dayPassCount
            })
        };
        
        // Send to Google Sheets
        sendToGoogleSheets(data);
        
        
        function sendToGoogleSheets(data) {
            // Send to Registration Google Sheets
            const registrationScriptUrl = 'https://script.google.com/macros/s/AKfycbzsupwSMKIarJWyj8hmvZKbVPP2nW6w_4ZVwUaeKg_aucgQVaqyLXImBTlMbYoRzfjP_Q/exec';
            
            // Simple direct request (no CORS complications)
            fetch(registrationScriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(() => {
                // Show success message and reset form
                showSuccessMessage();
            })
            .catch(error => {
                console.error('Error submitting registration:', error);
                
                // Try direct request as fallback (for production)
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    fetch(registrationScriptUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    })
                    .then(() => {
                        // Assume success for no-cors requests
                        // Show success message and reset form
                        showSuccessMessage();
                    })
                    .catch(fallbackError => {
                        console.error('Fallback also failed:', fallbackError);
                        showError();
                    });
                } else {
                    showError();
                }
                
                function showError() {
                    // Remove please wait message
                    const pleaseWaitMsg = document.getElementById('please-wait-message');
                    if (pleaseWaitMsg) {
                        pleaseWaitMsg.remove();
                    }
                    
                    // Reset submission state and button
                    isSubmitting = false;
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    
                    // Show error message to user
                    alert('Registration failed. Please try again or contact support.');
                }
            });
        }
    });
    
    // Add focus effects to form inputs
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.borderColor = '#FF6B35';
            this.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.1)';
        });
        
        input.addEventListener('blur', function() {
            this.style.borderColor = '#ddd';
            this.style.boxShadow = 'none';
        });
    });
    
    // Add CSS animation for please wait message
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.02); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
    `;
    document.head.appendChild(style);
    

});

// Responsive slider sizing for any sliders on the page
function adjustSliderSize() {
    const slider = document.querySelector('.slideshow-container');
    if (slider) {
        if (window.innerWidth <= 768) {
            // Mobile
            slider.style.maxWidth = '100%';
            slider.style.height = '300px';
        } else if (window.innerWidth <= 1024) {
            // Tablet
            slider.style.maxWidth = '500px';
            slider.style.height = '350px';
        } else {
            // Desktop
            slider.style.maxWidth = '600px';
            slider.style.height = '400px';
        }
    }
}

// Adjust size on load and resize
window.addEventListener('load', adjustSliderSize);
window.addEventListener('resize', adjustSliderSize); 