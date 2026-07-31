# pkg-nec Rebrand and Provenance Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish `@pkg-nec/fork-ts-checker-webpack-plugin@9.1.0` as a compatible scoped fork, then publish later explicit versions from protected tags with npm provenance.

**Architecture:** PR 1 changes the npm distribution identity and adds a small local release-preparation helper. It leaves the runtime API, `fork-ts-checker` configuration namespace, and every semantic-release file untouched. PR 2 adds a separate tag-only workflow, backed by a unit-tested tag/version verifier, that publishes through npm OIDC and creates the matching GitHub release.

**Tech Stack:** Node.js 22, Yarn 4/Corepack, TypeScript 4.5, Jest 27, npm CLI, GitHub Actions, npm trusted publishing (OIDC).

## Global Constraints

- The initial scoped package version is exactly `9.1.0`, explicitly set in `package.json`.
- Keep the plugin public API and the `fork-ts-checker` configuration key/files compatible.
- Do not modify `release.config.js`, semantic-release dependencies, the `semantic-release` package script, or its README badge in either PR.
- Preserve the upstream MIT license, copyright, authors, and contributors; describe pkg-nec as the independent maintainer.
- The first publication is manual from the maintainer's logged-in npm account and has no provenance claim.
- PR 2 runs only on `v*` tag pushes; it verifies tag = `v` + package version, uses `id-token: write`, and never uses `NPM_TOKEN`.

---

## File Map

### PR 1

- Modify `package.json`: scope, explicit version, repository/issue links, public publishing, and scripts.
- Create `scripts/prepare-local-release.js`: replace the built `{{VERSION}}` marker from `package.json`.
- Create `test/unit/prepare-local-release.spec.ts`: unit-test that helper and package identity.
- Modify `test/e2e/jest.setup.ts` plus its four webpack fixture configs: install/import the scoped local tarball.
- Modify `README.md`, `CHANGELOG.md`, and `.github/ISSUE_TEMPLATE/bug_report.md`: rebrand public references.
- Create `docs/RELEASING.md`: manual 9.1.0 publication and future release rules.
- Modify `.gitignore`: ignore all generated npm tarballs.

### PR 2

- Create `scripts/assert-release-tag-version.js`: fail unless a tag exactly equals `v` + package version.
- Create `test/unit/assert-release-tag-version.spec.ts`: test accepted and rejected tag/version pairs.
- Create `.github/workflows/release.yml`: test, provenance-publish, and release from tag pushes.
- Modify `docs/RELEASING.md`: configure the npm trusted publisher and document tag releases.

## PR 1 — Rebrand and manual 9.1.0 release

### Task 1: Add a local release-preparation helper

**Files:**
- Create: `scripts/prepare-local-release.js`
- Create: `test/unit/prepare-local-release.spec.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `replacePluginVersion({ packageJsonPath, pluginPath }) => string`.
- Consumes: a package JSON with a non-empty version and a built file with exactly one `{{VERSION}}` marker.
- Produces: `yarn prepare:local-release`, which rebuilds and patches only `lib/plugin.js`.

- [ ] **Step 1: Write the failing helper test**

```ts
import fs from 'fs';
import os from 'os';
import path from 'path';

const { replacePluginVersion } = require('../../scripts/prepare-local-release');

describe('replacePluginVersion', () => {
  let directory: string;
  let packageJsonPath: string;
  let pluginPath: string;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fork-ts-checker-release-'));
    packageJsonPath = path.join(directory, 'package.json');
    pluginPath = path.join(directory, 'plugin.js');
    fs.writeFileSync(packageJsonPath, JSON.stringify({ version: '9.1.0' }));
    fs.writeFileSync(pluginPath, "Plugin.version = '{{VERSION}}';\n");
  });

  afterEach(() => fs.rmSync(directory, { recursive: true, force: true }));

  it('uses the version from package metadata', () => {
    expect(replacePluginVersion({ packageJsonPath, pluginPath })).toBe('9.1.0');
    expect(fs.readFileSync(pluginPath, 'utf8')).toBe("Plugin.version = '9.1.0';\n");
  });

  it('requires exactly one marker', () => {
    fs.writeFileSync(pluginPath, "Plugin.version = '9.1.0';\n");
    expect(() => replacePluginVersion({ packageJsonPath, pluginPath })).toThrow(
      'Expected exactly one {{VERSION}} marker'
    );
  });
});
```

- [ ] **Step 2: Verify the test fails**

Run: `yarn test:unit --runInBand test/unit/prepare-local-release.spec.ts`

Expected: FAIL because the helper module does not exist.

- [ ] **Step 3: Implement the marker replacer**

```js
const fs = require('fs');
const path = require('path');

