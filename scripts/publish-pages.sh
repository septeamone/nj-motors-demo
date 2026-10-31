#!/usr/bin/env bash
# Publishes the CLIENT link: https://septeamone.github.io/nj-motors-demo/ (the root of gh-pages; the /preview folder is kept)
# Run it from the master branch: that is what the client sees.
# (Actions do not start on this account, so the site is built here and pushed to the gh-pages branch.)
set -e
cd "$(dirname "$0")/.."
source scripts/pages-lib.sh
MSYS_NO_PATHCONV=1 NEXT_PUBLIC_BASE_PATH=/nj-motors-demo NEXT_PUBLIC_SITE_URL=https://septeamone.github.io npm run build
deploy out .
echo "Published: https://septeamone.github.io/nj-motors-demo/ (a minute to update)"
