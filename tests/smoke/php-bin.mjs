import { existsSync } from 'node:fs';

export function resolvePhpBin() {
  if (process.env.XAMPP_PHP_BIN) {
    return process.env.XAMPP_PHP_BIN;
  }
  if (process.env.PHP_BIN) {
    return process.env.PHP_BIN;
  }
  if (process.platform === 'win32') {
    const candidates = [
      'C:\\xampp\\php\\php.exe',
      'C:\\Program Files\\xampp\\php\\php.exe'
    ];
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }
  return 'php';
}
