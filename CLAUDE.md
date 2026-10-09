# CLAUDE.md

Project instructions (architecture, testing, Angular rules) live in `.claude/CLAUDE.md`.
This file holds only the deploy configuration that `/land-and-deploy` reads from the repo root.

## Deploy Configuration (configured by /setup-deploy)

- Platform: Cloud Run + Firebase Hosting (custom script, `scripts/deploy.mjs`)
- Production URL: https://analogjonestof.com
- Deploy workflow: none (GitHub Actions only builds and tests)
- Deploy status command: `gcloud run services describe public-app --project analog-jones-v2 --region us-central1 --format='value(status.latestReadyRevisionName,status.conditions[0].status)'`
- Merge method: squash
- Project type: web app
- Post-deploy health check: https://analogjonestof.com/

### Custom deploy hooks

- Pre-merge: none
- Deploy trigger: manual. `/land-and-deploy` only merges and verifies; it never runs a deploy command. After the merge, run `pnpm release --yes` from a checkout with active `gcloud` and `firebase` logins, then let the status command and health check confirm the new revision.
- Deploy status: `gcloud run services describe public-app --project analog-jones-v2 --region us-central1 --format='value(status.latestReadyRevisionName,status.conditions[0].status)'`
- Health check: https://analogjonestof.com/
