import { parseNpmPackJson } from './parse-npm-pack-json';

describe('parseNpmPackJson', () => {
  it('ignores lifecycle output before npm pack metadata', () => {
    expect(
      parseNpmPackJson(
        'husky - Git hooks installed\n[\n  {\n    "filename": "pkg-nec-fork-ts-checker-webpack-plugin-9.1.0.tgz"\n  }\n]'
      )
    ).toEqual([{ filename: 'pkg-nec-fork-ts-checker-webpack-plugin-9.1.0.tgz' }]);
  });
});
