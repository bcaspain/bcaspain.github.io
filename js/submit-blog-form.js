/** Magazine & website blog submission form — Google Drive / Docs link only */
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('blogSubmitForm');
    if (!form) return;

    const scriptUrl = (
        window.BLOG_GAS_URL && window.BLOG_GAS_URL !== '__BLOG_GAS_URL__'
            ? window.BLOG_GAS_URL
            : ''
    ).replace(/\/$/, '');

    const nameField = document.getElementById('name');
    const email = document.getElementById('email');
    const emailConfirm = document.getElementById('emailConfirm');
    const contact = document.getElementById('contact');
    const countryCode = document.getElementById('country-code');
    const contentType = document.getElementById('contentType');
    const contentLink = document.getElementById('contentLink');
    const privacy = document.getElementById('blogPrivacy');
    const successMessage = document.getElementById('successMessage');
    const errorBox = document.getElementById('blog-validation-errors');
    const submitBtn = document.getElementById('submitBtn');

    let isSubmitting = false;
    let lastSubmissionTime = 0;
    const MIN_SUBMIT_GAP_MS = 5000;

    if (privacy) {
        privacy.addEventListener('change', function() {
            privacy.setAttribute('aria-checked', privacy.checked ? 'true' : 'false');
        });
    }

    function showErrors(errors) {
        if (!errorBox) {
            alert(errors.join('\n'));
            return;
        }
        errorBox.style.display = 'block';
        errorBox.innerHTML =
            '<p><i class="fas fa-exclamation-triangle"></i> ' +
            errors.map(function(e) { return String(e); }).join('<br>') +
            '</p>';
        errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function clearErrors() {
        if (!errorBox) return;
        errorBox.style.display = 'none';
        errorBox.innerHTML = '';
    }

    function showSuccess() {
        form.style.display = 'none';
        var wait = document.getElementById('please-wait-message');
        if (wait) wait.remove();
        if (successMessage) {
            successMessage.style.display = 'block';
            successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function isGoogleDriveOrDocsUrl(url) {
        var host = url.hostname.toLowerCase();
        return host === 'docs.google.com' ||
            host === 'drive.google.com' ||
            host.endsWith('.docs.google.com') ||
            host.endsWith('.drive.google.com');
    }

    function validateContentLink(linkVal) {
        if (!linkVal) {
            return 'Please provide a Google Drive or Google Docs link to your content.';
        }
        try {
            var u = new URL(linkVal);
            if (u.protocol !== 'http:' && u.protocol !== 'https:') {
                return 'Content link must start with http:// or https://';
            }
            if (!isGoogleDriveOrDocsUrl(u)) {
                return 'Please use a Google Drive or Google Docs share link (with view access for our team).';
            }
        } catch (err) {
            return 'Please enter a valid Google Drive or Google Docs link.';
        }
        return null;
    }

    function postToGas(url, data) {
        var payload = JSON.stringify(data);
        return fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: payload
        });
    }

    function validateForm() {
        var errors = [];
        var nameVal = (nameField && nameField.value || '').trim();
        var emailVal = (email && email.value || '').trim();
        var email2 = (emailConfirm && emailConfirm.value || '').trim();
        var phone = (contact && contact.value || '').trim();
        var typeVal = (contentType && contentType.value || '').trim();
        var linkVal = (contentLink && contentLink.value || '').trim();

        if (nameVal.length < 2) errors.push('Please enter your name (at least 2 characters).');
        if (!emailVal || emailVal.indexOf('@') === -1) errors.push('Please enter a valid email.');
        if (emailVal !== email2) errors.push('Email addresses do not match.');
        if (!/^[0-9]{9,15}$/.test(phone)) errors.push('Please enter a valid WhatsApp number (9–15 digits).');
        if (!typeVal) errors.push('Please select a content type.');
        var linkErr = validateContentLink(linkVal);
        if (linkErr) errors.push(linkErr);
        if (!privacy || !privacy.checked) errors.push('Please accept the privacy policy.');

        if (Date.now() - lastSubmissionTime < MIN_SUBMIT_GAP_MS) {
            errors.push('Please wait a few seconds before submitting again.');
        }

        return errors;
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (isSubmitting) return;

        clearErrors();
        var errors = validateForm();
        if (errors.length) {
            showErrors(errors);
            return;
        }

        if (!scriptUrl) {
            showErrors(['Submission is temporarily unavailable. Please try again later or contact support.']);
            return;
        }

        isSubmitting = true;
        lastSubmissionTime = Date.now();
        var originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        var pleaseWait = document.createElement('div');
        pleaseWait.id = 'please-wait-message';
        pleaseWait.style.cssText =
            'background:linear-gradient(135deg,color-mix(in srgb,var(--secondary) 12%,transparent) 0%,color-mix(in srgb,var(--prestige) 12%,transparent) 100%);' +
            'border:2px solid var(--red);border-radius:12px;padding:1.5rem;margin:1.5rem 0;color:var(--red);' +
            'font-weight:600;text-align:center;font-size:1.1rem;';
        pleaseWait.innerHTML =
            '<div><i class="fas fa-clock"></i> Please wait while we receive your submission…</div>' +
            '<div style="font-size:0.9rem;color:var(--on-surface-variant);font-weight:400;margin-top:0.5rem;">Do not refresh the page.</div>';
        form.parentNode.insertBefore(pleaseWait, form);

        function resetUi() {
            var el = document.getElementById('please-wait-message');
            if (el) el.remove();
            isSubmitting = false;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }

        var data = {
            name: nameField.value.trim(),
            email: email.value.trim(),
            whatsapp: countryCode.value + contact.value.trim(),
            content_type: contentType.value.trim(),
            content_link: contentLink.value.trim(),
            file_base64: '',
            file_name: '',
            file_mime: ''
        };

        postToGas(scriptUrl, data)
            .then(function() {
                showSuccess();
            })
            .catch(function(err) {
                resetUi();
                showErrors([err.message || 'Submission failed. Please try again.']);
            });
    });
});
