import { exec } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { promisify } from 'util';

import { createSandbox } from 'karton';
import type { Sandbox } from 'karton';

declare global {
  let sandbox: Sandbox;
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      sandbox: Sandbox;
    }
  }
}

async function packLocalPackage(directory: string): Promise<string> {
  const packageJson = JSON.parse(readFileSync(path.resolve(directory, 'package.json'), 'utf8')) as {
    name: string;
    version: string;
  };
  const filename = `${packageJson.name.replace(/^@/, '').replace(/\//g, '-')}-${
    packageJson.version
  }.tgz`;

  await promisify(exec)('npm pack', { cwd: directory });

  return path.resolve(directory, filename);
}

beforeAll(async () => {
  const forkTsCheckerWebpackPluginTar = await packLocalPackage(path.resolve(__dirname, '../../'));
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  global.sandbox = await createSandbox({
    lockDirectory: path.resolve(__dirname, '__locks__'),
    fixedDependencies: {
      '@pkg-nec/fork-ts-checker-webpack-plugin': `file:${forkTsCheckerWebpackPluginTar}`,
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
