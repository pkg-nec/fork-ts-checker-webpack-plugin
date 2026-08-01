import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

import { createSandbox } from 'karton';
import type { Sandbox } from 'karton';

import { parseNpmPackJson } from './parse-npm-pack-json';

declare global {
  let sandbox: Sandbox;
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      sandbox: Sandbox;
      localReleasePackage: {
        tarballPath: string;
        name: string;
        version: string;
      };
    }
  }
}

async function packLocalPackage(directory: string): Promise<NodeJS.Global['localReleasePackage']> {
  const { stdout } = await promisify(exec)('npm pack --json --ignore-scripts', { cwd: directory });
  const [tarball] = parseNpmPackJson(stdout) as Array<{
    filename: string;
    name: string;
    version: string;
  }>;

  return {
    tarballPath: path.resolve(directory, tarball.filename),
    name: tarball.name,
    version: tarball.version,
  };
}

beforeAll(async () => {
  global.localReleasePackage = await packLocalPackage(path.resolve(__dirname, '../../'));
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  global.sandbox = await createSandbox({
    lockDirectory: path.resolve(__dirname, '__locks__'),
    fixedDependencies: {
      '@pkg-nec/fork-ts-checker-webpack-plugin': `file:${global.localReleasePackage.tarballPath}`,
    },
  });
});

beforeEach(async () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await global.sandbox.reset();
});

afterAll(async () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await global.sandbox.cleanup();
});

jest.retryTimes(3);
