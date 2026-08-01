# Repository Guidelines

## Project Structure & Module Organization

Runtime TypeScript lives in `src/`; public entry points begin at `src/index.ts`, with feature areas such as `formatter/`, `issue/`, `typescript/`, `watch/`, and `rpc/`. Compiled output is generated in `lib/` and must not be edited directly. Unit tests are under `test/unit/`, while integration coverage and fixture projects live in `test/e2e/` and `test/e2e/fixtures/`. Runnable examples are in `examples/`; release instructions are in `docs/RELEASING.md`.

## Build, Test, and Development Commands

Use Corepack and the committed Yarn version:

```bash
corepack enable
yarn install --immutable
yarn build                 # compile src/ into lib/
yarn lint                  # ESLint and Prettier checks for src/ and test/
yarn test:unit             # Jest unit suite
yarn test:e2e              # package and run e2e fixture suite
yarn test                  # build, unit tests, then e2e tests
```

`yarn prepare:local-release` builds and stamps the local package version into the release artifact. Use it only for release preparation; follow `docs/RELEASING.md` to pack, inspect, smoke-test, and publish the exact tarball.

## Coding Style & Naming Conventions

Write TypeScript with single quotes, a 100-character print width, and the repository’s existing end-of-line convention. ESLint enforces Prettier, import ordering, and `import type` for type-only imports. Keep modules focused and use kebab-case file names such as `type-script-support.ts`. Name tests `*.spec.ts`; use descriptive `describe` and `it` names that state observable behavior.

## Testing Guidelines

Add or update a focused Jest test for every behavior change. Place isolated logic tests in `test/unit/`; use `test/e2e/` only when validating Webpack, TypeScript, package tarballs, or fixture integration. Run the most focused suite while iterating, then run `yarn lint` and the relevant broader suite before opening a PR. E2E tests create ignored `.tgz` artifacts.

## Commit & Pull Request Guidelines

Use atomic Conventional Commits, e.g. `fix: handle invalid tsconfig` or `test: cover package metadata`. Common types are `fix`, `test`, `docs`, `build`, `ci`, and `chore`; keep subjects imperative, lowercase, and without a trailing period. PRs should be narrowly scoped, explain the problem and behavior change, link relevant issues, and list verification commands/results. Include documentation when user-facing behavior changes. Do not change semantic-release configuration or publish packages from a PR.
