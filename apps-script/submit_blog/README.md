# Blog submission Apps Script (clasp)

Same layout as registration: Config / Main / Upload / Email / Helpers.

## Sheet columns

| Time | Order no | email | Name | Whatsapp No | Content type | content link | content |
|------|----------|-------|------|-------------|--------------|--------------|---------|
| auto | `BLOG-…` | req | req | req | any string | req (Google link) | `(link only)` |

- Spreadsheet: `16Th2BgQ9ooLT4flarJ1QsAyfQ31V23w7lUX4BjL9OA4` (tab `Sheet1`)
- Drive folder: `1tn2g5Xp2bAPEGl3h3n5uR7aH4r_Tl6WM`
- Ack email sent to submitter

## POST payload

| Field | Required | Notes |
|-------|----------|--------|
| `name` | yes | |
| `email` | yes | |
| `whatsapp` | yes | |
| `content_type` | no* | Any string accepted |
| `content_link` | yes | Google Drive or Google Docs share URL |
| `file_base64` | no | Always empty (file upload disabled) |
| `file_name` | no | Always empty |
| `file_mime` | no | Always empty |

\* May be empty string; not validated against a fixed list.

## Frontend

- Page: `html/submit_blog.html`
- Script: `js/submit-blog-form.js`
- Local: `js/local-env.js` → `BLOG_GAS_URL` + `BLOG_RECAPTCHA_SITE_KEY`
- Prod secrets: `BLOG_GAS_URL`, `BLOG_RECAPTCHA_SITE_KEY` (falls back to `DP_RECAPTCHA_SITE_KEY`)

## reCAPTCHA (v3 — enabled)

1. Create keys: https://www.google.com/recaptcha/admin (v3, domain `bcaspain.org` + `localhost` for local)
2. Site key → `local-env.js` / GitHub secret
3. Secret key → Apps Script **Project Settings → Script properties**:
   - Name: `RECAPTCHA_SECRET`
   - Value: your secret key
4. `clasp push --force` then redeploy so `RECAPTCHA_ENABLED = true` is live

Server rejects tokens with score &lt; 0.5 or action ≠ `blog_submit`.

## Setup

```bash
cd apps-script/submit_blog
clasp push --force
```

### Deploy (keep the same web app URL)

`clasp deploy` **without** `-i` creates a **new** deployment ID and URL.

To update an **existing** deployment (same `/exec` URL already in `BLOG_GAS_URL`):

```bash
# 1. List deployments and copy the Deployment ID (not the script ID)
clasp deployments

# 2. Push code, then redeploy to that same ID
clasp push --force
clasp deploy -i YOUR_DEPLOYMENT_ID -d "blog submit link-only"
```

The **Deployment ID** stays the same; only the version behind it changes. You do **not** need to update `BLOG_GAS_URL` in GitHub secrets.

First-time deploy only:

```bash
clasp deploy -d "blog submit"
```
