#!/bin/bash
# LuckyDay weekly main-sync routine.
#
# Fast-forwards `main` to the tip of the active feature branch so the
# GitHub contribution graph counts every commit. Strictly fast-forward —
# bails out (without modifying anything) on:
#   - uncommitted local changes
#   - divergence between origin/main and the feature branch
#   - any git error
#
# Schedules via launchd (~/Library/LaunchAgents/com.luckyday.sync-main.plist).
# Run manually for a smoke test:
#   bash scripts/sync-main.sh
set -euo pipefail

REPO_DIR="/Users/santipapmay/Downloads/LuckyDay"
FEATURE_BRANCH="codex-luckyday-product-polish"
MAIN_BRANCH="main"
RUN_LOG="$REPO_DIR/scripts/.sync-main.last-run.log"

cd "$REPO_DIR"

log() {
  echo "[sync-main] $*" | tee -a "$RUN_LOG"
}

# Truncate log for this run.
: > "$RUN_LOG"

ORIGINAL_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

# 1. Refuse to run with uncommitted changes — never silently stash user work.
if ! git diff --quiet || ! git diff --cached --quiet; then
  log "Uncommitted changes present on $ORIGINAL_BRANCH — bailing."
  exit 1
fi

# 2. Fetch latest from origin.
log "Fetching origin…"
git fetch origin --quiet

# 3. Make sure local feature branch matches origin (catch up if needed).
log "Syncing local $FEATURE_BRANCH with origin…"
git checkout "$FEATURE_BRANCH" --quiet
if ! git pull --ff-only origin "$FEATURE_BRANCH" --quiet 2>/dev/null; then
  # Branch may not have upstream set; fall back to hard reset to origin tip.
  git reset --hard "origin/$FEATURE_BRANCH"
fi

# 4. Switch to main, catch up to origin/main.
log "Switching to $MAIN_BRANCH and syncing with origin…"
git checkout "$MAIN_BRANCH" --quiet
if ! git pull --ff-only origin "$MAIN_BRANCH" --quiet 2>/dev/null; then
  git fetch origin "$MAIN_BRANCH" --quiet
  git reset --hard "origin/$MAIN_BRANCH"
fi

# 5. Verify main is a strict ancestor of feature — required for fast-forward.
if ! git merge-base --is-ancestor "$MAIN_BRANCH" "$FEATURE_BRANCH"; then
  log "$MAIN_BRANCH has diverged from $FEATURE_BRANCH — fast-forward impossible. Manual merge required."
  git checkout "$ORIGINAL_BRANCH" --quiet
  exit 1
fi

# 6. If main is already at feature tip, nothing to do.
if [ "$(git rev-parse "$MAIN_BRANCH")" = "$(git rev-parse "$FEATURE_BRANCH")" ]; then
  log "$MAIN_BRANCH already at $FEATURE_BRANCH tip — no-op."
  git checkout "$ORIGINAL_BRANCH" --quiet
  exit 0
fi

# 7. Fast-forward main → feature, push.
log "Fast-forwarding $MAIN_BRANCH → $FEATURE_BRANCH…"
git merge --ff-only "$FEATURE_BRANCH"
git push origin "$MAIN_BRANCH"

# 8. Restore the branch we started on.
git checkout "$ORIGINAL_BRANCH" --quiet

log "Synced $MAIN_BRANCH to $FEATURE_BRANCH and pushed."
