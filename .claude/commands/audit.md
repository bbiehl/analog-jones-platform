---
allowed-tools: Bash
description: Audit pnpm packages for security vulnerabilities and summarize findings with recommended actions.
---

Run the following pnpm security audit workflow:

1. Run the audit: `pnpm audit`

2. Analyze the output and provide a structured summary:
   - Total vulnerabilities found, broken down by severity (critical, high, moderate, low)
   - For each vulnerability: the package name, severity, description, and whether a fix is available
   - Which vulnerabilities have a direct fix via `pnpm audit --fix`

3. Recommend next steps:
   - If auto-fixable issues exist, offer to run `pnpm audit --fix` (this updates the lockfile)
   - For vulnerabilities requiring manual intervention (e.g. no patched version yet), note the package and link to any advisory if available
   - Flag any critical or high severity issues that should be prioritized
   