#!/usr/bin/env bash
# Shared by publish-pages.sh (the client link) and publish-preview.sh (Jack's preview link).
# Each link is its own repository with its own GitHub Pages site (one site with both copies of the videos got too
# heavy for Pages to publish): the client site is nj-motors-demo, the preview nj-motors-test.

# deploy <built dir> <target inside gh-pages: "." for the root or a folder> <repository name>
deploy() {
  local src="$1" target="$2" name="$3" tmp
  local REPO="https://github.com/septeamone/$name.git"
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
  gh api -X POST "repos/septeamone/$name/pages/builds" >/dev/null
}
