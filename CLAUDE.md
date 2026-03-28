# Project Rules

## Critical: File System Safety

- **Real project path**: `C:\Users\Owen\OneDrive\Desktop\fieldpulse-dev\fieldpulse`
- Windows OneDrive redirects `Desktop` — NEVER use `C:\Users\Owen\Desktop\...` directly
- ALWAYS use absolute paths for file operations — never `cd` into subdirectories
- NEVER use `rm -rf`, `rm -r`, or bulk delete commands on project directories
- NEVER run `mv` with relative paths — always use full absolute paths
- Before any rename/move/delete: verify the working directory with `pwd` first
- Agents must receive absolute paths in their prompts, not relative ones

## Git

- Push to remote after every meaningful batch of work
- Commit before starting any large refactor so there's a rollback point
- Do not amend commits — always create new ones

## Architecture

- Server code (server/) stays JavaScript — TypeScript migration is frontend only (src/)
- All frontend types live in src/types/index.ts
- API modules use generic request<T>() from core.ts
