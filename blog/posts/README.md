# Blog moderator guide — Markdown source

**Audience:** BCA editors who turn approved Google Doc / magazine submissions into published blog posts.

Contributors submit via the website form (Google Docs link). **They do not write these files.** You copy their text here, run the build, and push.

**Do not edit `blog/*.html` by hand** — those files are generated.

---

## Publishing workflow

1. Read the approved submission (Google Doc + images in Drive).
2. Pick a **slug** → create `blog/posts/your-slug.md` (filename = slug).
3. Export images to WebP → `blog/images/` (hero + any inline photos).
4. Fill **YAML frontmatter** (top of file) from the doc metadata.
5. Paste the **article body** below the `---` line as Markdown.
6. If the author is new → add them to `data/blog-authors.json`.
7. Preview: `npm run build:blog` then open the site with a local server.
8. Commit `.md`, images, `blog-authors.json` if needed, generated HTML/JSON → push to `main`.

---

## Slug (filename)

The file name becomes the URL: `blog/posts/my-slug.md` → `bcaspain.org/blog/my-slug.html`

| Good | Bad |
|------|-----|
| `my-india-experience.md` | `My India Experience.md` (spaces, caps) |
| `pompeii-arnab-sarkar.md` | `post1.md`, `final-v2.md` |
| `is-asana-practice-all-about-flexibility.md` | `pompeii.md` (too vague if you add more Pompeii posts) |

**Rules:** lowercase, hyphens only, no spaces, short but descriptive, matches topic.

---

## Required frontmatter — field-by-field

### `title`

Large heading on the article page (not the browser tab suffix).

| Good | Bad |
|------|-----|
| `My India Experience` | `Blog post by Manuel` |
| `Pompeii — a Bengali travel diary` | `অভিশপ্ত পম্পেই` alone as title when the public title is English |
| `Is Asana Practice all about Flexibility?` | `DRAFT - yoga article` |

Use the **public title** from the doc. For recipes, the page title can be short (`Mutton Gora Kalia`) while the card uses `cardTitle` (below).

---

### `date`

Publication date on the site. **Always quote it** so YAML parses correctly.

| Good | Bad |
|------|-----|
| `"2026-09-01"` | `1 September 2026` |
| `"2026-03-15"` | `2026-09-01` without quotes (can break in some editors) |

Use the **go-live date**, not the day the author first wrote the piece.

---

### `author`

Must match **exactly** the name in `data/blog-authors.json` (for hover card + byline).

| Good | Bad |
|------|-----|
| `Chandana Bhowmick` | `chandana` |
| `Tamojit Kumar Manna (Rishi)` | `Tamojit Kumar Manna` if JSON uses `(Rishi)` |
| `Manuel G. Marciani` | `BCA Spain` or `Editorial team` |

If the display name is new, add an entry in `data/blog-authors.json` before publishing.

---

### `excerpt`

1–2 sentences for **blog cards**, Google/social description (meta), and JSON-LD. Not the full intro paragraph.

| Good | Bad |
|------|-----|
| `Manuel G. Marciani on a three-week journey through India — hospitality, six languages, and faiths that coexist side by side.` | The entire first paragraph of the article |
| `Surashree's Bengali mutton Gora Kalia from Sharodiya 2025 — a rich, slow-cooked curry perfect for festive tables.` | `A blog post about food.` |
| `Arnab Sarkar on Pompeii and Vesuvius — a Bengali essay from Sharodiya 2025, with an English summary.` | `Click to read more!!!` |

**Tip:** Often you can tighten the author’s “summary” from their Google Doc.

---

### `tags`

Used for filtering on `/blog/`. Pick from existing tags when possible.

| Good | Bad |
|------|-----|
| `[Travel]` | `[travel, india, fun]` (stick to site tags) |
| `[Culture]` | `[Sharodiya 2025]` as a tag — use `series` for that |
| `[Food]` | `Travel` without brackets (invalid YAML) |
| `[Essay]` | Empty or missing |

**Current tags on the site:** `Travel`, `Food`, `Culture`, `Essay`. Use one or more in a YAML list: `tags: [Culture, Travel]`.

---

## Optional frontmatter — when and how

### `featured: true`

Shows the post near the **top** of the blog grid (with other featured posts).

| Use | Don’t use |
|-----|-----------|
| Important new community stories you want highlighted | Every Sharodiya reprint by default |
| 1–2 flagship posts at a time | All six posts featured |

---

### `series: Sharodiya 2025`

Adds **“Sharodiya 2025”** next to “Blog” in the eyebrow. Also drives default magazine footer note (unless overridden).

| Good | Bad |
|------|-----|
| `Sharodiya 2025` | `Sharodiya` or `Magazine 2025` (won’t match design/filter habits) |
| Omit for non-magazine originals | `series` for a one-off yoga post |

---

### `image` / `imageAlt` / `imageWidth` / `imageHeight`

Hero photo at the top of the article.

