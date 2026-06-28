# Development Workflow

NyaayWatch is designed for small, reviewable changes and parallel work across multiple AI and human contributors.

## Default Rules

- do not implement directly on `main`
- open one branch per task
- use one active branch per worktree
- open a pull request before merging to `main`
- use Conventional Commits
- keep changes small and scoped

## Starting A New Task

From an existing worktree:

```bash
./scripts/start-task.sh feat published-snapshot-api
```

This creates and switches to a branch named:

```bash
feat/published-snapshot-api
```

You can choose any supported type:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`
- `build`

## Starting A Parallel Worktree

Create a new worktree from `main` for a separate task:

```bash
git worktree add ../nyaaywatch-published-snapshot-api -b feat/published-snapshot-api main
```

Then enter that worktree and work only on that task:

```bash
cd ../nyaaywatch-published-snapshot-api
```

## Multi-Agent Guidance

When running multiple AI coding sessions in parallel:

- assign each session a distinct branch
- split work by subsystem or directory where possible
- coordinate shared schema or contract changes first
- avoid overlapping edits to the same files
- integrate branches with explicit review for schema drift and public-claim drift

## Pull Request Flow

1. Create a task branch.
2. Make one focused set of changes.
3. Commit with a Conventional Commit message.
4. Push the branch.
5. Open a pull request.
6. Merge to `main` only through the pull request flow unless there is an explicit emergency exception.

## Local Stack Commands

For the current PostgreSQL + S3-backed development slice:

```bash
cp .env.example .env
npm install
npm run docker:up
npm run dev:bootstrap
npm run dev
```

Useful follow-up commands:

```bash
npm run db:migrate
npm run db:seed
npm run operator:fetch -- "Manual Himachal fetch"
npm run operator:inspect -- <run-id>
npm run operator:publications
npm run operator:publish -- <run-id> "Publish latest run"
npm run operator:replay -- <run-id>
npm run operator:rollback -- <publication-id>
npm run operator:remote -- --base-url=https://nyaaywatch.in publications
npm run operator:production -- --state UP fetch "Internal Uttar Pradesh fetch"
npm run release:prepublish -- --run-id=<run-id> --base-url=https://nyaaywatch.in
npm run release:prepublish -- --state-slug=<state-slug> --run-id=<run-id> --base-url=https://nyaaywatch.in
npm run release:postpublish -- --publication-id=<publication-id> --base-url=https://nyaaywatch.in
npm run release:postpublish -- --state-slug=<state-slug> --publication-id=<publication-id> --base-url=https://nyaaywatch.in
npm run release:record -- --publication-id=<publication-id> --base-url=https://nyaaywatch.in --reviewer="<name>"
npm run release:record -- --state-slug=<state-slug> --publication-id=<publication-id> --base-url=https://nyaaywatch.in --reviewer="<name>"
npm test
```

For heavier production internal-state live runs, use the ECS-backed operator lane:

```bash
npm run operator:production -- --state=UP fetch "Internal Uttar Pradesh fetch"
```

Local development uses PostgreSQL plus LocalStack S3. Keep `AWS_REGION=ap-south-1` even locally so the code path matches the AWS deployment target.

Use `npm run operator:remote` for lightweight live remote operator access through the public hostname. Use `npm run operator:production` for live AWS heavy-state work when the operator command should run inside one-off ECS tasks instead of through the public HTTP path. It targets the reality-named production backing stack `nyaaywatch-production`; use it only for recorded release or internal-proof work. After the production public-ingress WAF is enabled, direct ALB `--connect-host=<alb-dns>` traffic is blocked unless the WAF is intentionally disabled or allowlisted for a controlled recovery window.

## Commit Examples

```text
feat(api): add published district snapshot endpoint
fix(web): show snapshot freshness on district page
docs(workflow): add parallel worktree guide
test(normalize): cover disposal-rate transform
```
