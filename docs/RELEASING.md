# Releasing

## First release: 9.1.0

1. Start from the merged PR 1 commit on `main`.
2. Run `corepack enable && yarn install --immutable`.
3. Run `yarn lint && yarn test && yarn prepare:local-release`.
4. Run `npm pack --json` and record the generated `pkg-nec-fork-ts-checker-webpack-plugin-9.1.0.tgz` archive.
5. Inspect that exact archive and its embedded metadata:

   ```bash
   tar -tzf ./pkg-nec-fork-ts-checker-webpack-plugin-9.1.0.tgz
   tar -xOf ./pkg-nec-fork-ts-checker-webpack-plugin-9.1.0.tgz package/package.json
   ```

   Confirm the embedded package metadata has the scoped name and version `9.1.0`.
6. Test that exact archive in a temporary directory:

   ```bash
   mkdir release-smoke-test && cd release-smoke-test
   npm init -y
   npm install ../pkg-nec-fork-ts-checker-webpack-plugin-9.1.0.tgz
   node -e "const Plugin = require('@pkg-nec/fork-ts-checker-webpack-plugin'); if (Plugin.version !== '9.1.0') process.exit(1)"
   cd ..
   ```

7. Run `npm whoami` and confirm the account can publish to `@pkg-nec`.
8. Run `npm publish ./pkg-nec-fork-ts-checker-webpack-plugin-9.1.0.tgz --access public`.

This first local release is manual and intentionally has no npm provenance. Provenance will be added in a later release workflow; do not repack the working directory after the archive has been inspected and tested.

## Provenance releases

Before the first automated release, configure npm trusted publishing with these
exact UI values:

```text
Organization or user: pkg-nec
Repository: fork-ts-checker-webpack-plugin
Workflow filename: release.yml
Environment name: npm-publish
Allowed action: npm publish
```

Do not create an `NPM_TOKEN`.

For each automated release:

1. Merge a PR that sets the explicit package version on `main`.
2. In the GitHub Releases UI, create and publish a release from that merged
   commit with the matching `vX.Y.Z` tag. The UI may create the new tag.
3. Approve the `npm-publish` environment when GitHub requests it.
4. Confirm the workflow publishes with provenance and that the GitHub Release
   remains attached to the immutable tag.

The workflow checks out the GitHub Release tag, verifies it equals `v` plus
the package version, builds the local release artifact, runs unit tests, and
publishes with provenance. Never move a release tag; fix forward with a new
version, tag, and GitHub Release.
