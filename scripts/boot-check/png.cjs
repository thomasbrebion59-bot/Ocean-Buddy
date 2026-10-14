/* Décodeur PNG minimal (8 bits RGB/RGBA, non entrelacé) + part de la couleur dominante. */
const zlib = require('node:zlib');
function decodePng(buf) {
  let p = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('latin1', p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; if (data[8] !== 8 || data[12] !== 0) throw Error('PNG non supporté'); }
    else if (type === 'IDAT') idat.push(data); else if (type === 'IEND') break;
    p += 12 + len;
  }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : 0; if (!bpp) throw Error('PNG: type de couleur ' + ct);
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride;
    for (let i = 0; i < stride; i++) {
      const x = raw[src + i], a = i >= bpp ? px[dst + i - bpp] : 0, b = y ? px[dst - stride + i] : 0, c = i >= bpp && y ? px[dst - stride + i - bpp] : 0;
      let v;
      if (f === 0) v = x; else if (f === 1) v = x + a; else if (f === 2) v = x + b; else if (f === 3) v = x + ((a + b) >> 1);
      else { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      px[dst + i] = v & 255;
    }
  }
  return { w, h, bpp, px };
}
/* Part (0..1) du pixel dominant après quantification 4 bits/canal, et sa couleur. */
function flatness(png) {
  const { w, h, bpp, px } = decodePng(png), counts = new Map(); let n = 0;
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
    const o = (y * w + x) * bpp, k = ((px[o] >> 4) << 8) | ((px[o + 1] >> 4) << 4) | (px[o + 2] >> 4);
    counts.set(k, (counts.get(k) || 0) + 1); n++;
  }
  let best = 0, bk = 0; for (const [k, c] of counts) if (c > best) { best = c; bk = k; }
  return { share: best / n, color: '#' + [(bk >> 8) & 15, (bk >> 4) & 15, bk & 15].map(v => (v * 17).toString(16).padStart(2, '0')).join('') };
}
module.exports = { decodePng, flatness };
