/** Shared blog post helpers — used by blog index and homepage teaser */
window.BCA_BLOG = (() => {
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

  function tagHref(tag) {
    return `/blog/?tag=${encodeURIComponent(tag)}`;
  }

  /** Featured posts first (JSON order), then others by date descending. */
  function sortPosts(posts) {
    const featured = posts.filter((p) => p.featured);
    const rest = posts
      .map((p, i) => ({ post: p, i }))
      .filter(({ post }) => !post.featured)
      .sort((a, b) => {
        const byDate = (b.post.date || '').localeCompare(a.post.date || '');
        return byDate !== 0 ? byDate : a.i - b.i;
      })
      .map(({ post }) => post);
    return [...featured, ...rest];
  }

  function postMatchesTag(post, tag) {
    if (!tag) return true;
    return post.series === tag || (post.tags || []).includes(tag);
  }

  function collectTags(posts) {
    const tags = new Set();
    posts.forEach((post) => {
      (post.tags || []).forEach((tag) => tags.add(tag));
      if (post.series) tags.add(post.series);
    });
    const order = ['Travel', 'Food', 'Culture', 'Essay', 'Sharodiya 2025'];
    return order.filter((tag) => tags.has(tag));
  }

  function renderTagLink(tag, options = {}) {
    const isActive = options.activeTag === tag;
    const className = `blog-tag-link${isActive ? ' is-active' : ''}`;
    const current = isActive ? ' aria-current="true"' : '';
    return `<a href="${escapeHtml(tagHref(tag))}" class="${className}"${current}>${escapeHtml(tag)}</a>`;
  }

  function renderCardTags(post, options = {}) {
    const items = [];
    if (post.series) items.push(post.series);
    (post.tags || [])
      .filter((tag) => tag !== post.series)
      .forEach((tag) => items.push(tag));
    if (items.length === 0) return '';

    return `<div class="blog-post-card-tags">${items.map((tag) => renderTagLink(tag, options)).join('')}</div>`;
  }

  function renderCard(post, options = {}) {
    const baseHref = options.baseHref || '';
    const href = `${baseHref}${post.slug}.html`;
    const series = post.series
      ? `<span class="blog-post-series">${escapeHtml(post.series)}</span>`
      : '';
    const cardImage = post.imagePlaceholder
      ? `<div class="card-image card-image--label" aria-hidden="true">${escapeHtml(post.imagePlaceholder)}</div>`
      : `<div class="card-image">
          <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt || post.title)}" loading="lazy" decoding="async" width="1024" height="682">
        </div>`;
    const tagLinks = options.linkTags === false ? '' : renderCardTags(post, options);

    return `
      <article class="blog-post-card">
        <a href="${escapeHtml(href)}" class="blog-post-card-main">
          ${cardImage}
          <div class="card-content">
            ${series}
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.excerpt)}</p>
            <time datetime="${escapeHtml(post.date)}">${formatDate(post.date)}</time>
          </div>
        </a>
        ${tagLinks}
      </article>`;
  }

  function renderTagFilter(posts, activeTag) {
    const tags = collectTags(posts);
    if (tags.length === 0) return '';

    const allLink = activeTag
      ? '<a href="/blog/" class="blog-tag-link">All</a>'
      : '<span class="blog-tag-link is-active" aria-current="true">All</span>';

    const tagLinks = tags.map((tag) => renderTagLink(tag, { activeTag })).join('');
    return `${allLink}${tagLinks}`;
  }

  function pickRelatedPosts(current, posts, limit = 4) {
    const others = posts.filter((p) => p.slug !== current.slug);
    const currentTags = new Set(current.tags || []);

    const scored = others.map((post) => {
      let score = 0;
      if (current.series && post.series === current.series) score += 100;
      (post.tags || []).forEach((tag) => {
        if (currentTags.has(tag)) score += 10;
      });
      const dateNum = Number((post.date || '').replace(/-/g, ''));
      if (dateNum) score += dateNum / 1e8;
      return { post, score };
    });

    scored.sort((a, b) => {
      const byScore = b.score - a.score;
      return byScore !== 0 ? byScore : a.post.slug.localeCompare(b.post.slug);
    });

    return scored.slice(0, limit).map(({ post }) => post);
  }

  function relatedPostsHeading(current, related) {
    if (
      current.series &&
      related.some((p) => p.series === current.series)
    ) {
      return `More from ${current.series}`;
    }
    const tag = (current.tags || [])[0];
    if (tag) return `More on ${tag}`;
    return 'More from our blog';
  }

  function renderRelatedThumb(post) {
    if (post.imagePlaceholder) {
      return `<div class="blog-related-thumb blog-related-thumb--label" aria-hidden="true">${escapeHtml(post.imagePlaceholder)}</div>`;
    }
    if (!post.image) return '';
    return `<div class="blog-related-thumb"><img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt || post.title)}" loading="lazy" decoding="async" width="56" height="42"></div>`;
  }

  function renderRelatedMeta(post) {
    const parts = [formatDate(post.date)];
    if (post.series) parts.push(post.series);
    else if (post.tags?.[0]) parts.push(post.tags[0]);
    return parts.join(' · ');
  }

  function renderRelatedPostsPanel(current, related, options = {}) {
    if (!related.length) return '';

    const heading =
      options.heading ||
      relatedPostsHeading(current, related);
    const headingClass = options.headingClass || 'blog-related-heading';
    const listClass = options.listClass || 'blog-related-list';

    const items = related
      .map((post) => {
        const href = `${options.baseHref || ''}${post.slug}.html`;
        return `
        <li class="blog-related-item">
          <a href="${escapeHtml(href)}">
            ${renderRelatedThumb(post)}
            <div class="blog-related-text">
              <p class="blog-related-title">${escapeHtml(post.title)}</p>
              <p class="blog-related-meta">${escapeHtml(renderRelatedMeta(post))}</p>
            </div>
          </a>
        </li>`;
      })
      .join('');

    return `
      <h2 class="${headingClass}">${escapeHtml(heading)}</h2>
      <ul class="${listClass}">
        ${items}
      </ul>
      <a href="/blog/" class="blog-related-all">View all posts <span aria-hidden="true">→</span></a>`;
  }

  async function fetchPosts() {
    const res = await fetch('/data/blog-posts.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const posts = await res.json();
    if (!Array.isArray(posts)) throw new Error('Invalid blog data');
    return sortPosts(posts);
  }

  return {
    formatDate,
    escapeHtml,
    sortPosts,
    tagHref,
    postMatchesTag,
    collectTags,
    renderTagLink,
    renderCardTags,
    renderCard,
    renderTagFilter,
    pickRelatedPosts,
    relatedPostsHeading,
    renderRelatedPostsPanel,
    fetchPosts,
  };
})();
