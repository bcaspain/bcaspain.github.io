(function () {
    'use strict';

    var PRIVACY_URL = '/html/privacidad.html?embed=1';
    var modal = null;
    var iframe = null;
    var lastFocus = null;
    var initialized = false;

    function injectStyles() {
        if (document.getElementById('privacy-policy-modal-styles')) {
            return;
        }

        var style = document.createElement('style');
        style.id = 'privacy-policy-modal-styles';
        style.textContent = [
            'body.privacy-modal-open { overflow: hidden; }',
            '.privacy-policy-modal {',
            '  position: fixed; inset: 0; z-index: 10000;',
            '  display: flex; align-items: center; justify-content: center;',
            '  padding: 1rem;',
            '  opacity: 0; visibility: hidden; pointer-events: none;',
            '  transition: opacity 0.25s ease, visibility 0.25s ease;',
            '}',
            '.privacy-policy-modal.is-open {',
            '  opacity: 1; visibility: visible; pointer-events: auto;',
            '}',
            '.privacy-policy-modal__backdrop {',
            '  position: absolute; inset: 0;',
            '  background: rgba(0, 0, 0, 0.55);',
            '  backdrop-filter: blur(4px);',
            '}',
            '.privacy-policy-modal__panel {',
            '  position: relative; z-index: 1;',
            '  width: min(920px, 100%);',
            '  max-height: min(88vh, 900px);',
            '  display: flex; flex-direction: column;',
            '  background: #fff;',
            '  border-radius: 16px;',
            '  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);',
            '  overflow: hidden;',
            '  transform: translateY(12px) scale(0.98);',
            '  transition: transform 0.25s ease;',
            '}',
            '.privacy-policy-modal.is-open .privacy-policy-modal__panel {',
            '  transform: translateY(0) scale(1);',
            '}',
            '.privacy-policy-modal__header {',
            '  display: flex; align-items: center; justify-content: space-between; gap: 1rem;',
            '  padding: 1rem 1.25rem;',
            '  background: linear-gradient(135deg, #c8102e 0%, #a50d24 100%);',
            '  color: #fff;',
            '  flex-shrink: 0;',
            '}',
            '.privacy-policy-modal__title {',
            '  margin: 0; font-size: 1.1rem; font-weight: 600; line-height: 1.4;',
            '}',
            '.privacy-policy-modal__close {',
            '  flex-shrink: 0; width: 40px; height: 40px;',
            '  border: 1px solid rgba(255, 255, 255, 0.35);',
            '  border-radius: 50%; background: rgba(255, 255, 255, 0.12);',
            '  color: #fff; font-size: 1.25rem; line-height: 1;',
            '  cursor: pointer; display: inline-flex; align-items: center; justify-content: center;',
            '  transition: background 0.2s ease, transform 0.2s ease;',
            '}',
            '.privacy-policy-modal__close:hover {',
            '  background: rgba(255, 255, 255, 0.22);',
            '}',
            '.privacy-policy-modal__close:focus-visible {',
            '  outline: 2px solid #fff; outline-offset: 2px;',
            '}',
            '.privacy-policy-modal__body {',
            '  flex: 1; min-height: 0; background: #fafafa;',
            '}',
            '.privacy-policy-modal__body iframe {',
            '  display: block; width: 100%; height: min(72vh, 760px); border: 0; background: #fff;',
            '}',
            '@media (max-width: 768px) {',
            '  .privacy-policy-modal { padding: 0.5rem; }',
            '  .privacy-policy-modal__panel { max-height: 92vh; border-radius: 12px; }',
            '  .privacy-policy-modal__header { padding: 0.85rem 1rem; }',
            '  .privacy-policy-modal__title { font-size: 1rem; }',
            '  .privacy-policy-modal__body iframe { height: min(78vh, 700px); }',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    }

    function buildModal() {
        modal = document.createElement('div');
        modal.id = 'privacyPolicyModal';
        modal.className = 'privacy-policy-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'privacyPolicyModalTitle');
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML = [
            '<div class="privacy-policy-modal__backdrop" data-privacy-modal-close></div>',
            '<div class="privacy-policy-modal__panel">',
            '  <header class="privacy-policy-modal__header">',
            '    <h2 id="privacyPolicyModalTitle" class="privacy-policy-modal__title">',
            '      Política de Privacidad / Privacy Policy',
            '    </h2>',
            '    <button type="button" class="privacy-policy-modal__close" data-privacy-modal-close aria-label="Close privacy policy">',
            '      <i class="fas fa-times" aria-hidden="true"></i>',
            '    </button>',
            '  </header>',
            '  <div class="privacy-policy-modal__body">',
            '    <iframe id="privacyPolicyModalFrame" title="Privacy Policy" src="about:blank"></iframe>',
            '  </div>',
            '</div>'
        ].join('');

        document.body.appendChild(modal);
        iframe = modal.querySelector('#privacyPolicyModalFrame');

        modal.addEventListener('click', function (event) {
            if (event.target.closest('[data-privacy-modal-close]')) {
                closeModal();
            }
        });
    }

    function openModal() {
        injectStyles();
        if (!modal) {
            buildModal();
        }

        lastFocus = document.activeElement;
        iframe.src = PRIVACY_URL;
        modal.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(function () {
            modal.classList.add('is-open');
        });
        document.body.classList.add('privacy-modal-open');

        var closeBtn = modal.querySelector('.privacy-policy-modal__close');
        if (closeBtn) {
            closeBtn.focus();
        }
    }

    function closeModal() {
        if (!modal) {
            return;
        }

        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('privacy-modal-open');
        iframe.src = 'about:blank';

        if (lastFocus && typeof lastFocus.focus === 'function') {
            lastFocus.focus();
        }
    }

    function bindPrivacyLinks(root) {
        var scope = root || document;
        scope.querySelectorAll('a.js-privacy-modal-link').forEach(function (link) {
            if (link.dataset.privacyModalBound === 'true') {
                return;
            }

            link.dataset.privacyModalBound = 'true';
            link.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                openModal();
            });
        });
    }

    function init() {
        if (initialized) {
            return;
        }
        initialized = true;
        injectStyles();
        bindPrivacyLinks();

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && modal && modal.classList.contains('is-open')) {
                closeModal();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.openPrivacyPolicyModal = openModal;
    window.closePrivacyPolicyModal = closeModal;
})();
