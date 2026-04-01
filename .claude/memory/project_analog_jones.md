---
name: Analog Jones platform overview
description: Multi-app Angular workspace for Analog Jones — public site and admin dashboard with episodes, tags, and user management
type: project
---

Analog Jones is a content platform with two Angular apps:
- **public-app**: Public-facing site with episodes, tags, contact, terms, privacy pages
- **admin-app**: Admin dashboard for managing users, episodes, tags

**Why:** Building out from blank scaffolds. User wants to implement routes/pages first, then layer on auth + user management for admin-app later.

**How to apply:** When working on features, implement routes and page scaffolds before services and business logic. User prefers Google Sign-in only (no email service). Admin authorization uses `isAdmin` field on Firestore user docs.
