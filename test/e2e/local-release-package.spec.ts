import { readFileSync } from 'fs';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      localReleasePackage: {
        tarballPath: string;
        name: string;
        version: string;
      };
    }
  }
}

describe('local release package', () => {
  it('keeps tarball metadata and plugin runtime version aligned with package metadata', async () => {
    const packageJson = JSON.parse(readFileSync(require.resolve('../../package.json'), 'utf8')) as {
      name: string;
      version: string;
    };

    expect(packageJson.version).toBe('9.1.0');
    expect(global.localReleasePackage).toEqual({
      tarballPath: expect.stringMatching(/pkg-nec-fork-ts-checker-webpack-plugin-9\.1\.0\.tgz$/),
      name: '@pkg-nec/fork-ts-checker-webpack-plugin',
      version: '9.1.0',
    });
    expect(global.localReleasePackage.name).toBe(packageJson.name);
    expect(global.localReleasePackage.version).toBe(packageJson.version);

    await sandbox.load(
      require.resolve('./fixtures/typescript-basic/package.json').replace(/package\.json$/, '')
    );
    await sandbox.install('yarn', {});
    const installedPackage = JSON.parse(
      await sandbox.read(
        'node_modules/@pkg-nec/fork-ts-checker-webpack-plugin/package.json',
        'utf8'
      )
    ) as { name: string; version: string };
    const runtimeVersion = await sandbox.exec(
      'yarn node -e "process.stdout.write(require(\'@pkg-nec/fork-ts-checker-webpack-plugin\').version)"'
    );

    expect(installedPackage).toMatchObject({
      name: packageJson.name,
      version: packageJson.version,
    });
    expect(runtimeVersion).toBe(packageJson.version);
  });
});
