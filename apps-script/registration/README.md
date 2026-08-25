# Registration Apps Script (clasp)

Local copy of the Durga Puja registration Google Apps Script.
Folder is gitignored (`apps-script/`) — keep secrets and `.clasp.json` offline.

## Setup (once)

```bash
npm install -g @google/clasp
```

1. Enable **Apps Script API**: https://script.google.com/home/usersettings  
2. Login:

```bash
cd /home/sgosh/myproject/bcaspain.github.io/apps-script/registration
clasp login
```

3. Project is already linked via `.clasp.json` (`scriptId`).  
   To clone fresh elsewhere:

```bash
mkdir -p apps-script/registration && cd apps-script/registration
clasp clone <SCRIPT_ID>
# then set "rootDir": "." in .clasp.json if clasp complains about scandir
```

## Day-to-day commands

Run from this directory:

```bash
cd /home/sgosh/myproject/bcaspain.github.io/apps-script/registration
```

| Action | Command |
|--------|---------|
| See auth / project | `clasp login --status` · `clasp open` |
| Pull from Google | `clasp pull` |
| Push local → Google | `clasp push` or `clasp push --force` (also deletes remote files removed locally) |
| List versions | `clasp versions` |
| List deployments | `clasp deployments` |
| New versioned deploy | `clasp deploy -d "description"` |
| Update **existing** web app (same `/exec` URL) | `clasp deploy -i <DEPLOYMENT_ID> -d "update"` |
| Open in browser | `clasp open` |
| View logs | `clasp logs` |

### Recommended update flow

```bash
clasp push --force
clasp deployments          # copy the web-app deployment id (not @HEAD)
clasp deploy -i <DEPLOYMENT_ID> -d "registration update"
```

Prefer **`deploy -i …`** over a brand-new `clasp deploy` so the public `/exec` URL stays stable.

### Notes

- **`@HEAD`** updates on every `clasp push`, but is not a reliable public web-app URL.
- Web app access is in `appsscript.json` (`ANYONE_ANONYMOUS`, execute as deployer).
- Site URL: set `js/local-env.js` → `window.DP_GAS_URL` (local) and GitHub secret `DP_GAS_URL` (prod).
- reCAPTCHA: `RECAPTCHA_ENABLED` in `Config.js` (keep `false` unless wired end-to-end).

## Files

| File | Role |
|------|------|
| `Config.js` | Spreadsheet / Drive IDs, prices, flags |
| `Main.js` | `doPost`, `processRegistration`, tests |
| `Upload.js` | Payment proof → Drive |
| `Email.js` | Confirmation email HTML |
| `Helpers.js` | Shared helpers |
| `Recaptcha.js` | Verification (gated by flag) |
| `appsscript.json` | Manifest / webapp access |
| `.clasp.json` | Script ID + clasp settings |
