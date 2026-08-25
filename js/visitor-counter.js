(() => {
  'use strict';

  if (document.querySelector('footer.footer .visitor-counter')) return;

  const footer = document.querySelector('footer.footer');
  if (!footer) return;

  const container = footer.querySelector('.footer-bottom') || footer.querySelector('.footer-content');
  if (!container) return;

  const counter = document.createElement('div');
  counter.className = 'visitor-counter';
  counter.setAttribute('aria-label', 'Visitor map');
  counter.innerHTML =
    '<a href="https://info.flagcounter.com/Zv6D" target="_blank" rel="noopener noreferrer">' +
    '<img src="https://s05.flagcounter.com/map/Zv6D/size_t/txt_000000/border_CCCCCC/pageviews_0/viewers_0/flags_0/" ' +
    'alt="Map showing countries of site visitors" width="200" height="120" loading="lazy" decoding="async">' +
    '</a>';

  const copyright = [...container.querySelectorAll(':scope > p')].find((p) =>
    /©|&copy;|rights reserved/i.test(p.textContent)
  );

  if (copyright) {
    container.insertBefore(counter, copyright);
    return;
  }

  container.appendChild(counter);
})();
