const { chromium } = require('./node_modules/playwright-core');

const out = 'C:/Users/Liann/Repos/madebylianna/case-studies/images/designd';

(async () => {
  const browser = await chromium.launch({ headless: true });

  async function shot(name, fn) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('https://designd-three.vercel.app/canvas', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3500);
    await fn(page);
    await page.close();
    console.log(`${name} saved`);
  }

  // 1. Full canvas overview
  await shot('canvas-full.png', async (page) => {
    await page.screenshot({ path: `${out}/canvas-full.png` });
  });

  // 2. Node editor open — click first node
  await shot('node-editor.png', async (page) => {
    const nodes = await page.locator('.react-flow__node').all();
    if (nodes.length > 0) {
      await nodes[0].click({ force: true });
      await page.waitForTimeout(1000);
    }
    await page.screenshot({ path: `${out}/node-editor.png` });
  });

  // 3. Node editor with Materials section — open add form
  await shot('node-editor-materials.png', async (page) => {
    const nodes = await page.locator('.react-flow__node').all();
    if (nodes.length > 0) {
      await nodes[0].click({ force: true });
      await page.waitForTimeout(800);
      // Click the "+ Add" materials button
      const addBtn = page.locator('button').filter({ hasText: 'Add' }).first();
      const visible = await addBtn.isVisible().catch(() => false);
      if (visible) {
        await addBtn.click({ force: true });
        await page.waitForTimeout(600);
      }
    }
    await page.screenshot({ path: `${out}/node-editor-materials.png` });
  });

  // 4. Run dialog
  await shot('run-dialog.png', async (page) => {
    const runBtn = page.locator('button').filter({ hasText: 'Run Pipeline' }).first();
    await runBtn.click({ force: true });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}/run-dialog.png` });
  });

  await browser.close();
  console.log('All done');
})();
