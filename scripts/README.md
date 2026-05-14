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

## sync-main.sh

Weekly companion to `daily-log.sh`. Fast-forwards `main` to the tip of the
active feature branch and pushes, so every commit on `codex-luckyday-product-polish`
is reflected on the default branch — which is what GitHub's contribution
graph actually counts.

Strictly fast-forward. Bails (without modifying anything) on:
- uncommitted local changes
- any divergence between `origin/main` and the feature branch
- any git error

### Schedule

`~/Library/LaunchAgents/com.luckyday.sync-main.plist` fires weekly on
**Sunday at 22:00 local time** (one hour after the Sunday `daily-log.sh`
run, so the week's last entry is included in the sync).

### Run manually

```sh
bash scripts/sync-main.sh
```

Idempotent: if `main` is already at the feature branch tip, exits no-op.

### Disable

```sh
launchctl unload ~/Library/LaunchAgents/com.luckyday.sync-main.plist
rm ~/Library/LaunchAgents/com.luckyday.sync-main.plist
```

## Notes on the contribution-graph problem

GitHub only counts contributions on the **default branch**. As long as
`sync-main.sh` runs successfully each week, every commit on
`codex-luckyday-product-polish` shows up on `main` → counts toward green
squares. No need to change the GitHub default-branch setting.

If you instead prefer to change the default branch directly, you can — the
two scripts work under either strategy.
