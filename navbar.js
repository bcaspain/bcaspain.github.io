(() => {
  const PLACEHOLDER_ID = 'navbar-placeholder';

  function normalizePath(pathname) {
    // GitHub Pages may serve / and /index.html interchangeably.
    if (!pathname || pathname === '/') return '/index.html';
    return pathname;
  }

  function setActiveLink(container) {
    const current = normalizePath(window.location.pathname);
    const links = Array.from(container.querySelectorAll('a.nav-link'));

    links.forEach((a) => a.classList.remove('active'));

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

      // If the active link is inside a dropdown, keep it open.
      const dropdown = active.closest('details.nav-dropdown');
      if (dropdown) dropdown.open = true;
    }
  }

  async function loadNavbar() {
    const placeholder = document.getElementById(PLACEHOLDER_ID);
    if (!placeholder) return;

    try {
      const res = await fetch('navbar.html', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Failed to load navbar.html (${res.status})`);
      const html = await res.text();
      placeholder.innerHTML = html;

      // Mark active link based on current URL.
      setActiveLink(placeholder);

      document.dispatchEvent(new Event('navbar:loaded'));
    } catch (err) {
      console.error(err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNavbar);
  } else {
    loadNavbar();
  }
})();

