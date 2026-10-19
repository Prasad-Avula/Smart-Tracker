import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = path.resolve(__dirname, 'public/logo.png');
const outDir = path.resolve(__dirname, 'public/icons');
const sizes = [72,96,128,144,152,192,384,512];

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive:true});

async function generate() {
  for (const size of sizes) {
    const outFile = path.join(outDir, `icon-${size}x${size}.png`);
    await sharp(input)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outFile);
    console.log(`Generated ${outFile}`);
  }
  console.log('Done');
}

generate().catch(err => { console.error(err); process.exit(1); });