const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { MaxRectsPacker } = require('maxrects-packer');

const RAW_DIR = path.join(__dirname, '../assets/raw');
const OUTPUT_DIR = path.join(__dirname, '../public/assets');
const TARGET_SIZE = 256; 

async function packAssets() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const sprites = [];
  
  // Recursively find all PNG/JPG files in assets/raw
  function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (file.endsWith('.png') || file.endsWith('.jpg')) {
        sprites.push({
          fullPath,
          name: path.parse(file).name
        });
      }
    }
  }

  walk(RAW_DIR);
  console.log(`Found ${sprites.length} files to pack...`);

  const processedSprites = [];
  for (const sprite of sprites) {
    // Downscale with sharp
    const buffer = await sharp(sprite.fullPath)
      .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: true })
      .toBuffer();

    const metadata = await sharp(buffer).metadata();
    
    processedSprites.push({
      name: sprite.name,
      buffer,
      width: metadata.width,
      height: metadata.height
    });
  }

  const options = {
    smart: true,
    pot: true,
    square: true,
    padding: 2
  };

  const packer = new MaxRectsPacker(2048, 2048, 2, options);
  packer.addArray(processedSprites.map(s => ({
    width: s.width,
    height: s.height,
    data: s
  })));

  if (packer.bins.length === 0) {
    console.error('No bins created. Check if images were found.');
    return;
  }

  const bin = packer.bins[0];
  console.log(`Atlas generated: ${bin.width}x${bin.height}`);

  const atlasImage = sharp({
    create: {
      width: bin.width,
      height: bin.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  });

  const compositeArray = bin.rects.map(rect => ({
    input: rect.data.buffer,
    left: rect.x,
    top: rect.y
  }));

  await atlasImage
    .composite(compositeArray)
    .png({ compressionLevel: 9, palette: true })
    .toFile(path.join(OUTPUT_DIR, 'symbols.png'));

  const atlasData = {
    frames: {},
    meta: {
      app: 'AI-Studio-Packer',
      version: '2.0',
      image: 'symbols.png',
      format: 'RGBA8888',
      size: { w: bin.width, h: bin.height },
      scale: '1'
    }
  };

  bin.rects.forEach(rect => {
    atlasData.frames[rect.data.name] = {
      frame: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: rect.width, h: rect.height },
      sourceSize: { w: rect.width, h: rect.height }
    };
  });

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'symbols.json'),
    JSON.stringify(atlasData, null, 2)
  );

  console.log('Atlas and JSON successfully created in public/assets/');
}

packAssets().catch(console.error);
