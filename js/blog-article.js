/** Blog article page — tags, byline, author hover, reading time, related posts */
(() => {
  const tagsContainer = document.getElementById('blog-article-tags');
  const bylineContainer = document.getElementById('blog-article-byline');
  const sidebarContainer = document.getElementById('blog-article-sidebar');
  const mobileMoreContainer = document.getElementById('blog-article-more-mobile');
  if (!window.BCA_BLOG) return;

  const match = window.location.pathname.match(/\/blog\/([^/]+)\.html$/);
  if (!match) return;

  const slug = match[1];

  function authorInitials(name) {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  function estimateReadingTime(bodyEl) {
    const text = bodyEl?.textContent || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 220));
    return `${minutes} min read`;
  }

  function escapeHtml(str) {
    return window.BCA_BLOG.escapeHtml(str);
  }

  function renderAuthorPopover(authorName, authorData) {
    const initials = authorInitials(authorName);
    const role = authorData?.role || 'BCA Barcelona contributor';
    const bio = authorData?.bio || '';
    const url = authorData?.url;
    const urlLabel = authorData?.urlLabel || url;

    const linkHtml = url
      ? `<a href="${escapeHtml(url)}" class="blog-author-popover-link" target="_blank" rel="noopener noreferrer">${escapeHtml(urlLabel)}</a>`
      : '';

    return `
      <div class="blog-author-inline">
        <button type="button" class="blog-author-trigger" aria-expanded="false" aria-controls="blog-author-popover">
          <span class="blog-author-avatar" aria-hidden="true">${escapeHtml(initials)}</span>
          <span class="blog-author-name">${escapeHtml(authorName)}</span>
        </button>
        <div class="blog-author-popover" id="blog-author-popover" role="tooltip">
          <div class="blog-author-popover-header">
            <span class="blog-author-avatar blog-author-avatar--lg" aria-hidden="true">${escapeHtml(initials)}</span>
            <div class="blog-author-popover-titles">
              <p class="blog-author-popover-name">${escapeHtml(authorName)}</p>
              <p class="blog-author-popover-role">${escapeHtml(role)}</p>
            </div>
          </div>
          ${bio ? `<p class="blog-author-popover-bio">${escapeHtml(bio)}</p>` : ''}
          ${linkHtml}
        </div>
      </div>`;
  }

  function bindAuthorPopover() {
    const inline = document.querySelector('.blog-author-inline');
    const trigger = inline?.querySelector('.blog-author-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const open = inline.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', (event) => {
      if (!inline.contains(event.target)) {
        inline.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });

    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        inline.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.blur();
      }
    });
  }

  function renderByline(authorName, dateIso, dateDisplay, authorData) {
    if (!bylineContainer) return;

    const bodyEl = document.querySelector('.blog-article-body');
    const readingTime = estimateReadingTime(bodyEl);
    const popover = renderAuthorPopover(authorName, authorData);

    bylineContainer.innerHTML = `
      ${popover}
      <p class="blog-article-meta-line">
        <time datetime="${escapeHtml(dateIso)}">${escapeHtml(dateDisplay)}</time>
        <span class="blog-meta-sep" aria-hidden="true">·</span>
        <span class="blog-article-reading-time">${escapeHtml(readingTime)}</span>
      </p>`;

    bindAuthorPopover();
  }

  function renderRelatedPosts(current, allPosts) {
    if (!current || !allPosts?.length) return;

    const related = window.BCA_BLOG.pickRelatedPosts(current, allPosts, 4);
    if (related.length === 0) return;

    const sidebarHtml = window.BCA_BLOG.renderRelatedPostsPanel(current, related);
    const mobileHtml = window.BCA_BLOG.renderRelatedPostsPanel(current, related, {
      heading: 'Continue reading',
      headingClass: 'blog-related-heading blog-related-heading--mobile',
    });

    if (sidebarContainer) {
      sidebarContainer.innerHTML = sidebarHtml;
      sidebarContainer.hidden = false;
    }

    if (mobileMoreContainer) {
      mobileMoreContainer.innerHTML = mobileHtml;
      mobileMoreContainer.hidden = false;
    }
  }

  async function loadAuthors() {
    try {
      const res = await fetch('/data/blog-authors.json', { cache: 'no-cache' });
      if (!res.ok) return {};
      return await res.json();
    } catch {
      return {};
    }
  }

  async function init() {
    const authorName =
      bylineContainer?.dataset.author ||
      document.querySelector('meta[name="author"]')?.content;

    const dateIso =
      bylineContainer?.dataset.date ||
      document.querySelector('.blog-article-byline time')?.getAttribute('datetime') ||
      '';

    const dateDisplay =
      bylineContainer?.dataset.dateDisplay ||
      document.querySelector('.blog-article-byline time')?.textContent?.trim() ||
      (dateIso ? window.BCA_BLOG.formatDate(dateIso) : '');

    let authors = {};
    let post = null;
    let posts = [];

    try {
      const [fetchedPosts, authorData] = await Promise.all([
        window.BCA_BLOG.fetchPosts(),
        loadAuthors(),
      ]);
      posts = fetchedPosts;
      authors = authorData;
      post = posts.find((p) => p.slug === slug);
    } catch {
      /* Continue with static page data */
    }

    if (post) {
      renderRelatedPosts(post, posts);
    }

    if (tagsContainer && post) {
      const tags = [];
      if (post.series) tags.push(post.series);
      (post.tags || [])
        .filter((tag) => tag !== post.series)
        .forEach((tag) => tags.push(tag));

      if (tags.length > 0) {
        tagsContainer.innerHTML = tags
          .map((tag) => window.BCA_BLOG.renderTagLink(tag))
          .join('');
        tagsContainer.hidden = false;
      }
    }

    const resolvedAuthor = authorName || post?.author;
    const resolvedDate = dateIso || post?.date || '';
    const resolvedDisplay =
      dateDisplay ||
      (resolvedDate ? window.BCA_BLOG.formatDate(resolvedDate) : '');

    if (resolvedAuthor && bylineContainer) {
      renderByline(
        resolvedAuthor,
        resolvedDate,
        resolvedDisplay,
        authors[resolvedAuthor],
      );
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
