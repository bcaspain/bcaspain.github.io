/** Renders blog post cards on /blog/ from data/blog-posts.json */
(() => {
  const grid = document.getElementById('blog-posts-grid');
  const empty = document.getElementById('blog-empty-state');
  if (!grid) return;

  function formatDate(iso) {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(iso + 'T12:00:00'));
    } catch {
      return iso;
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderCard(post) {
    const href = `${post.slug}.html`;
    const tags = (post.tags || []).join(' · ');
    return `
      <a href="${escapeHtml(href)}" class="blog-post-card">
        <div class="card-image">
          <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt || post.title)}" loading="lazy" decoding="async" width="1024" height="682">
        </div>
        <div class="card-content">
          <h3>${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(post.excerpt)}</p>
          ${tags ? `<p class="blog-post-tags">${escapeHtml(tags)}</p>` : ''}
          <time datetime="${escapeHtml(post.date)}">${formatDate(post.date)}</time>
        </div>
      </a>`;
  }

  async function loadPosts() {
    try {
      const res = await fetch('/data/blog-posts.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const posts = await res.json();
      if (!Array.isArray(posts) || posts.length === 0) return;

      posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      grid.innerHTML = posts.map(renderCard).join('');
      grid.hidden = false;
      if (empty) empty.hidden = true;
    } catch {
      /* Keep empty state visible on fetch failure */
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPosts);
  } else {
    loadPosts();
  }
})();
