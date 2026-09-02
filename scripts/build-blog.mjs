/**
 * Build blog HTML and blog-posts.json from blog/posts/*.md
 * Run: npm run build:blog
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_DIR = path.join(ROOT, 'blog', 'posts');
const TEMPLATE_PATH = path.join(ROOT, 'blog', '_template.html');
const BLOG_DIR = path.join(ROOT, 'blog');
const POSTS_JSON_PATH = path.join(ROOT, 'data', 'blog-posts.json');
const AUTHORS_JSON_PATH = path.join(ROOT, 'data', 'blog-authors.json');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const LLMS_TXT_PATH = path.join(ROOT, 'llms.txt');
const SITE_ORIGIN = 'https://bcaspain.org';
const SHARODIYA_PDF = '../brochures/BCA_Sharodiya_2025.pdf';

marked.setOptions({
  gfm: true,
  breaks: false,
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeJson(str) {
  return JSON.stringify(String(str)).slice(1, -1);
}

function normalizeDate(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).trim();
}

function formatDate(value) {
  const iso = normalizeDate(value);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${iso}T12:00:00`));
}

function slugFromFilename(filename) {
  return filename.replace(/\.md$/i, '');
}

function toAbsoluteUrl(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  const normalized = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${SITE_ORIGIN}${normalized}`;
}

function toHeroSrc(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/blog/')) {
    return imagePath.replace(/^\/blog\//, '');
  }
  if (imagePath.startsWith('/')) {
    return `..${imagePath}`;
  }
  return imagePath;
}

function sortPosts(posts) {
  const featured = posts.filter((p) => p.featured);
  const rest = posts
    .filter((p) => !p.featured)
    .sort((a, b) => {
      const byDate = (b.date || '').localeCompare(a.date || '');
      return byDate !== 0 ? byDate : a.slug.localeCompare(b.slug);
  });
  return [...featured, ...rest];
}

function wrapImagesInFigure(html) {
  return html.replace(
    /<p>\s*<img([^>]*?)>\s*<\/p>/gi,
    (match, attrs) => {
      const altMatch = attrs.match(/\balt="([^"]*)"/i);
      const alt = altMatch ? altMatch[1] : '';
      const imgTag = `<img${attrs} loading="lazy" decoding="async">`;
      if (alt) {
        return `<figure class="blog-article-figure">${imgTag}<figcaption>${alt}</figcaption></figure>`;
      }
      return `<figure class="blog-article-figure">${imgTag}</figure>`;
    },
  );
}

function applyLedeClass(html, useLede) {
  if (!useLede) return html;
  return html.replace(/<p>/, '<p class="blog-article-lede">');
}

function externalLinkAttrs(html) {
  return html.replace(
    /<a href="(https?:\/\/[^"#]+)">/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">',
  );
}

function buildMagazineNote(data) {
  if (data.magazineNote === false) return '';
  if (typeof data.magazineNote === 'string') {
    const noteHtml = marked.parseInline(data.magazineNote);
    return `<p class="blog-article-magazine-note">${noteHtml}</p>`;
  }
  const lang = data.magazineNoteLang || (data.bodyLang === 'bn' ? 'bn' : 'en');
  if (lang === 'bn') {
    return `<p class="blog-article-magazine-note">প্রথম প্রকাশ: <a href="${SHARODIYA_PDF}">Sharodiya 2025</a>, BCA Barcelona-র বার্ষিক পত্রিকা।</p>`;
  }
  return `<p class="blog-article-magazine-note">First published in <a href="${SHARODIYA_PDF}">Sharodiya 2025</a>, BCA Barcelona's annual magazine.</p>`;
}

function buildHeroSection(data) {
  if (!data.image) return '';
  const src = escapeHtml(toHeroSrc(data.image));
  const alt = escapeHtml(data.imageAlt || data.title || '');
  const width = data.imageWidth ? ` width="${data.imageWidth}"` : '';
  const height = data.imageHeight ? ` height="${data.imageHeight}"` : '';
  const caption = data.imageCaption
    ? `<figcaption>${escapeHtml(data.imageCaption)}</figcaption>`
    : '';
  return `
            <figure class="blog-article-hero container">
                <img src="${src}" alt="${alt}"${width}${height} loading="eager" decoding="async">
                ${caption}
            </figure>`;
}

function buildSummarySection(data) {
  if (!data.summary) return '';
  const title = escapeHtml(data.summaryTitle || 'In English');
  const bodyHtml = externalLinkAttrs(marked.parse(String(data.summary)));
  return `
            <div class="blog-article-summary container">
                <h2>${title}</h2>
                ${bodyHtml}
            </div>`;
}

function buildBodySection(data, bodyMarkdown) {
  let html = externalLinkAttrs(marked.parse(bodyMarkdown));
  html = wrapImagesInFigure(html);
  html = applyLedeClass(html, data.lede !== false);
  const magazineNote = buildMagazineNote(data);
  if (magazineNote) {
    html = html.trimEnd() + `\n\n                ${magazineNote}`;
  }

  const classes = ['blog-article-body', 'container'];
  if (data.bodyLang === 'bn') classes.push('blog-article-body--bn');
  const langAttr = data.bodyLang ? ` lang="${escapeHtml(data.bodyLang)}"` : '';
  return `
            <div class="${classes.join(' ')}"${langAttr}>
                ${html}
            </div>`;
}

function buildPostListEntry(slug, data) {
  const entry = {
    slug,
    title: data.cardTitle || data.title,
    excerpt: data.excerpt,
    date: normalizeDate(data.date),
    author: data.author,
    imageAlt: data.imageAlt || data.title,
    tags: data.tags || [],
  };
  if (data.featured) entry.featured = true;
  if (data.series) entry.series = data.series;
  if (data.imagePlaceholder) {
    entry.imagePlaceholder = data.imagePlaceholder;
  } else if (data.image) {
    entry.image = data.image.startsWith('/') ? data.image : `/blog/${data.image}`;
  }
  return entry;
}

function buildPage(slug, data, bodyMarkdown, template) {
  const titleBrand = data.titleBrand || ' — BCA Spain Blog';
  const headline = data.cardTitle || data.title;
  const fullTitle = `${headline}${titleBrand}`;
  const ogImage = toAbsoluteUrl(data.ogImage || data.image);
  const metaDescription = data.excerpt || data.description || '';
  const ogDescription = data.ogDescription || metaDescription;

  const seriesEyebrow = data.series
    ? ` · <span class="blog-post-series">${escapeHtml(data.series)}</span>`
    : '';

  const metaExtra = data.metaExtraBn
    ? `\n                <p class="blog-article-meta-extra" lang="bn">${escapeHtml(data.metaExtraBn)}</p>`
    : '';

  const extraHead =
    data.bodyLang === 'bn' || data.summary
      ? `    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">\n`
      : '';

  const jsonLdExtra = data.inLanguage
    ? `"inLanguage": "${escapeHtml(data.inLanguage)}",\n      `
    : '';

  const authorUrlJson = data.authorUrl
    ? `,\n        "url": "${escapeHtml(data.authorUrl)}"`
    : '';

  const replacements = {
    '{{TITLE}}': escapeHtml(data.title),
    '{{FULL_TITLE}}': escapeHtml(fullTitle),
    '{{HEADLINE_JSON}}': escapeJson(headline),
    '{{TITLE_BRAND}}': escapeHtml(titleBrand),
    '{{TITLE_JSON}}': escapeJson(data.title),
    '{{SLUG}}': escapeHtml(slug),
    '{{META_DESCRIPTION}}': escapeHtml(metaDescription),
    '{{META_DESCRIPTION_JSON}}': escapeJson(metaDescription),
    '{{OG_DESCRIPTION}}': escapeHtml(ogDescription),
    '{{OG_DESCRIPTION_JSON}}': escapeJson(ogDescription),
    '{{AUTHOR}}': escapeHtml(data.author),
    '{{AUTHOR_JSON}}': escapeJson(data.author),
    '{{DATE_ISO}}': escapeHtml(normalizeDate(data.date)),
    '{{DATE_DISPLAY}}': escapeHtml(formatDate(data.date)),
    '{{IMAGE_ALT}}': escapeHtml(data.imageAlt || data.title || ''),
    '{{OG_IMAGE}}': escapeHtml(ogImage),
    '{{EXTRA_HEAD}}': extraHead,
    '{{SERIES_EYEBROW}}': seriesEyebrow,
    '{{META_EXTRA}}': metaExtra,
    '{{HERO_SECTION}}': buildHeroSection(data),
    '{{SUMMARY_SECTION}}': buildSummarySection(data),
    '{{BODY_SECTION}}': buildBodySection(data, bodyMarkdown),
    '{{JSON_LD_EXTRA}}': jsonLdExtra,
    '{{AUTHOR_URL_JSON}}': authorUrlJson,
  };

  let html = template;
  for (const [key, value] of Object.entries(replacements)) {
    html = html.split(key).join(value);
  }
  return html;
}

/** Static public pages (canonical /html/ paths). Blog posts are appended from the build. */
const STATIC_SITEMAP_PAGES = [
  { loc: '/', lastmod: '2026-09-02', changefreq: 'weekly', priority: '1.0' },
  { loc: '/html/dp2026.html', lastmod: '2026-09-02', changefreq: 'weekly', priority: '0.9' },
  { loc: '/html/registration.html', lastmod: '2026-09-02', changefreq: 'weekly', priority: '0.9' },
  { loc: '/html/schedule.html', lastmod: '2026-09-02', changefreq: 'weekly', priority: '0.8' },
  { loc: '/html/attractions.html', lastmod: '2026-09-02', changefreq: 'monthly', priority: '0.8' },
  { loc: '/html/about.html', lastmod: '2026-09-02', changefreq: 'monthly', priority: '0.8' },
  { loc: '/html/gallery.html', lastmod: '2026-09-02', changefreq: 'monthly', priority: '0.7' },
  { loc: '/blog/', lastmod: null, changefreq: 'weekly', priority: '0.7' },
  { loc: '/html/news-media.html', lastmod: '2026-09-02', changefreq: 'monthly', priority: '0.6' },
  { loc: '/html/submit_blog.html', lastmod: '2026-09-02', changefreq: 'yearly', priority: '0.4' },
  { loc: '/html/cultural-concert.html', lastmod: '2026-09-02', changefreq: 'monthly', priority: '0.7' },
  { loc: '/html/rabindra-jayanti.html', lastmod: '2026-09-02', changefreq: 'monthly', priority: '0.6' },
  { loc: '/html/rabindra-jayanti-register.html', lastmod: '2026-09-02', changefreq: 'yearly', priority: '0.4' },
  { loc: '/html/faq.html', lastmod: '2026-09-02', changefreq: 'monthly', priority: '0.8' },
  { loc: '/html/contact.html', lastmod: '2026-09-02', changefreq: 'monthly', priority: '0.7' },
  { loc: '/html/aviso-legal.html', lastmod: '2026-08-18', changefreq: 'yearly', priority: '0.2' },
  { loc: '/html/privacidad.html', lastmod: '2026-08-18', changefreq: 'yearly', priority: '0.2' },
  { loc: '/html/cookies.html', lastmod: '2026-08-18', changefreq: 'yearly', priority: '0.2' },
];

