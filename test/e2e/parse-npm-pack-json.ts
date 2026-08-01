export function parseNpmPackJson(stdout: string): unknown {
  return JSON.parse(stdout.slice(stdout.indexOf('[')));
}
