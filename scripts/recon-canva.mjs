import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const source = 'https://www.canva.com/design/DAHRRKuCAk8/V78M6dRqqME3jUaweTcumA/view';
const output = path.resolve('docs/research/canva-portfolio/canva-recon-1-27.json');
const browser = await puppeteer.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

const pages = [];
try {
  for (let pageNumber = 1; pageNumber <= 27; pageNumber += 1) {
    console.log(`Recon page ${pageNumber}/27`);
    await page.goto(`${source}#${pageNumber}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      (number) => [...document.querySelectorAll('[role="group"][aria-label]')]
        .some((node) => new RegExp(`Page ${number}\\b|Страница ${number}\\b`).test(node.getAttribute('aria-label'))),
      { timeout: 10000 },
      pageNumber,
    ).catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 500));
    pages.push(await page.evaluate((number) => {
      const pageGroup = [...document.querySelectorAll('[role="group"][aria-label]')]
        .find((node) => new RegExp(`Page ${number}\\b|Страница ${number}\\b`).test(node.getAttribute('aria-label')));
      const root = pageGroup || document.querySelector('main');
      const styleKeys = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'color', 'backgroundColor', 'backgroundImage', 'opacity', 'transform', 'position', 'display'];
      const styles = (node) => Object.fromEntries(styleKeys.map((key) => [key, getComputedStyle(node)[key]]));
      const rect = (node) => { const box = node.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height }; };
      const textNodes = root ? [...root.querySelectorAll('p, [role="text"]')].map((node) => ({ text: node.textContent.trim(), rect: rect(node), styles: styles(node) })).filter((item) => item.text) : [];
      const images = [...document.querySelectorAll('img')].map((node) => ({ src: node.currentSrc || node.src, alt: node.alt, rect: rect(node), styles: styles(node) })).filter((item) => item.src && !item.src.includes('static.canva.com'));
      return { page: number, aria: pageGroup?.getAttribute('aria-label') || null, viewport: { width: innerWidth, height: innerHeight }, root: root ? rect(root) : null, textNodes, images };
    }, pageNumber));
  }
} finally {
  await browser.close();
}

await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, `${JSON.stringify({ source, range: [1, 27], pages }, null, 2)}\n`);
console.log(`Saved ${output}`);
