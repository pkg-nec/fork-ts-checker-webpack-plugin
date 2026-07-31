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