function sitemapUrlEntry({ loc, lastmod, changefreq, priority }) {
  const lines = [
    '  <url>',
    `    <loc>${SITE_ORIGIN}${loc}</loc>`,
  ];
  if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) lines.push(`    <priority>${priority}</priority>`);
  lines.push('  </url>');
  return lines.join('\n');
}

function buildSitemap(postEntries) {
  const latestPostDate = postEntries.reduce(
    (latest, post) => (post.date > latest ? post.date : latest),
    '1970-01-01',
  );

  const entries = STATIC_SITEMAP_PAGES.map((page) => {
    if (page.loc === '/blog/' && !page.lastmod) {
      return { ...page, lastmod: latestPostDate };
    }
    return page;
  });

  for (const post of postEntries) {
    entries.push({
      loc: `/blog/${post.slug}.html`,
      lastmod: post.date,
      changefreq: 'monthly',
      priority: '0.6',
    });
  }

  const body = entries.map(sitemapUrlEntry).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function llmsLink(name, path, note) {
  const url = path.startsWith('http') ? path : `${SITE_ORIGIN}${path}`;
  return note ? `- [${name}](${url}): ${note}` : `- [${name}](${url})`;
}

function buildLlmsTxt(postEntries) {
  const blogLines = postEntries.map(
    (post) => llmsLink(post.title, `/blog/${post.slug}.html`, post.excerpt),
  );

  return `# Bengali Cultural Association Barcelona

> BCA Spain (Bengali Cultural Association Barcelona) is a registered non-profit founded in 2022. We keep Bengali culture alive in Barcelona through Durga Puja, Rabindra Jayanti, concerts, language, food, and community programmes for Bengalis and friends in Spain.

Primary language: English. Blog posts may include Bengali with English summaries. Contact: info@bcaspain.org · WhatsApp: +34 693 005 986 · Barcelona, Catalunya, Spain.

## Main

${llmsLink('Home', '/', 'Landing page with upcoming events and community highlights')}
${llmsLink('About', '/html/about.html', 'Mission, history, and who we are')}
${llmsLink('FAQ', '/html/faq.html', 'Common questions about membership and events')}
${llmsLink('Contact', '/html/contact.html', 'Get in touch with the association')}
${llmsLink('Gallery', '/html/gallery.html', 'Photos from past celebrations')}

## Events

${llmsLink('Durga Puja 2026', '/html/dp2026.html', 'Main annual festival — October 2026, Barcelona')}
${llmsLink('Event schedule', '/html/schedule.html', 'Puja timings and programme')}
${llmsLink('Registration', '/html/registration.html', 'Sign up for Durga Puja 2026')}
${llmsLink('All events', '/html/attractions.html', 'Cultural events and attractions during the festival')}
${llmsLink('Cultural Concert 2026', '/html/cultural-concert.html', 'Music and performances')}
${llmsLink('Rabindra Jayanti', '/html/rabindra-jayanti.html', 'Annual celebration of Rabindranath Tagore')}

## Blog

${llmsLink('Blog index', '/blog/', 'Stories, guides, and voices from the Bengali community in Barcelona')}
${blogLines.join('\n')}

## News

${llmsLink('Press & Media', '/html/news-media.html', 'News coverage and media about BCA Spain')}
${llmsLink('Write for us', '/html/submit_blog.html', 'Submit a blog post for editorial review')}

## Optional

${llmsLink('Sitemap', '/sitemap.xml', 'Machine-readable list of public URLs')}
${llmsLink('Robots', '/robots.txt', 'Crawler rules')}
${llmsLink('Legal notice', '/html/aviso-legal.html', 'Aviso legal (Spanish)')}
${llmsLink('Privacy policy', '/html/privacidad.html', 'Política de privacidad (Spanish)')}
${llmsLink('Cookie policy', '/html/cookies.html', 'Política de cookies (Spanish)')}
${llmsLink('Facebook', 'https://www.facebook.com/people/Bengali-Cultural-Association-in-Spain/100086456115653/', 'Official Facebook page')}
${llmsLink('Instagram', 'https://www.instagram.com/spain_bca', 'Official Instagram')}
${llmsLink('YouTube', 'https://youtube.com/@bengaliculturalassociation', 'Official YouTube channel')}
`;
}

function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error('No blog/posts directory found.');
    process.exit(1);
  }

  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const authors = JSON.parse(fs.readFileSync(AUTHORS_JSON_PATH, 'utf8'));
  const mdFiles = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md')
    .sort();

  if (mdFiles.length === 0) {
    console.error('No markdown posts in blog/posts/.');
    process.exit(1);
  }

  const postEntries = [];
  const warnings = [];

  for (const file of mdFiles) {
    const slug = slugFromFilename(file);
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { data, content } = matter(raw);

    if (!data.title || !data.date || !data.author || !data.excerpt) {
      console.error(`Missing required frontmatter in ${file} (title, date, author, excerpt).`);
      process.exit(1);
    }

    if (!authors[data.author]) {
      warnings.push(`Author "${data.author}" not in data/blog-authors.json (${file})`);
    }

    const html = buildPage(slug, data, content, template);
    const outPath = path.join(BLOG_DIR, `${slug}.html`);
    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`  wrote blog/${slug}.html`);

    postEntries.push(buildPostListEntry(slug, data));
  }

  const sorted = sortPosts(postEntries);
  fs.writeFileSync(POSTS_JSON_PATH, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');
  console.log(`  wrote data/blog-posts.json (${sorted.length} posts)`);

  fs.writeFileSync(SITEMAP_PATH, buildSitemap(sorted), 'utf8');
  console.log(`  wrote sitemap.xml (${STATIC_SITEMAP_PAGES.length + sorted.length} URLs)`);

  fs.writeFileSync(LLMS_TXT_PATH, buildLlmsTxt(sorted), 'utf8');
  console.log(`  wrote llms.txt`);

  if (warnings.length) {
    console.warn('\nWarnings:');
    warnings.forEach((w) => console.warn(`  - ${w}`));
  }

  console.log('\nBlog build complete.');
}

main();
