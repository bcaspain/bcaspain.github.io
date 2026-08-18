(() => {
  if (window.__dhaakPlayerInit) return;
  window.__dhaakPlayerInit = true;

  const STORAGE_KEY = 'bca-dhaak-position';
  const DRAG_THRESHOLD = 8;

  function siteBase() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length && /\.html?$/i.test(parts[parts.length - 1])) {
      parts.pop();
    }
    if (!parts.length) return '';
    return parts.map(() => '..').join('/') + '/';
  }

  function asset(path) {
    return siteBase() + path;
  }

  function loadStylesheet() {
    if (document.querySelector('link[data-dhaak-player-css]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = asset('css/dhaak-player.css');
    link.setAttribute('data-dhaak-player-css', '');
    document.head.appendChild(link);
  }

  function clampPosition(player, left, top) {
    const margin = 8;
    const width = player.offsetWidth;
    const height = player.offsetHeight;
    return {
      left: Math.max(margin, Math.min(window.innerWidth - width - margin, left)),
      top: Math.max(margin, Math.min(window.innerHeight - height - margin, top))
    };
  }

  function applyDefaultPosition(player) {
    player.classList.remove('is-positioned');
    player.style.removeProperty('left');
    player.style.removeProperty('top');
    player.style.removeProperty('right');
    player.style.removeProperty('bottom');
  }

  function savePosition(player) {
    const left = parseFloat(player.style.left);
    const top = parseFloat(player.style.top);
    if (Number.isNaN(left) || Number.isNaN(top)) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      custom: true,
      left: (left / window.innerWidth) * 100,
      top: (top / window.innerHeight) * 100
    }));
  }

  function applySavedPosition(player) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    try {
      const saved = JSON.parse(raw);
      const hasCustomFlag = saved.custom === true;
      const hasLegacyPosition = typeof saved.left === 'number' && typeof saved.top === 'number';

      if (!hasCustomFlag && !hasLegacyPosition) {
        localStorage.removeItem(STORAGE_KEY);
        return false;
      }

      const left = (saved.left / 100) * window.innerWidth;
      const top = (saved.top / 100) * window.innerHeight;
      const clamped = clampPosition(player, left, top);
      player.style.left = clamped.left + 'px';
      player.style.top = clamped.top + 'px';
      player.style.right = 'auto';
      player.style.bottom = 'auto';
      player.classList.add('is-positioned');
      return true;
    } catch (err) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
  }

  function bindDrag(player, btn) {
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    function usePixelPosition() {
      const rect = player.getBoundingClientRect();
      player.style.left = rect.left + 'px';
      player.style.top = rect.top + 'px';
      player.style.right = 'auto';
      player.style.bottom = 'auto';
      player.classList.add('is-positioned');
      return { left: rect.left, top: rect.top };
    }

    function onPointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      dragging = true;
      moved = false;
      player.classList.add('is-dragging');

      const pos = usePixelPosition();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = pos.left;
      startTop = pos.top;

      if (btn.setPointerCapture) {
        btn.setPointerCapture(e.pointerId);
      }
    }

    function onPointerMove(e) {
      if (!dragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
        moved = true;
      }

      if (!moved) return;

      const clamped = clampPosition(player, startLeft + dx, startTop + dy);
      player.style.left = clamped.left + 'px';
      player.style.top = clamped.top + 'px';
    }

    function onPointerUp(e) {
      if (!dragging) return;

      dragging = false;
      player.classList.remove('is-dragging');

      if (btn.releasePointerCapture && btn.hasPointerCapture && btn.hasPointerCapture(e.pointerId)) {
        btn.releasePointerCapture(e.pointerId);
      }

      if (moved) {
        savePosition(player);
        btn.dataset.suppressClick = '1';
        setTimeout(function () {
          delete btn.dataset.suppressClick;
        }, 0);
      }
    }

    btn.addEventListener('pointerdown', onPointerDown);
    btn.addEventListener('pointermove', onPointerMove);
    btn.addEventListener('pointerup', onPointerUp);
    btn.addEventListener('pointercancel', onPointerUp);

    window.addEventListener('resize', function () {
      if (!player.classList.contains('is-positioned')) {
        applyDefaultPosition(player);
        return;
      }

      const left = parseFloat(player.style.left);
      const top = parseFloat(player.style.top);
      if (Number.isNaN(left) || Number.isNaN(top)) return;
      const clamped = clampPosition(player, left, top);
      player.style.left = clamped.left + 'px';
      player.style.top = clamped.top + 'px';
      savePosition(player);
    });
  }

  function bindPlayer(player) {
    const btn = player.querySelector('.dhaak-float-btn');
    const audio = player.querySelector('.dhaak-float-audio');
    const label = player.querySelector('.dhaak-float-label');
    if (!btn || !audio) return;

    function setPlaying(playing) {
      player.classList.toggle('is-playing', playing);
      btn.classList.toggle('is-playing', playing);
      btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
      btn.setAttribute('aria-label', playing ? 'Stop dhaak drums' : 'Play dhaak drums');
      btn.setAttribute('title', playing ? 'Stop Dhaak (drag to move)' : 'Play Dhaak (drag to move)');
      if (label) label.textContent = playing ? 'Stop Dhaak' : 'Play Dhaak';
    }

    btn.addEventListener('click', function () {
      if (btn.dataset.suppressClick) return;

      if (audio.paused) {
        audio.play().then(function () {
          setPlaying(true);
        }).catch(function () {
          setPlaying(false);
        });
      } else {
        audio.pause();
        audio.currentTime = 0;
        setPlaying(false);
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
        setPlaying(false);
      }
    });

    bindDrag(player, btn);

    if (!applySavedPosition(player)) {
      applyDefaultPosition(player);
    }
  }

  function createPlayer() {
    const player = document.createElement('div');
    player.className = 'dhaak-float';
    player.id = 'dhaak-float-player';
    player.innerHTML =
      '<button type="button" class="dhaak-float-btn" aria-label="Play dhaak drums" aria-pressed="false" title="Play Dhaak (drag to move)">' +
        '<img src="' + asset('assets/images/dhaak-icon.webp') + '" alt="" class="dhaak-float-icon" aria-hidden="true">' +
        '<span class="dhaak-float-label">Play Dhaak</span>' +
      '</button>' +
      '<p class="dhaak-float-hint">Drag to move · Tap to play</p>' +
      '<audio class="dhaak-float-audio" preload="none" loop>' +
        '<source src="' + asset('assets/audio/dhaak.ogg') + '" type="audio/ogg">' +
      '</audio>';
    document.body.appendChild(player);
    bindPlayer(player);
  }

  function init() {
    loadStylesheet();

    const existing = document.getElementById('dhaak-player');
    if (existing) {
      existing.remove();
    }

    if (!document.getElementById('dhaak-float-player')) {
      createPlayer();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
