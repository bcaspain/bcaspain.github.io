// Local-only config for testing (not deployed).
// 1. Copy this file to local-env.js (same folder)
// 2. Set your Google Apps Script / reCAPTCHA values below
// 3. Serve the site locally, e.g. python3 -m http.server 8080
//    then open http://localhost:8080/html/registration.html
//    or http://localhost:8080/html/submit_blog.html
//    or http://localhost:8080/html/contact.html

window.DP_GAS_URL = 'https://script.google.com/macros/s/YOUR_REGISTRATION_SCRIPT_ID/exec';
window.BLOG_GAS_URL = 'https://script.google.com/macros/s/YOUR_BLOG_SCRIPT_ID/exec';
window.CONTACT_GAS_URL = 'https://script.google.com/macros/s/YOUR_CONTACT_SCRIPT_ID/exec';
// reCAPTCHA v3 site key (public). Secret goes in Apps Script Script Properties as RECAPTCHA_SECRET.
window.BLOG_RECAPTCHA_SITE_KEY = 'YOUR_RECAPTCHA_V3_SITE_KEY';