function replacePluginVersion({ packageJsonPath, pluginPath }) {
  const version = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version;
  if (typeof version !== 'string' || version.length === 0) {
    throw new Error('Expected a non-empty version in ' + packageJsonPath);
  }

  const marker = '{{VERSION}}';
  const source = fs.readFileSync(pluginPath, 'utf8');
  if (source.split(marker).length - 1 !== 1) {
    throw new Error('Expected exactly one ' + marker + ' marker in ' + pluginPath);
  }

  fs.writeFileSync(pluginPath, source.replace(marker, version));
  return version;
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  replacePluginVersion({
    packageJsonPath: path.join(root, 'package.json'),
    pluginPath: path.join(root, 'lib', 'plugin.js'),
  });
}

module.exports = { replacePluginVersion };
```

Do not modify `src/plugin.ts`, `test/unit/plugin.spec.ts`, or `release.config.js`: the helper is only for the explicit local release preparation path.

- [ ] **Step 4: Add the local release command**

Update `package.json` scripts:

```json
{
  "prepare:local-release": "yarn build && node scripts/prepare-local-release.js",
  "test:e2e": "yarn prepare:local-release && npm pack && cross-env YARN_ENABLE_IMMUTABLE_INSTALLS=false jest --config=test/e2e/jest.config.js --ci -i -b"
}
```

Keep `build` unchanged and retain every semantic-release entry unchanged.

- [ ] **Step 5: Verify the helper and built export**

```sh
yarn test:unit --runInBand test/unit/prepare-local-release.spec.ts
yarn prepare:local-release
node -e "const Plugin = require('./lib'); if (Plugin.version !== '9.1.0') process.exit(1)"
```

Expected: focused Jest test passes and the built package export is `9.1.0`.

- [ ] **Step 6: Commit**

```sh
git add package.json scripts/prepare-local-release.js test/unit/prepare-local-release.spec.ts
git commit -m "build: prepare local package releases from package version"
```

### Task 2: Rebrand metadata, examples, and release instructions

**Files:**
- Modify: `package.json`, `README.md`, `CHANGELOG.md`, `.github/ISSUE_TEMPLATE/bug_report.md`
- Create: `docs/RELEASING.md`
- Modify: `test/unit/prepare-local-release.spec.ts`

**Interfaces:**
- Produces: the one valid distribution/import specifier, `@pkg-nec/fork-ts-checker-webpack-plugin`.
- Preserves: the `fork-ts-checker` configuration namespace and historical attribution.

- [ ] **Step 1: Write the failing package-identity assertion**

Append to `test/unit/prepare-local-release.spec.ts`:

```ts
it('declares the public pkg-nec package identity', () => {
  const packageJson = require('../../package.json');
  expect(packageJson.name).toBe('@pkg-nec/fork-ts-checker-webpack-plugin');
  expect(packageJson.version).toBe('9.1.0');
  expect(packageJson.publishConfig).toEqual({ access: 'public' });
  expect(packageJson.repository.url).toBe(
    'https://github.com/pkg-nec/fork-ts-checker-webpack-plugin.git'
  );
  expect(packageJson.bugs.url).toBe(
    'https://github.com/pkg-nec/fork-ts-checker-webpack-plugin/issues'
  );
});
```

- [ ] **Step 2: Verify the assertion fails**

Run: `yarn test:unit --runInBand test/unit/prepare-local-release.spec.ts`

Expected: FAIL against the current unscoped metadata and upstream URLs.

- [ ] **Step 3: Update package metadata**

Set these fields in `package.json`:

```json
{
  "name": "@pkg-nec/fork-ts-checker-webpack-plugin",
  "version": "9.1.0",
  "bugs": {
    "url": "https://github.com/pkg-nec/fork-ts-checker-webpack-plugin/issues"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/pkg-nec/fork-ts-checker-webpack-plugin.git"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

Keep `author`, `contributors`, `license`, semantic-release dependencies, the `semantic-release` script, and `release.config.js` unchanged.

- [ ] **Step 4: Update public text**

In `README.md`:

1. Point npm badges at the URL-encoded scoped package, `@pkg-nec%2Ffork-ts-checker-webpack-plugin`.
2. Point the workflow badge at `pkg-nec/fork-ts-checker-webpack-plugin` and `.github/workflows/ci.yml`.
3. Add this notice after the badge block:

```md
> This is an independently maintained pkg-nec fork of TypeStrong's
> `fork-ts-checker-webpack-plugin`, focused on security and dependency fixes.
> Install and import the scoped package name shown below.
```

4. Replace every install command and JavaScript/TypeScript import example with the scoped specifier.
5. Add one sentence that the dependency/import specifier changes, but existing `fork-ts-checker` configuration remains valid.
6. Keep the semantic-release badge.

Replace only the first `CHANGELOG.md` warning with:

```md
## pkg-nec releases

pkg-nec publishes maintained releases as `@pkg-nec/fork-ts-checker-webpack-plugin`.
See the [repository releases](https://github.com/pkg-nec/fork-ts-checker-webpack-plugin/releases)
for releases from this fork. Historical entries below refer to the upstream project.
```

Change the package label in `.github/ISSUE_TEMPLATE/bug_report.md` to `@pkg-nec/fork-ts-checker-webpack-plugin`.

Create `docs/RELEASING.md` with this first-release procedure:

```md
# Releasing

## First release: 9.1.0

1. Start from the merged PR 1 commit on `main`.
2. Run `corepack enable && yarn install --immutable`.
3. Run `yarn lint && yarn test && yarn prepare:local-release`.
4. Run `node -e "const Plugin = require('./lib'); if (Plugin.version !== '9.1.0') process.exit(1)"`.
5. Run `npm pack --dry-run` and confirm the scoped name and version.
6. Run `npm whoami` and confirm the account can publish to `@pkg-nec`.
7. Run `npm publish --access public`.

This first local release intentionally has no npm provenance.
```

- [ ] **Step 5: Verify metadata and documentation**

```sh
yarn test:unit --runInBand test/unit/prepare-local-release.spec.ts
rg -n "npm install --save-dev fork-ts-checker-webpack-plugin|require\('fork-ts-checker-webpack-plugin'\)" README.md package.json
```

Expected: Jest passes and `rg` prints no stale install or import examples.

- [ ] **Step 6: Commit**

```sh
git add package.json README.md CHANGELOG.md .github/ISSUE_TEMPLATE/bug_report.md docs/RELEASING.md test/unit/prepare-local-release.spec.ts
git commit -m "docs: rebrand package for pkg-nec publishing"
```

### Task 3: Exercise the scoped tarball in e2e tests

**Files:**
- Modify: `test/e2e/jest.setup.ts`
- Modify: `test/e2e/fixtures/typescript-basic/webpack.config.js`
- Modify: `test/e2e/fixtures/type-definitions/webpack.config.ts`
- Modify: `test/e2e/fixtures/typescript-pnp/webpack.config.js`
- Modify: `test/e2e/fixtures/typescript-monorepo/webpack.config.js`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: a local tarball pinned as `@pkg-nec/fork-ts-checker-webpack-plugin`.
- Produces: four fixture configurations that resolve that scoped package name.

- [ ] **Step 1: Change the fixture dependency and imports**

In `test/e2e/jest.setup.ts`, use:

```ts
fixedDependencies: {
  '@pkg-nec/fork-ts-checker-webpack-plugin': `file:${forkTsCheckerWebpackPluginTar}`,
},
```

Replace the old unscoped `require` in the three JavaScript fixture configs with:

```js
require('@pkg-nec/fork-ts-checker-webpack-plugin')
```

Replace the TypeScript fixture import with:

```ts
import ForkTsCheckerWebpackPlugin from '@pkg-nec/fork-ts-checker-webpack-plugin';
```

- [ ] **Step 2: Ignore all generated package archives**

Replace the version-specific tarball rule in `.gitignore` with:

```gitignore
# Package archives generated by npm pack
*.tgz
```

- [ ] **Step 3: Verify fixture installation and the exact tarball**

```sh
yarn test:e2e
yarn prepare:local-release
npm pack --json
node -e "const fs=require('fs'); const f=fs.readdirSync('.').find((x)=>x.includes('pkg-nec-fork-ts-checker-webpack-plugin-9.1.0')&&x.endsWith('.tgz')); if(!f) process.exit(1)"
```

Expected: all e2e fixtures pass and `npm pack --json` reports `@pkg-nec/fork-ts-checker-webpack-plugin@9.1.0`.

- [ ] **Step 4: Run full PR 1 verification and commit**

```sh
yarn lint
yarn test
git diff --check
git add .gitignore test/e2e
git commit -m "test: exercise scoped package tarball"
```

Expected: lint, all tests, and whitespace checks pass.

### Task 4: Publish the first release manually after PR 1 merges

**Files:** None.

**Interfaces:** consumes the merged PR 1 commit and a logged-in npm account authorized for `@pkg-nec`; produces the immutable public version `9.1.0`.

- [ ] **Step 1: Recreate the verified release artifact**

```sh
git switch main
git pull --ff-only
git status --short
corepack enable
yarn install --immutable
yarn lint
yarn test
yarn prepare:local-release
node -e "const Plugin = require('./lib'); if (Plugin.version !== '9.1.0') process.exit(1)"
npm pack --dry-run
```

Expected: the working tree is clean; build and tests pass; the dry run identifies the scoped 9.1.0 package.

- [ ] **Step 2: Publish and confirm**

```sh
npm whoami
npm access ls-packages @pkg-nec
npm publish --access public
npm view @pkg-nec/fork-ts-checker-webpack-plugin@9.1.0 version dist.tarball
```

Expected: the authorized account publishes exactly `9.1.0`; do not pass `--provenance`.

## PR 2 — Provenance-only GitHub Actions release

### Task 5: Add a testable tag/version verifier

**Files:**
- Create: `scripts/assert-release-tag-version.js`
- Create: `test/unit/assert-release-tag-version.spec.ts`

**Interfaces:**
- Produces: `assertReleaseTagVersion(tag, packageVersion) => void`.
- Rule: exactly `v` + package version is valid.

- [ ] **Step 1: Write the failing test**

```ts
const { assertReleaseTagVersion } = require('../../scripts/assert-release-tag-version');

describe('assertReleaseTagVersion', () => {
  it('accepts an exact v-prefixed version', () => {
    expect(() => assertReleaseTagVersion('v9.1.1', '9.1.1')).not.toThrow();
  });

  it.each([
    ['9.1.1', '9.1.1'],
    ['v9.1.0', '9.1.1'],
    ['v9.1.1-rc.1', '9.1.1'],
  ])('rejects tag %s for %s', (tag, packageVersion) => {
    expect(() => assertReleaseTagVersion(tag, packageVersion)).toThrow(
      'Release tag ' + tag + ' must equal v' + packageVersion
    );
  });
});
```

- [ ] **Step 2: Verify it fails, then implement the verifier**

Run: `yarn test:unit --runInBand test/unit/assert-release-tag-version.spec.ts`

Expected: FAIL because the module does not exist.

Create `scripts/assert-release-tag-version.js`:

```js
const fs = require('fs');
const path = require('path');

function assertReleaseTagVersion(tag, packageVersion) {
  const expectedTag = 'v' + packageVersion;
  if (tag !== expectedTag) {
    throw new Error('Release tag ' + tag + ' must equal ' + expectedTag);
  }
}

if (require.main === module) {
  const packagePath = path.resolve(__dirname, '..', 'package.json');
  const version = JSON.parse(fs.readFileSync(packagePath, 'utf8')).version;
  assertReleaseTagVersion(process.argv[2], version);
}

module.exports = { assertReleaseTagVersion };
```

- [ ] **Step 3: Verify and commit**

```sh
yarn test:unit --runInBand test/unit/assert-release-tag-version.spec.ts
node scripts/assert-release-tag-version.js v9.1.0
git add scripts/assert-release-tag-version.js test/unit/assert-release-tag-version.spec.ts
git commit -m "test: validate release tags against package version"
```

Expected: the test and exact version command pass.

### Task 6: Add the tag-only provenance workflow

**Files:**
- Create: `.github/workflows/release.yml`
- Modify: `docs/RELEASING.md`

**Interfaces:**
- Consumes: a pushed `vX.Y.Z` tag and npm trusted-publisher configuration for this repository/workflow.
- Produces: an npm provenance attestation and GitHub release for that same tag.

- [ ] **Step 1: Create the workflow**

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: read

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: yarn

      - name: Enable Corepack
        run: corepack enable

      - name: Install dependencies
        run: yarn install --immutable

      - name: Verify tag and package version
        run: node scripts/assert-release-tag-version.js "${{ github.ref_name }}"

      - name: Lint
        run: yarn lint

      - name: Run tests
        run: yarn test

      - name: Inspect package contents
        run: npm pack --dry-run

      - name: Publish with npm provenance
        run: npm publish --access public --provenance

      - name: Create GitHub release
        env:
          GH_TOKEN: ${{ github.token }}
        run: gh release create "${{ github.ref_name }}" --generate-notes
```

Do not add `workflow_dispatch`, branch triggers, `NPM_TOKEN`, or semantic-release invocations. Leave `.github/workflows/ci.yml` unchanged.

- [ ] **Step 2: Document trusted-publisher setup**

Append this section to `docs/RELEASING.md`:

```md
## Provenance releases

Before the first automated release, configure npm trusted publishing for
`@pkg-nec/fork-ts-checker-webpack-plugin` with repository
`pkg-nec/fork-ts-checker-webpack-plugin` and workflow
`.github/workflows/release.yml`. Do not create an `NPM_TOKEN`.

For each automated release, merge a PR with the explicit package version, then
push the matching `vX.Y.Z` tag from that commit. The workflow verifies the
tag/version pair, publishes with provenance, and creates the GitHub release.
Never move a release tag; fix forward with a new version and tag.
```

- [ ] **Step 3: Validate release boundaries and commit**

```sh
actionlint .github/workflows/release.yml
rg -n "NPM_TOKEN|workflow_dispatch|semantic-release" .github/workflows/release.yml
rg -n "id-token: write|contents: write|--provenance|assert-release-tag-version" .github/workflows/release.yml
yarn lint
yarn test
git diff --check
git add .github/workflows/release.yml docs/RELEASING.md scripts/assert-release-tag-version.js test/unit/assert-release-tag-version.spec.ts
git commit -m "ci: publish tagged releases with npm provenance"
```

Expected: actionlint, lint, tests, and whitespace checks pass; the first search prints no matches and the second confirms the required safeguards.

### Task 7: Enable trusted publishing and release the next version

**Files:** None.

**Interfaces:** consumes merged PR 2, an npm organization administrator, and an already-published `9.1.0`; produces a provenance-attested follow-up version such as `9.1.1`.

- [ ] **Step 1: Configure npm trusted publishing**

In the npm package settings for `@pkg-nec/fork-ts-checker-webpack-plugin`, register:

```text
Repository: pkg-nec/fork-ts-checker-webpack-plugin
Workflow: .github/workflows/release.yml
```

Expected: npm displays the GitHub Actions trusted-publisher relationship and no long-lived publish token exists.

- [ ] **Step 2: Exercise the first provenance release**

After a PR setting `package.json` to `9.1.1` has merged:

```sh
git switch main
git pull --ff-only
git tag v9.1.1
git push origin v9.1.1
npm view @pkg-nec/fork-ts-checker-webpack-plugin@9.1.1 version dist.attestations
gh release view v9.1.1 --repo pkg-nec/fork-ts-checker-webpack-plugin
```

Expected: the tag triggers the workflow, npm shows an attestation for `9.1.1`, and GitHub shows the generated release.

## Plan Self-Review

- Spec coverage: Tasks 1-4 implement scoped 9.1.0 identity, API/config continuity, exact tarball verification, preserved semantic-release, and local non-provenance publishing. Tasks 5-7 implement the tag invariant, OIDC permissions, provenance publish, GitHub release, and npm trusted-publisher setup.
- Placeholder scan: every file, test, workflow, command, and expected result is explicit.
- Interface consistency: Task 1 defines and tests `replacePluginVersion`; Task 5 defines and tests `assertReleaseTagVersion`; Task 6 invokes the latter in the release workflow.
