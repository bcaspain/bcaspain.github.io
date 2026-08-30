#!/usr/bin/env bash
# Inject deploy-time config before Cloudflare Workers Builds / wrangler deploy.
# Usage (Cloudflare build command): bash scripts/cloudflare-build.sh
#
# Environment variables (all optional except MEDIA_BASE_URL on Cloudflare):
#   MEDIA_BASE_URL          R2 or custom domain for hero MP4s
#   RJ_GAS_URL              Rabindra Jayanti Google Apps Script
#   DP_GAS_URL              Durga Puja registration script
#   BLOG_GAS_URL            Blog submit script
#   DP_RECAPTCHA_SITE_KEY   Registration reCAPTCHA site key
#   BLOG_RECAPTCHA_SITE_KEY Blog reCAPTCHA (falls back to DP key)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MEDIA_BASE_URL="${MEDIA_BASE_URL:-}"
RJ_GAS_URL="${RJ_GAS_URL:-}"
DP_GAS_URL="${DP_GAS_URL:-}"
BLOG_GAS_URL="${BLOG_GAS_URL:-}"
DP_RECAPTCHA_SITE_KEY="${DP_RECAPTCHA_SITE_KEY:-}"
BLOG_RECAPTCHA_SITE_KEY="${BLOG_RECAPTCHA_SITE_KEY:-}"
BLOG_KEY="${BLOG_RECAPTCHA_SITE_KEY:-$DP_RECAPTCHA_SITE_KEY}"

sed_inplace() {
  sed -i "s|$2|$3|g" "$1"
}

sed_inplace js/hero-bg-video.js '__MEDIA_BASE_URL__' "$MEDIA_BASE_URL"
sed_inplace html/rabindra-jayanti-register.html '__RJ_GAS_URL__' "$RJ_GAS_URL"
sed_inplace html/rabindra-jayanti.html '__RJ_GAS_URL__' "$RJ_GAS_URL"
sed_inplace html/registration.html '__DP_GAS_URL__' "$DP_GAS_URL"
sed_inplace html/submit_blog.html '__BLOG_GAS_URL__' "$BLOG_GAS_URL"
sed_inplace html/submit_blog.html '__BLOG_RECAPTCHA_SITE_KEY__' "$BLOG_KEY"
sed_inplace html/registration.html '__DP_RECAPTCHA_SITE_KEY__' "$DP_RECAPTCHA_SITE_KEY"

echo "cloudflare-build.sh: config injection complete"
