/** Homepage “From the blog” teaser — three latest posts */
(() => {
  const grid = document.getElementById('blog-home-grid');
  if (!grid || !window.BCA_BLOG) return;

  async function loadTeaser() {
    try {
      const posts = await window.BCA_BLOG.fetchPosts();
      const teaser = posts.slice(0, 3);
      if (teaser.length === 0) return;

      grid.innerHTML = teaser
        .map((post) => window.BCA_BLOG.renderCard(post, { baseHref: '/blog/' }))
        .join('');
      grid.hidden = false;
    } catch {
      /* Section stays hidden if fetch fails */
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTeaser);
  } else {
    loadTeaser();
  }
})();
