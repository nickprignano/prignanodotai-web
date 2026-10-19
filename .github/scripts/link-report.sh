#!/usr/bin/env bash
# Posts the link check results to one rolling issue. Broken links update the
# issue (reopening it, which notifies, if it was closed); a clean run closes it.
# Usage: link-report.sh <lychee exit code> <report.md>
set -euo pipefail

code="$1"
report="$2"
title="Link check report"
run="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
today=$(date -u +%F)

issue=$(gh issue list --state all --label links --search "\"$title\" in:title" --json number,state --jq '.[0] // empty')
[ -n "$issue" ] || issue='{}'
number=$(jq -r '.number // empty' <<< "$issue")
state=$(jq -r '.state // empty' <<< "$issue")

if [ "$code" = "0" ]; then
  if [ "$state" = "OPEN" ]; then gh issue close "$number" --comment "All clear on $today ([run]($run))."; fi
  echo "No broken links."
  exit 0
fi
if [ "$code" != "2" ]; then
  echo "::error::lychee failed to run (exit code $code); see the log"
  exit 1
fi

body=$(mktemp)
{
  echo "Last checked $today ([run]($run)). Links that fail here were retried 3 times."
  echo
  echo "- **404, 410 or a domain that doesn't resolve** usually means the link is gone. For event links, add an \`archived\` copy from the [Wayback Machine](https://web.archive.org/) rather than deleting the link."
  echo "- **429, 5xx or a timeout** is often temporary. Fix it only if it fails again next week."
  echo "- **401 from youtube.com/oembed** means the video is private or can't be embedded; check it by hand."
  echo
  # Issue bodies are capped at 65,536 characters.
  head -c 60000 "$report"
} > "$body"

if [ -z "$number" ]; then
  gh label create links --color c5def5 --description "Link check reports" 2>/dev/null || true
  gh issue create --title "$title" --label links --body-file "$body"
else
  gh issue edit "$number" --body-file "$body"
  if [ "$state" = "CLOSED" ]; then gh issue reopen "$number" --comment "Broken links found on $today ([run]($run))."; fi
fi
