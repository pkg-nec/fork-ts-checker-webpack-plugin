const fs = require('fs');
const path = require('path');

function assertReleaseTagVersion(tag, packageVersion) {
  const expectedTag = 'v' + packageVersion;
  if (tag !== expectedTag) {
    throw new Error('Release tag ' + tag + ' must equal ' + expectedTag);
  }
}

if (require.main === module) {
  const packagePath = path.resolve(__dirname, '..', 'package.json');
  const version = JSON.parse(fs.readFileSync(packagePath, 'utf8')).version;
  assertReleaseTagVersion(process.argv[2], version);
}

module.exports = { assertReleaseTagVersion };
