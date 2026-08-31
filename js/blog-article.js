/** Injects tags on individual blog article pages from data/blog-posts.json */
(() => {
  const container = document.getElementById('blog-article-tags');
  if (!container || !window.BCA_BLOG) return;

  const match = window.location.pathname.match(/\/blog\/([^/]+)\.html$/);
  if (!match) return;

  async function loadTags() {
    try {
      const posts = await window.BCA_BLOG.fetchPosts();
      const post = posts.find((p) => p.slug === match[1]);
      if (!post) return;

      const tags = [];
      if (post.series) tags.push(post.series);
      (post.tags || [])
        .filter((tag) => tag !== post.series)
        .forEach((tag) => tags.push(tag));
      if (tags.length === 0) return;

      container.innerHTML = tags
        .map((tag) => window.BCA_BLOG.renderTagLink(tag))
        .join('');
      container.hidden = false;
    } catch {
      /* Leave container hidden if fetch fails */
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTags);
  } else {
    loadTags();
  }
})();
