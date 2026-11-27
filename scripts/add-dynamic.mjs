import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DYNAMIC_LINE = "export const dynamic = 'force-dynamic';\n";
let patched = 0;

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name === 'route.ts') {
      const content = readFileSync(full, 'utf8');
      if (!content.includes("export const dynamic")) {
        writeFileSync(full, DYNAMIC_LINE + content, 'utf8');
        console.log('patched:', full);
        patched++;
      }
    }
  }
}

walk('src/app/api');
console.log(`\nDone — patched ${patched} files`);
