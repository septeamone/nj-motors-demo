#!/usr/bin/env bash
# Publishes the current master to https://septeamone.github.io/nj-motors-demo/
# (Actions do not start on this account, so the site is built here and pushed to the gh-pages branch.)
set -e
cd "$(dirname "$0")/.."
MSYS_NO_PATHCONV=1 NEXT_PUBLIC_BASE_PATH=/nj-motors-demo NEXT_PUBLIC_SITE_URL=https://septeamone.github.io npm run build
tmp="$(mktemp -d)"
cp -r out/. "$tmp"
touch "$tmp/.nojekyll"
git -C "$tmp" init -q -b gh-pages
git -C "$tmp" add -A
git -C "$tmp" -c user.name="$(git config user.name)" -c user.email="$(git config user.email)" commit -q -m "Built site for GitHub Pages"
git -C "$tmp" push -q -f https://github.com/septeamone/nj-motors-demo.git gh-pages
rm -rf "$tmp"
gh api -X POST repos/septeamone/nj-motors-demo/pages/builds >/dev/null
echo "Published: https://septeamone.github.io/nj-motors-demo/ (a minute to update)"
