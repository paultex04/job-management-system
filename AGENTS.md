<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Version control

This folder is a git repository; `origin` is
`github.com/paultex04/job-management-system` (branch `main`).

### Branching: `main` holds milestones, branches hold work

`main` only ever contains a finished, tagged milestone. Everything in progress
lives on a branch.

- One branch per piece of work, named `<type>/<what-it-does>` — `feat/`,
  `fix/`, `chore/`, `docs/`. Examples: `feat/stock-card`,
  `fix/order-status-resync`, `chore/currency-setting`.
- Branch from an up-to-date `main` before starting, and commit small increments
  as you go rather than one giant commit at the end.
- **Never commit directly to `main`.**
- When the work is done and its gates are green, merge it with
  `git merge --no-ff <branch> -m "<milestone>"`, so every milestone is a visible
  merge commit and the branch name permanently records what shipped.
- Tag each merge semantically and annotate it (`git tag -a v0.MINOR.PATCH -m
  "..."`): bump **minor** for a feature milestone, **patch** for fixes and
  chores. The app's version is that tag.
- Delete the branch once merged.
- Deploy from `main`; pin a specific `v*` tag when a release must be
  reproducible.

### Permissions

**Nothing gets committed until the user asks for it.** Leave work uncommitted by
default. When they say "commit" or "commit and push", do it — no further
permission needed. Never amend, rebase, force-push, or reset published history
unless explicitly asked.

### Before committing

1. `npm run check` — typecheck + lint, must be clean.
2. `npm run test:smoke` — 63 end-to-end checks, **requires `npm run dev` already
   running on port 3000**. It writes to the database and restores what it
   changes, but stop the dev server before `prisma migrate` or `next build`
   (both fail with `EPPERM` on the query engine otherwise).
3. `git status` before staging — confirm no `.env`, `prisma/dev.db`, or other
   secret is caught in.

Write commit messages that say *why* the change was made, not what the diff
already shows. `git push` works without a token in the chat: credentials are
served by Git Credential Manager from the Windows credential store.
