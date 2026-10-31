#!/usr/bin/env bash
# Publishes JACK'S PREVIEW link: https://septeamone.github.io/nj-motors-demo/preview/
# The current branch (usually a work branch, not master) is built there; the client link is not touched.
set -e
cd "$(dirname "$0")/.."
source scripts/pages-lib.sh
MSYS_NO_PATHCONV=1 NEXT_PUBLIC_BASE_PATH=/nj-motors-demo/preview NEXT_PUBLIC_SITE_URL=https://septeamone.github.io npm run build
deploy out preview
echo "Preview: https://septeamone.github.io/nj-motors-demo/preview/ (a minute to update)"
