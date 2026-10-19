#!/usr/bin/env bash
# Prints every page URL in the given sitemaps, one per line. Follows sitemap
# index files (like the blog's sitemap-index.xml) one level down.
set -euo pipefail

locs() { curl -fsS --max-time 30 --retry 3 "$1" | grep -o '<loc>[^<]*</loc>' | sed -e 's/<loc>//' -e 's/<\/loc>//'; }

for sitemap in "$@"; do
  for url in $(locs "$sitemap"); do
    case "$url" in
      *.xml) locs "$url" ;;
      *) echo "$url" ;;
    esac
  done
done | sort -u
