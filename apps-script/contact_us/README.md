# Contact form Apps Script (clasp)

Local copy of the BCA contact form Google Apps Script.  
Code lives in `apps-script/contact_us/` (gitignored except this README).

## Sheet columns

| Timestamp | Name | Email | Subject | Message | Status |
|-----------|------|-------|---------|---------|--------|

- Spreadsheet ID: `1RgW81v48PRdMBI43rQD8rWsnXCV-NbkSV4PmsxEOMPU`
- Admin notification: `india.bca.spain@gmail.com`

Run `setupSheet()` once in the Apps Script editor to create headers.

## POST payload (JSON)

| Field | Required |
|-------|----------|
| `timestamp` | no (defaults to now) |
| `name` | yes |
| `email` | yes |
| `subject` | yes |
| `message` | yes |

## Frontend

- Page: `html/contact.html`
- Handler: `js/script.js` → `handleContactForm`
- Local: `js/local-env.js` → `CONTACT_GAS_URL`
- Prod secret: `CONTACT_GAS_URL`

## Deploy

```bash
cd apps-script/contact_us
clasp push
clasp deploy -d "contact form"
```

To update an **existing** deployment (keep the same `/exec` URL):

```bash
clasp deployments          # copy Deployment ID
clasp push
clasp deploy -i YOUR_DEPLOYMENT_ID -d "contact form update"
```

Web app settings (`appsscript.json`):

- Execute as: **Me** (`USER_DEPLOYING`)
- Who has access: **Anyone** (`ANYONE_ANONYMOUS`)

After deploy, set GitHub secret `CONTACT_GAS_URL` to the `/exec` URL.
