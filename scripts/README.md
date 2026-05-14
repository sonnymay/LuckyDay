# scripts/

Local automation scripts for the LuckyDay repo.

## daily-log.sh

Appends a dated entry to `docs/daily-log.md`, commits, and pushes to the
currently checked-out branch. Keeps the GitHub contribution graph green on
days when no other routine produced commits, and surfaces a single line of
provenance per day (which commits happened, which audit/screenshot folders
were touched).

### Schedule (macOS launchd)

The job lives at `~/Library/LaunchAgents/com.luckyday.daily-log.plist` (not
tracked in this repo — it's a user-scope LaunchAgent). It fires daily at
**21:00 local time**.

To inspect:

```sh
launchctl list | grep luckyday
cat ~/Library/LaunchAgents/com.luckyday.daily-log.plist
```

Logs land at `scripts/.daily-log.stdout.log` and `scripts/.daily-log.stderr.log`
(both gitignored — see below).

### Run manually

```sh
bash scripts/daily-log.sh
```

Idempotent: if today's heading already exists in `docs/daily-log.md`, the
script exits silently without committing.

### Disable

```sh
launchctl unload ~/Library/LaunchAgents/com.luckyday.daily-log.plist
rm ~/Library/LaunchAgents/com.luckyday.daily-log.plist
```

### Re-enable on a fresh machine

```sh
# Copy the plist template back into place — see commit history of this
# README for the previous content if needed.
launchctl load ~/Library/LaunchAgents/com.luckyday.daily-log.plist
```

### Why a separate script and not a Codex routine

Codex routines run inside Codex's sandbox/approval system and require Codex
to be open. This launchd job runs at the OS level and persists across
reboots regardless of whether Codex (or anything else) is running. It is a
belt-and-suspenders complement to the existing Codex routines, not a
replacement.

## Notes on the contribution-graph problem

If commits still appear gray on GitHub after this script lands, the cause is
**branch**, not frequency: GitHub only counts contributions on the default
branch. Either:

1. Change the GitHub default branch to `codex-luckyday-product-polish`
   (Settings → Branches → switch default), or
2. Regularly merge `codex-luckyday-product-polish` into `main`.

This script writes to whatever branch is currently checked out, so it works
under either strategy.
