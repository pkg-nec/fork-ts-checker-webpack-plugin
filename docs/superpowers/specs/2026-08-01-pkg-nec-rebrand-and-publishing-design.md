# @pkg-nec Fork TS Checker Webpack Plugin: rebrand and publishing design

## Goal

Publish a security-maintained, scoped distribution of the existing project as
`@pkg-nec/fork-ts-checker-webpack-plugin`, starting at `9.1.0`. Keep behavior
and the upstream release tooling as close to the original project as practical.

The first release is intentionally published from the maintainer's logged-in
local npm account. Subsequent releases use GitHub Actions trusted publishing
with npm provenance.

## Compatibility and identity

The package name changes only at the npm distribution boundary:

- New install and import specifier: `@pkg-nec/fork-ts-checker-webpack-plugin`.
- The exported plugin class and its runtime API remain unchanged.
- The historical `fork-ts-checker` configuration key and configuration file
  names remain unchanged, because they are user configuration rather than the
  npm package specifier.
- The package keeps the name's `fork` component: it accurately describes the
  separate process that performs checking.

Public metadata and documentation identify pkg-nec as the maintainer and
clearly state that this is an independently maintained fork of TypeStrong's
project. The original MIT license, copyright, authors, and contributors remain
credited.

## Versioning and semantic-release

The rebranded first release is exactly `9.1.0`, set explicitly in
`package.json`. It represents a compatible continuation of the upstream 9.x
line rather than a new 1.x lifecycle.

Semantic-release remains in the repository unchanged for both PRs: retain its
dependencies, `semantic-release` script, `release.config.js`, and README
badge. The provenance workflow must not replace, reconfigure, or invoke a new
semantic-release model.

The published artifact must expose the same `9.1.0` version both in its npm
metadata and through `ForkTsCheckerWebpackPlugin.version`. PR 1 will establish
a reproducible local build/release preparation path that produces this result
while preserving the existing semantic-release files.

## PR 1: rebrand and locally publishable 9.1.0

PR 1 creates a ready-to-publish scoped package:

1. Rename package metadata to `@pkg-nec/fork-ts-checker-webpack-plugin`, set
   version `9.1.0`, add public scoped-package publish configuration, and point
   repository and issue links at `pkg-nec`.
2. Update README badges, installation commands, import examples, and maintainer
   statement. Add a concise fork notice and migration note that users must
   replace package import specifiers.
3. Preserve license and contributor attribution, replacing no historical
   credit with pkg-nec ownership claims.
4. Update e2e fixture dependencies to install the scoped local tarball and add
   assertions that the packed metadata and exported version are `9.1.0`.
5. Retire or correct only stale release-facing links (such as upstream-only
   changelog notices); retain historical changelog entries as history.
6. Validate the exact tarball with build, lint, unit tests, e2e tests, and npm
   packaging inspection.

After PR 1 merges, the maintainer performs the first public publication locally
with their logged-in npm account. This first release does not claim npm
provenance.

## PR 2: provenance-only publishing workflow

PR 2 adds a separate GitHub Actions release workflow. It does not modify the
semantic-release configuration or dependency graph.

- Trigger only for pushed version tags matching `v*`.
- Run from the tagged source, install dependencies immutably, build, and run the
  same relevant verification gates before publish.
- Derive the expected version from the tag and fail unless it exactly equals
  `package.json`'s version.
- Grant only the required job-level permissions: `contents: write` for the
  GitHub release and `id-token: write` for npm trusted publishing.
- Publish the public scoped package with `npm publish --provenance --access
  public` using GitHub OIDC, never an `NPM_TOKEN` secret.
- Create the GitHub release from the validated tag after the npm publication.
- Keep the existing CI workflow read-only; pull requests and ordinary pushes
  cannot publish packages.

Before enabling PR 2, configure npm's trusted publisher for
`@pkg-nec/fork-ts-checker-webpack-plugin` to trust precisely this repository
and workflow filename.

## Release operating model

1. Open a release PR with an explicit package version change and release notes.
2. Merge it after CI passes.
3. Push the matching `vX.Y.Z` tag from the reviewed release commit.
4. The provenance workflow verifies, publishes, and creates the GitHub release.
5. If a publication fails before npm accepts the version, fix forward with a
   new version and tag; never move an existing release tag.

## Acceptance criteria

- `npm pack` produces a tarball named for the `@pkg-nec` package whose metadata
  version is `9.1.0`.
- Installing that tarball under its scoped name passes all e2e fixtures.
- `ForkTsCheckerWebpackPlugin.version` equals the package version in the packed
  release.
- Existing user configuration under `fork-ts-checker` continues to work.
- PR 2 can publish an eligible tag with npm provenance and cannot publish from
  a pull request or a non-tag push.
- Semantic-release remains present and unchanged by the rebrand/provenance
  effort.
