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

  if (warnings.length) {
    console.warn('\nWarnings:');
    warnings.forEach((w) => console.warn(`  - ${w}`));
  }

  console.log('\nBlog build complete.');
}

main();