| Good | Bad |
|------|-----|
| `image: /blog/images/my-india-experience.webp` | `image: my-india-experience.webp` (missing `/blog/images/`) |
| `imageAlt: Araku Valley — a mother and her child selling vegetables at a market stall` | `imageAlt: photo` or empty |
| `imageWidth: 298` and `imageHeight: 205` (real dimensions) | Random numbers or omit if you have real sizes |

**Omit `image` entirely** when there is no hero (see `imagePlaceholder` below).

---

### `imageCaption`

Optional text under the hero image.

| Good | Bad |
|------|-----|
| `"Araku Valley: a mother and her child while selling vegetables."` | Unquoted text with colons — YAML breaks (`Araku Valley: ...` must be quoted) |
| Omit if no caption | Duplicate of `imageAlt` when alt is already descriptive |

---

### `imagePlaceholder: Food`

For posts **without a hero image** — index card shows a labelled tile (e.g. “Food”) instead of a photo.

| Good | Bad |
|------|-----|
| `imagePlaceholder: Food` for a recipe with no photo | `imagePlaceholder` together with `image:` (pick one) |
| Short label: `Food`, `Essay` | Long sentence as placeholder |

Still set `imageAlt` (used as fallback label context). Set `ogImage` for social preview (below).

---

### `ogImage`

Image used when the link is shared (Facebook, WhatsApp, etc.). Defaults to `image` if omitted.

| Good | Bad |
|------|-----|
| `ogImage: /gallery/2025/IMG_38.webp` when there is no hero but you want a community photo on shares | Forgetting `ogImage` on `imagePlaceholder` posts (shares may look broken) |
| Same as hero `image` — then omit `ogImage` | External URLs unless you trust they stay online |

Path must start with `/` (site root).

---

### `ogDescription`

Social share text. Defaults to `excerpt` if omitted.

| Use when | Skip when |
|----------|-----------|
| You want a **shorter** share line than the card excerpt | `excerpt` is already perfect for sharing |
| Meta description on page should stay long but Twitter line shorter | |

Example: excerpt mentions “BCA member”; `ogDescription` can drop that for space.

---

### `authorUrl`

Author’s website — appears in structured data and hover card link (if in `blog-authors.json` too).

| Good | Bad |
|------|-----|
| `authorUrl: https://www.chandanabhowmick.com/` | `authorUrl: chandanabhowmick.com` (no `https://`) |
| Omit if author has no site | Random BCA or Facebook link as “author URL” |

Also add `url` / `urlLabel` in `blog-authors.json` for the hover popover.

---

### `bodyLang: bn`

Main article body is Bengali — enables Bengali font and typography class.

| Good | Bad |
|------|-----|
| `bodyLang: bn` for Bengali essay body | `bodyLang: bn` for English-only posts |
| Omit for English or Benglish in Latin script | `bodyLang: en` (not used — English is default) |

---

### `summary` / `summaryTitle`

English (or other) **intro block** above the main body — typical for Bengali articles.

| Good | Bad |
|------|-----|
| `summaryTitle: In English` | Putting the whole Bengali essay in `summary` |
| Multi-line with `\|` and blank lines between paragraphs | One giant line with no paragraph breaks |
| Links: `[Sharodiya 2025](../brochures/BCA_Sharodiya_2025.pdf)` | `file:///...` or broken relative paths |

Example:

```yaml
summaryTitle: In English
summary: |
  What if an entire city went to sleep one night and never woke up? Arnab Sarkar travels to **Pompeii**.

  With a local guide, he walks Roman streets still marked by chariot wheels. This essay first appeared in [Sharodiya 2025](../brochures/BCA_Sharodiya_2025.pdf).
```

---

### `metaExtraBn`

Optional Bengali subtitle under the author byline (page stays `lang="en"`).

| Good | Bad |
|------|-----|
| `metaExtraBn: অভিশপ্ত পম্পেই` | Full Bengali title duplicated when it’s already the `title` |
| Omit when not needed | English text in `metaExtraBn` |

---

### `inLanguage: bn`

Hints for search engines that the **main creative work** is Bengali. Use with Bengali body + often `summary` in English.

| Good | Bad |
|------|-----|
| `inLanguage: bn` on Pompeii-style posts | On pure English posts |

---

### `lede: false`

By default, the **first paragraph** of the body is styled larger (intro/lede).

| Set `lede: false` when | Leave default (lede on) when |
|------------------------|------------------------------|
| First line is `## রেসিপি` or a heading, not prose | First paragraph is a real hook / intro |
| Bengali body starts mid-essay without a separate intro | English essay with clear opening paragraph |

---

### `magazineNote` / `magazineNoteLang`

Footer line: “First published in Sharodiya 2025…”

| Value | Result |
|-------|--------|
| Omit + `series: Sharodiya 2025` | Auto note — Bengali if `bodyLang: bn`, else English |
| `magazineNoteLang: bn` | Bengali note |
| `magazineNoteLang: en` | English note |
| `magazineNote: false` | No note (e.g. original web-only piece) |
| Custom string (rare) | `magazineNote: "First published in …"` |

---

### `cardTitle`

Title on **blog index cards** only, if different from page `title`.

