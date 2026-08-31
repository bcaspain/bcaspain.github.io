/** Renders blog post cards on /blog/ from data/blog-posts.json */
(() => {
  const grid = document.getElementById('blog-posts-grid');
  const empty = document.getElementById('blog-empty-state');
  const filterBar = document.getElementById('blog-tag-filter');
  const noResults = document.getElementById('blog-no-results');
  if (!grid || !window.BCA_BLOG) return;

  let allPosts = [];

  function getActiveTag() {
    return new URLSearchParams(window.location.search).get('tag') || '';
  }

  function render() {
    const activeTag = getActiveTag();
    const filtered = allPosts.filter((post) => window.BCA_BLOG.postMatchesTag(post, activeTag));

    if (filterBar) {
      filterBar.innerHTML = window.BCA_BLOG.renderTagFilter(allPosts, activeTag);
      filterBar.hidden = allPosts.length === 0;
    }

    if (filtered.length === 0) {
      grid.hidden = true;
      if (noResults) {
        noResults.hidden = false;
        const label = filterBar?.querySelector('.blog-tag-link.is-active');
        const tagName = label ? label.textContent : activeTag;
        noResults.innerHTML = `
          <p>No posts tagged <strong>${window.BCA_BLOG.escapeHtml(tagName)}</strong> yet.</p>
          <p><a href="/blog/" class="btn btn-secondary">Show all posts</a></p>`;
      }
      if (empty) empty.hidden = true;
      return;
    }

    grid.innerHTML = filtered
      .map((post) => window.BCA_BLOG.renderCard(post, { activeTag }))
      .join('');
    grid.hidden = false;
    if (empty) empty.hidden = true;
    if (noResults) noResults.hidden = true;
  }

  async function loadPosts() {
    try {
      allPosts = await window.BCA_BLOG.fetchPosts();
      if (allPosts.length === 0) return;
      render();
    } catch {
      /* Keep empty state visible on fetch failure */
    }
  }

  window.addEventListener('popstate', render);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPosts);
  } else {
    loadPosts();
  }
})();
