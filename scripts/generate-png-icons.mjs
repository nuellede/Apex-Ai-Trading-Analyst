import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const crcData = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([len, crcData, crc]);
}

function generatePNG(width, height, isMaskable = false) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const rowSize = width * 4 + 1; // 1 filter byte + RGBA pixels
  const rawData = Buffer.alloc(height * rowSize);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.38 : 0.44);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // No filter

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Base background: Deep sleek dark slate #0b0e14
      let r = 11, g = 14, b = 20, a = 255;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Icon core content: A sleek rounded badge with cyan-to-emerald gradient
      // Safe boundary
      if (dist <= radius) {
        // Subtle radial gradient inside the shield
        const normDist = dist / radius;
        r = Math.round(15 + (1 - normDist) * 15);
        g = Math.round(22 + (1 - normDist) * 35);
        b = Math.round(38 + (1 - normDist) * 55);

        // Draw Apex Chevron / Peak: Triangle from top to middle
        // Triangle top point: (cx, cy - radius * 0.6)
        // Left base: (cx - radius * 0.55, cy + radius * 0.45)
        // Right base: (cx + radius * 0.55, cy + radius * 0.45)
        
        // 1. Candlestick Bars in the center
        // Green candle on right:
        if (x >= cx + radius * 0.1 && x <= cx + radius * 0.35 && y >= cy - radius * 0.4 && y <= cy + radius * 0.3) {
          r = 16; g = 185; b = 129; // emerald #10b981
        }
        // Green candle wick:
        if (x >= cx + radius * 0.2 - 2 && x <= cx + radius * 0.2 + 2 && y >= cy - radius * 0.55 && y <= cy + radius * 0.45) {
          r = 16; g = 185; b = 129;
        }

        // Cyan candle on left:
        if (x >= cx - radius * 0.35 && x <= cx - radius * 0.1 && y >= cy - radius * 0.15 && y <= cy + radius * 0.4) {
          r = 6; g = 182; b = 212; // cyan #06b6d4
        }
        // Cyan candle wick:
        if (x >= cx - radius * 0.22 - 2 && x <= cx - radius * 0.22 + 2 && y >= cy - radius * 0.3 && y <= cy + radius * 0.55) {
          r = 6; g = 182; b = 212;
        }

        // 2. Glowing Apex Peak / Gold Arrow at the top
        const apexY = cy - radius * 0.2;
        if (y < apexY && y >= cy - radius * 0.65) {
          const halfWidthAtY = ((y - (cy - radius * 0.65)) / (apexY - (cy - radius * 0.65))) * (radius * 0.4);
          if (Math.abs(x - cx) <= halfWidthAtY) {
            // Gold gradient
            r = 245; g = 158; b = 11; // amber #f59e0b
          }
        }

        // Sleek cyan rim border around the badge
        if (dist >= radius - 4 && dist <= radius) {
          r = 56; g = 189; b = 248; // sky-400
          a = 220;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write PWA Icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePNG(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePNG(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePNG(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePNG(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePNG(64, 64, false));

console.log('Successfully generated all PWA PNG icons!');