| Good | Bad |
|------|-----|
| `title: Mutton Gora Kalia` + `cardTitle: Mutton Gora Kalia — recipe` | Different titles without reason |
| Omit when same as `title` | `cardTitle` much longer than `title` every time |

---

### `titleBrand`

Suffix in browser tab and Open Graph title.

| Good | Bad |
|------|-----|
| Default: omit → `— BCA Spain Blog` | Changing every post for no reason |
| `titleBrand: "| BCA Spain Blog"` if you prefer pipe style | Empty string |

---

## Body content (below `---`)

### Paragraphs and headings

```markdown
First paragraph becomes the lede (larger intro) unless `lede: false`.

Regular paragraph. Use blank lines between paragraphs.

## Section heading

Another paragraph with *emphasis* and **strong**.

## The mind

Short section like the yoga post.
```

| Good | Bad |
|------|-----|
| `## The body` for section titles | `# Title` — duplicates page `title` |
| `*italic*` and `**bold**` | HTML `<b>` everywhere when Markdown suffices |
| Blank line between paragraphs | One giant block with no breaks |

---

### Links

```markdown
Read more about [donkey intelligence](https://www.thedonkeysanctuary.org.uk/...).
```

External links get `target="_blank"` automatically at build time. Use full `https://` URLs.

---

### Inline images

**Simple** — caption becomes figcaption; alt for accessibility is the same text:

```markdown
![Three young boys fishing in a pond in Mogra, West Bengal](images/my-india-experience-mogra.webp)
```

**Custom alt + caption** — use HTML (copy from existing posts):

```html
<figure class="blog-article-figure">
  <img src="images/pompeii-arnab-mosaic.webp" alt="পম্পেইয়ের লাল মাসাইক ও মোজাইকের সামনে একজন পর্যটক" width="385" height="514" loading="lazy" decoding="async">
  <figcaption>হাঁটু গুঁড়ে বসে থাকা মানুষ — লাল মাসাইকের সামনে।</figcaption>
</figure>
```

| Good | Bad |
|------|-----|
| `images/foo.webp` relative to `blog/` | `/blog/images/foo.webp` in body (use `images/` in markdown) |
| WebP, reasonable file size | Huge uncompressed JPEG |
| Descriptive alt text | `![image](images/1.webp)` |

---

### Inline Bengali in English text

```markdown
I was called a “<span lang="bn">গাধা</span>” (donkey) by relatives.
```

Use when a single Bengali word appears in an English paragraph.

---

## New author — `data/blog-authors.json`

Add before publish if hover card should work:

```json
"Full Name Exactly As in author:": {
  "role": "One line — role or affiliation",
  "bio": "2–3 sentences for the hover card.",
  "url": "https://example.com/",
  "urlLabel": "example.com"
}
```

| Good | Bad |
|------|-----|
| `role` short; `bio` 1–3 sentences | Entire article in `bio` |
| `url` / `urlLabel` only if author has a site | Fake or BCA homepage as personal URL |
| Name matches `author:` in every post | Different spellings per post |

---

## Post type cheat sheet

Copy the shape from an existing file in `blog/posts/`:

| Type | Example file | Key fields |
|------|----------------|------------|
| English article + hero | `is-asana-practice-all-about-flexibility.md` | `image`, `featured`, `magazineNote: false` |
| Travel + extra photo | `my-india-experience.md` | `imageCaption`, inline `![...](images/...)` |
| Sharodiya English essay | `the-tragic-hard-worker.md` | `series`, `magazineNoteLang: en` |
| Benglish / mixed | `notun-generation-durga-pujo.md` | `series`, lede on first paragraph |
| Bengali + English summary | `pompeii-arnab-sarkar.md` | `summary`, `bodyLang: bn`, `metaExtraBn`, `lede: false` |
| Recipe, no hero | `mutton-gora-kalia.md` | `imagePlaceholder`, `ogImage`, `cardTitle`, `summary`, `lede: false` |

---

## Moderator checklist before push

- [ ] Slug is lowercase with hyphens
- [ ] `date` is quoted `YYYY-MM-DD`
- [ ] `author` matches `blog-authors.json`
- [ ] `excerpt` is short (not the full intro)
- [ ] `tags` use allowed values
- [ ] Images exist in `blog/images/` and paths are correct
- [ ] `ogImage` set if there is no hero image
- [ ] Ran `npm run build:blog` without errors
- [ ] Opened article HTML locally — title, byline, hero, summary, Bengali font (if applicable)
- [ ] Checked `/blog/` index shows correct card

---

## What gets generated (don’t edit by hand)

| Output | Purpose |
|--------|---------|
| `blog/{slug}.html` | Live article page |
| `data/blog-posts.json` | Blog index + homepage teaser |

---

## Local preview

```bash
npm run build:blog
npx --yes serve -l 8080
```

Open `http://localhost:8080/blog/` — do not open `.html` files directly from Finder (JSON fetch will fail).

---

## Questions?

Compare with a similar existing post in `blog/posts/`. If a submission doesn’t fit the patterns above, discuss before inventing new frontmatter fields.
