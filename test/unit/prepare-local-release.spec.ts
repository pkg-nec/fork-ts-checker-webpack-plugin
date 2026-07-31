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

  it('rejects multiple markers', () => {
    fs.writeFileSync(pluginPath, "Plugin.version = '{{VERSION}}-{{VERSION}}';\n");
    expect(() => replacePluginVersion({ packageJsonPath, pluginPath })).toThrow(
      'Expected exactly one {{VERSION}} marker'
    );
  });
});
