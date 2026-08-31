(() => {
  const PLACEHOLDER_ID = 'navbar-placeholder';

  function normalizePath(pathname) {
    // GitHub Pages may serve / and /index.html interchangeably.
    if (!pathname || pathname === '/' || pathname === '/index.html') return '/';
    if (pathname === '/blog' || pathname === '/blog/' || pathname === '/blog/index.html') {
      return '/blog/';
    }
    return pathname;
  }

  function setActiveLink(container) {
    const current = normalizePath(window.location.pathname);
    const links = Array.from(container.querySelectorAll('a.nav-link'));

    links.forEach((a) => a.classList.remove('active'));
    container.querySelectorAll('.nav-dropdown-toggle').forEach((toggle) => {
      toggle.classList.remove('active');
    });

    // Prefer exact match; fallback to matching by filename.
    const exact = links.find((a) => {
      try {
        const url = new URL(a.getAttribute('href'), window.location.origin);
        return normalizePath(url.pathname) === current;
      } catch {
        return false;
      }
    });

    const byFilename =
      exact ||
      links.find((a) => {
        const href = a.getAttribute('href') || '';
        return href && current.endsWith('/' + href);
      });

    const active = exact || byFilename;
    if (active) {
      active.classList.add('active');
      const dropdown = active.closest('.nav-dropdown');
      const toggle = dropdown?.querySelector('.nav-dropdown-toggle');
      if (toggle) toggle.classList.add('active');
      return;
    }

    // Any page under /blog/ (e.g. future posts) highlights the Blog nav item.
    if (current.startsWith('/blog/') && current !== '/blog/') {
      const blogLink = links.find((a) => {
        try {
          return normalizePath(new URL(a.getAttribute('href'), window.location.origin).pathname) === '/blog/';
        } catch {
          return false;
        }
      });
      if (blogLink) {
        blogLink.classList.add('active');
        const dropdown = blogLink.closest('.nav-dropdown');
        const toggle = dropdown?.querySelector('.nav-dropdown-toggle');
        if (toggle) toggle.classList.add('active');
      }
    }
  }

  let navDropdownListenersAttached = false;

  function closeNavDropdowns() {
    document.querySelectorAll('.nav-dropdown[open]').forEach((dropdown) => {
      dropdown.open = false;
    });
  }

  function initNavDropdown(container) {
    if (!container.querySelector('.nav-dropdown')) return;

    container.querySelectorAll('.nav-dropdown-item').forEach((item) => {
      item.addEventListener('click', () => {
        const dropdown = item.closest('.nav-dropdown');
        if (dropdown) dropdown.open = false;
      });
    });

    if (navDropdownListenersAttached) return;
    navDropdownListenersAttached = true;

    // Capture phase so nav-menu stopPropagation does not block outside-close.
    document.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-dropdown[open]').forEach((dropdown) => {
        if (!dropdown.contains(e.target)) {
          dropdown.open = false;
        }
      });
    }, true);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNavDropdowns();
    });
  }

  async function loadNavbar() {
    const placeholder = document.getElementById(PLACEHOLDER_ID);
    if (!placeholder) return;

    try {
      const res = await fetch('/html/navbar.html', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Failed to load navbar.html (${res.status})`);
      const html = await res.text();
      placeholder.innerHTML = html;

      // Mark active link based on current URL.
      setActiveLink(placeholder);
      initNavDropdown(placeholder);

      document.dispatchEvent(new Event('navbar:loaded'));
    } catch {
    }
  }

  function loadColorThemeScript() {
    if (document.querySelector('script[data-color-theme-js]')) return;
    const navScript = document.querySelector('script[src*="navbar.js"]');
    const href = navScript
      ? navScript.getAttribute('src').replace(/navbar\.js(?:\?.*)?$/, 'color-theme.js')
      : '/js/color-theme.js';
    const script = document.createElement('script');
    script.src = href;
    script.defer = true;
    script.setAttribute('data-color-theme-js', '');
    document.head.appendChild(script);
  }

  function boot() {
    loadColorThemeScript();
    loadNavbar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
