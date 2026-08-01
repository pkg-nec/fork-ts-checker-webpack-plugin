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
