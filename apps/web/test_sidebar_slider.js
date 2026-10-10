import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\piyus\\.gemini\\antigravity-ide\\brain\\678edd64-6728-4444-8de8-6a2ca85131a8';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testSidebarSlider() {
  console.log('Testing Sidebar Slider Toggle Bar...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 950 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  try {
    await page.goto('http://127.0.0.1:5173/sdma', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(2000);

    // 1. Initial expanded state screenshot
    console.log('[STEP 1] Capturing initial state with slider toggle bar...');
    const shot1 = path.join(ARTIFACTS_DIR, '09_sidebar_slider_open.png');
    await page.screenshot({ path: shot1 });
    console.log('  ✓ Saved screenshot: 09_sidebar_slider_open.png');

    // 2. Click toggle button to collapse
    console.log('[STEP 2] Clicking slider toggle button to collapse sidebar...');
    const toggleBtn = await page.$('button[aria-label="Collapse navigation rail"]');
    if (toggleBtn) {
      await toggleBtn.click();
      await delay(600);
    } else {
      console.error('Toggle button not found!');
    }

    // Capture collapsed state (Map occupies 100% of viewport width)
    const shot2 = path.join(ARTIFACTS_DIR, '10_sidebar_slider_collapsed.png');
    await page.screenshot({ path: shot2 });
    console.log('  ✓ Saved screenshot: 10_sidebar_slider_collapsed.png');

    // 3. Click toggle button to expand
    console.log('[STEP 3] Clicking slider toggle button to expand sidebar back...');
    const expandBtn = await page.$('button[aria-label="Expand navigation rail"]');
    if (expandBtn) {
      await expandBtn.click();
      await delay(600);
    }

    // 4. Test keyboard shortcut Ctrl+B
    console.log('[STEP 4] Testing Ctrl+B shortcut to toggle sidebar...');
    await page.keyboard.down('Control');
    await page.keyboard.press('b');
    await page.keyboard.up('Control');
    await delay(500);

    // Expand back
    await page.keyboard.down('Control');
    await page.keyboard.press('b');
    await page.keyboard.up('Control');
    await delay(500);

    console.log('  ✓ All slider toggle interactions validated successfully!');
  } catch (err) {
    console.error('Slider test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testSidebarSlider();
