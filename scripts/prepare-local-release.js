const fs = require('fs');
const path = require('path');

function replacePluginVersion({ packageJsonPath, pluginPath }) {
  const version = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version;
  if (typeof version !== 'string' || version.length === 0) {
    throw new Error('Expected a non-empty version in ' + packageJsonPath);
  }

  const marker = '{{VERSION}}';
  const source = fs.readFileSync(pluginPath, 'utf8');
  if (source.split(marker).length - 1 !== 1) {
    throw new Error('Expected exactly one ' + marker + ' marker in ' + pluginPath);
  }

  fs.writeFileSync(pluginPath, source.replace(marker, version));
  return version;
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  replacePluginVersion({
    packageJsonPath: path.join(root, 'package.json'),
    pluginPath: path.join(root, 'lib', 'plugin.js'),
  });
}

module.exports = { replacePluginVersion };
