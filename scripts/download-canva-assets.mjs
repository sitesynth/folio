import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const reconPath = path.join(root, 'docs/research/canva-portfolio/canva-recon-1-27.json');
const assetDir = path.join(root, 'public/sites/canva-com-237372fb/canva-portfolio-5e3226b2/images');
const manifestPath = path.join(root, 'docs/research/canva-portfolio/asset-manifest.json');

const recon = JSON.parse(await fs.readFile(reconPath, 'utf8'));
const urls = [...new Set(recon.pages.flatMap((page) => page.images.map((image) => image.src)))]
  .filter((url) => /^https?:\/\/media\.canva\.com\//.test(url));

await fs.mkdir(assetDir, { recursive: true });

function imageKey(url) {
  const match = decodeURIComponent(url).match(/uri:ifs:\/\/M\/([^/?]+)/);
  return match?.[1] || `asset-${Buffer.from(url).toString('hex').slice(0, 16)}`;
}

function extension(url, contentType = '') {
  if (/jpe?g/i.test(contentType) || /format:JPG/i.test(url)) return 'jpg';
  if (/webp/i.test(contentType) || /format:WEBP/i.test(url)) return 'webp';
  return 'png';
}

const manifest = {};
let downloaded = 0;
let failed = 0;

for (let index = 0; index < urls.length; index += 4) {
  const batch = urls.slice(index, index + 4);
  await Promise.all(batch.map(async (url) => {
    try {
      const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const contentType = response.headers.get('content-type') || '';
      const filename = `${imageKey(url)}.${extension(url, contentType)}`;
      const localPath = path.join(assetDir, filename);
      await fs.writeFile(localPath, Buffer.from(await response.arrayBuffer()));
      manifest[url] = `/sites/canva-com-237372fb/canva-portfolio-5e3226b2/images/${filename}`;
      downloaded += 1;
    } catch (error) {
      failed += 1;
      console.warn(`Could not download ${url.slice(0, 100)}: ${error.message}`);
    }
  }));
  console.log(`Assets: ${Math.min(index + 4, urls.length)}/${urls.length}`);
}

await fs.writeFile(manifestPath, JSON.stringify({ sourceCount: urls.length, downloaded, failed, manifest }, null, 2));
console.log(`Saved ${downloaded} assets; ${failed} failed. Manifest: ${manifestPath}`);
