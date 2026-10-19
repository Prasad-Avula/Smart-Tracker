import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, 'public/screenshots');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive:true});

async function generate() {
  // wide 1280x720
  await sharp({
    create: {
      width: 1280,
      height: 720,
      channels: 4,
      background: { r: 30, g: 30, b: 60, alpha: 1 }
    }
  }).png().toFile(path.join(outDir, 'wide.png'));
  console.log('Generated wide.png');

  // narrow 720x1280
  await sharp({
    create: {
      width: 720,
      height: 1280,
      channels: 4,
      background: { r: 30, g: 30, b: 60, alpha: 1 }
    }
  }).png().toFile(path.join(outDir, 'narrow.png'));
  console.log('Generated narrow.png');
  console.log('Done');
}

generate().catch(err => { console.error(err); process.exit(1); });