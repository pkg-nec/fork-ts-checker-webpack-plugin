const { assertReleaseTagVersion } = require('../../scripts/assert-release-tag-version');

describe('assertReleaseTagVersion', () => {
  it('accepts an exact v-prefixed version', () => {
    expect(() => assertReleaseTagVersion('v9.1.1', '9.1.1')).not.toThrow();
  });

  it('accepts an exact v-prefixed prerelease version', () => {
    expect(() => assertReleaseTagVersion('v9.1.1-rc.1', '9.1.1-rc.1')).not.toThrow();
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
