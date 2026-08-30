# Hero video on Cloudflare R2

Large MP4s exceed Cloudflare Workers' 25 MiB per-file limit. Host them on R2 and set `MEDIA_BASE_URL` at deploy time.

## 1. Create R2 bucket

1. Cloudflare dashboard → **R2** → **Create bucket** (e.g. `bcaspain-media`)
2. Upload these files (same names as in repo):
   - `hero-bg-mobile.mp4`
   - `hero-bg-tablet.mp4`
   - `hero-bg-desktop.mp4`

## 2. Public URL

**Option A — Custom domain (recommended)**

1. R2 bucket → **Settings** → **Public access** → connect domain e.g. `media.bcaspain.org`
2. Add the DNS record Cloudflare suggests

**Option B — R2.dev subdomain (quick test)**

Enable **R2.dev subdomain** on the bucket. Base URL looks like:
`https://pub-xxxx.r2.dev`

Object URLs: `{base}/hero-bg-desktop.mp4`

## 3. Set deploy variable

Add **`MEDIA_BASE_URL`** (no trailing slash), e.g.:

```
https://media.bcaspain.org
```

**Cloudflare Workers Builds** → Settings → Variables → Production (and Preview if needed).

**GitHub Actions** (optional): repo → Settings → Secrets → `MEDIA_BASE_URL`

If unset, the site falls back to local `video/` (works on GitHub Pages; Cloudflare deploy excludes MP4s via `.assetsignore`).

## 4. Cloudflare build command

Set the build command to:

```bash
bash scripts/cloudflare-build.sh
```

This injects `MEDIA_BASE_URL` and form secrets from Cloudflare environment variables.

## 5. Verify

After deploy, open the homepage → DevTools → Network → filter `mp4`. URLs should hit your R2 domain, not the site origin.

Poster image (`video/welcome-image.webp`) stays on the main site (under 25 MiB).
