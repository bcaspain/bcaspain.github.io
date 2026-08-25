/** Magazine & website blog submission form — same UX pattern as registration */
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('blogSubmitForm');
    if (!form) return;

    const scriptUrl = (
        window.BLOG_GAS_URL && window.BLOG_GAS_URL !== '__BLOG_GAS_URL__'
            ? window.BLOG_GAS_URL
            : ''
    ).replace(/\/$/, '');

    const siteKey = (
        window.BLOG_RECAPTCHA_SITE_KEY && window.BLOG_RECAPTCHA_SITE_KEY !== '__BLOG_RECAPTCHA_SITE_KEY__'
            ? window.BLOG_RECAPTCHA_SITE_KEY
            : ''
    );

    const nameField = document.getElementById('name');
    const email = document.getElementById('email');
    const emailConfirm = document.getElementById('emailConfirm');
    const contact = document.getElementById('contact');
    const countryCode = document.getElementById('country-code');
    const contentType = document.getElementById('contentType');
    const contentLink = document.getElementById('contentLink');
    const contentFileInput = document.getElementById('contentFile');
    const contentFilename = document.getElementById('contentFilename');
    const privacy = document.getElementById('blogPrivacy');
    const successMessage = document.getElementById('successMessage');
    const errorBox = document.getElementById('blog-validation-errors');
    const submitBtn = document.getElementById('submitBtn');

    const MAX_FILE_BYTES = 10 * 1024 * 1024;
    const ALLOWED_MIMES = Object.freeze([
        'image/png',
        'image/jpeg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]);

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

    function inferMime(file) {
        var typed = String((file && file.type) || '').toLowerCase();
        if (typed === 'image/jpg') typed = 'image/jpeg';
        if (ALLOWED_MIMES.indexOf(typed) !== -1) return typed;
        var name = String((file && file.name) || '').toLowerCase();
        if (name.endsWith('.png')) return 'image/png';
        if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
        if (name.endsWith('.docx')) {
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        }
        if (name.endsWith('.doc')) return 'application/msword';
        return typed;
    }

    function validateFile(file) {
        if (!file) return 'Please attach a content file.';
        var mime = inferMime(file);
        if (ALLOWED_MIMES.indexOf(mime) === -1) {
            return 'Invalid file type. Only DOC, DOCX, JPG, and PNG are allowed.';
        }
        if (file.size > MAX_FILE_BYTES) {
            return 'File too large. Maximum size is 10 MB.';
        }
        return null;
    }

    function readFile(file) {
        return new Promise(function(resolve, reject) {
            var error = validateFile(file);
            if (error) {
                reject(new Error(error));
                return;
            }
            var mime = inferMime(file);
            var reader = new FileReader();
            reader.onload = function() {
                var dataUrl = String(reader.result || '');
                var base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
                if (!base64) {
                    reject(new Error('Could not read content file.'));
                    return;
                }
                resolve({
                    file_base64: base64,
                    file_name: file.name || 'content',
                    file_mime: mime
                });
            };
            reader.onerror = function() {
                reject(new Error('Could not read content file.'));
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * Same as registration: hidden iframe POST, stay on this domain,
     * then show local success message (cannot read GAS response cross-origin).
     */
    function postToGas(url, data) {
        var payload = JSON.stringify(data);
        console.log('[blog] POST bytes≈' + payload.length);

        return new Promise(function(resolve) {
            var frameName = 'blogUploadFrame' + Date.now();
            var iframe = document.createElement('iframe');
            iframe.name = frameName;
            iframe.setAttribute('aria-hidden', 'true');
            iframe.style.cssText = 'display:none;width:0;height:0;border:0;';
            document.body.appendChild(iframe);

            var formEl = document.createElement('form');
            formEl.method = 'POST';
            formEl.action = url;
            formEl.target = frameName;
            formEl.acceptCharset = 'UTF-8';
            formEl.enctype = 'multipart/form-data';
            formEl.style.display = 'none';

            var input = document.createElement('textarea');
            input.name = 'payload';
            input.value = payload;
            formEl.appendChild(input);
            document.body.appendChild(formEl);
            formEl.submit();

            window.setTimeout(function() {
                try { document.body.removeChild(formEl); } catch (err) {}
                try { document.body.removeChild(iframe); } catch (err) {}
                resolve();
            }, 4000);
        });
    }

    if (contentFileInput) {
        contentFileInput.addEventListener('change', function() {
            var file = contentFileInput.files && contentFileInput.files[0];
            if (!file) {
                if (contentFilename) contentFilename.textContent = '';
                return;
            }
            var error = validateFile(file);
            if (error) {
                alert(error);
                contentFileInput.value = '';
                if (contentFilename) contentFilename.textContent = '';
                return;
            }
            if (contentFilename) {
                var sizeKb = Math.max(1, Math.round(file.size / 1024));
                contentFilename.textContent = file.name + ' (' + sizeKb + ' KB)';
            }
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
        var file = contentFileInput && contentFileInput.files && contentFileInput.files[0];

        if (nameVal.length < 2) errors.push('Please enter your name (at least 2 characters).');
        if (!emailVal || emailVal.indexOf('@') === -1) errors.push('Please enter a valid email.');
        if (emailVal !== email2) errors.push('Email addresses do not match.');
        if (!/^[0-9]{9,15}$/.test(phone)) errors.push('Please enter a valid WhatsApp number (9–15 digits).');
        if (!typeVal) errors.push('Please select a content type.');
        if (linkVal) {
            try {
                var u = new URL(linkVal);
                if (u.protocol !== 'http:' && u.protocol !== 'https:') {
                    errors.push('Content link must start with http:// or https://');
                }
            } catch (err) {
                errors.push('Please enter a valid content link URL, or leave it blank.');
            }
        }
        var fileErr = validateFile(file);
        if (fileErr) errors.push(fileErr);
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

        var file = contentFileInput.files[0];
        readFile(file)
            .then(function(filePayload) {
                var data = {
                    name: nameField.value.trim(),
                    email: email.value.trim(),
                    whatsapp: countryCode.value + contact.value.trim(),
                    content_type: contentType.value.trim(),
                    content_link: (contentLink.value || '').trim(),
                    file_base64: filePayload.file_base64,
                    file_name: filePayload.file_name,
                    file_mime: filePayload.file_mime
                };
                return postToGas(scriptUrl, data);
            })
            .then(function() {
                showSuccess();
            })
            .catch(function(err) {
                console.error('Blog submission failed:', err);
                resetUi();
                showErrors([err.message || 'Submission failed. Please try again.']);
            });
    });
});
