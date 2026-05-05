---
allowed-tools: Bash
argument-hint: [--latest]
description: Update pnpm packages interactively. Pass --latest to upgrade beyond semver ranges (e.g. for Angular version upgrades).
---

Run the following pnpm package update workflow:

1. First, show what's outdated: `pnpm outdated`

2. Then run an interactive update using the appropriate flag:
   - If $ARGUMENTS contains "--latest": run `pnpm update --interactive --latest`
   - Otherwise (default): run `pnpm update --interactive`

3. After the user completes the interactive selection, remind them to:
   - Review the diff in `package.json` and `pnpm-lock.yaml`
   - Check changelogs for any major version bumps
   - Run `pnpm build:admin`
   - Run `pnpm build:public`
   - Run `pnpm test` to test for regressions
   - Run `pnpm dedupe` to clean up duplicate packages in the lockfile
   - Commit both `package.json` and `pnpm-lock.yaml`
