#!/usr/bin/env bash
# Shared by publish-pages.sh (the client link) and publish-preview.sh (Jack's preview link).
# The gh-pages branch holds both: the client site at the root and the preview in /preview.
# Each script replaces only its own part and keeps the other.
REPO=https://github.com/septeamone/nj-motors-demo.git

# deploy <built dir> <target inside gh-pages: "." for the root or "preview">
deploy() {
  local src="$1" target="$2" tmp
  tmp="$(mktemp -d)"
  if ! git clone -q --depth 1 --branch gh-pages --single-branch "$REPO" "$tmp" 2>/dev/null; then
    git -C "$tmp" init -q -b gh-pages
  fi
  if [ "$target" = "." ]; then
    # the root: everything except .git and the preview folder is replaced
    find "$tmp" -mindepth 1 -maxdepth 1 ! -name .git ! -name preview -exec rm -rf {} +
    cp -r "$src"/. "$tmp"
  else
    rm -rf "$tmp/$target"
    mkdir -p "$tmp/$target"
    cp -r "$src"/. "$tmp/$target"
  fi
  touch "$tmp/.nojekyll"
  git -C "$tmp" add -A
  git -C "$tmp" -c user.name="$(git config user.name)" -c user.email="$(git config user.email)" commit -q -m "Built site ($target) for GitHub Pages" || echo "(nothing changed)"
  git -C "$tmp" push -q "$REPO" gh-pages
  rm -rf "$tmp"
  gh api -X POST repos/septeamone/nj-motors-demo/pages/builds >/dev/null
}
