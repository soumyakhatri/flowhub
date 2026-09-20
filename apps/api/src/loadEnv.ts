import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

function loadEnvFile(): void {
  let dir = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    const candidate = path.join(dir, '.env');
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate });
      return;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  dotenv.config();
}

loadEnvFile();