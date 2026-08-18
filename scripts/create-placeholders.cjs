const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const RAW_BASE = path.join(__dirname, '../assets/raw');

const structure = {
  'symbols': ['ace', 'k', 'q', 'j', 'spades', 'hearts', 'diamonds', 'clubs', 'scatter', 'jk'],
  'ui': ['spin-buttons', '1x'],
  'fx': ['blur', 'blurs']
};

async function createPlaceholders() {
  for (const [dir, files] of Object.entries(structure)) {
    const dirPath = path.join(RAW_BASE, dir);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

    for (const s of files) {
      const color = {
        r: Math.floor(Math.random() * 255),
        g: Math.floor(Math.random() * 255),
        b: Math.floor(Math.random() * 255),
        alpha: dir === 'symbols' ? 1 : 0.8
      };

      // Symbols are 512x512 (High-res masters)
      // UI/FX varies, but I'll use 512 for now as they'll be downscaled
      const size = 512;

      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: color
        }
      })
      .png()
      .toFile(path.join(dirPath, `${s}.png`));
    }
  }
  console.log('High-res placeholders created in assets/raw subfolders');
}

createPlaceholders().catch(console.error);
