# Blog submission Apps Script (clasp)

Same layout as registration: Config / Main / Upload / Email / Helpers.

## Sheet columns

| Time | Order no | email | Name | Whatsapp No | Content type | content link | content |
|------|----------|-------|------|-------------|--------------|--------------|---------|
| auto | `BLOG-…` | req | req | req | any string | optional | Drive URL of uploaded file |

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
| `content_link` | no | Optional URL |
| `file_base64` | yes | DOC / DOCX / JPG / PNG |
| `file_name` | yes | With file |
| `file_mime` | recommended | |

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
cd /home/sgosh/myproject/bcaspain.github.io/apps-script/submit_blog
clasp push --force
clasp deploy -d "blog submit"
```
