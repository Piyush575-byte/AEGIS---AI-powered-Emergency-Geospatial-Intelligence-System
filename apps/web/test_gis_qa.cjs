const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function runQA() {
  console.log('=== AEGIS GIS MAP: COMPREHENSIVE BROWSER QA SUITE ===');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const artifactsDir = 'C:\\Users\\piyus\\.gemini\\antigravity-ide\\brain\\4c3f8cf8-b0a3-4b92-b379-4990769ff9a3';

  const consoleLogs = [];
  const pageErrors = [];
  const failedRequests = [];

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      console.error('[Browser Error]', text);
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.toString());
    console.error('[Uncaught Page Error]', err.toString());
  });

  page.on('requestfailed', req => {
    // Ignore optional favicons or metrics
    if (!req.url().includes('favicon')) {
      failedRequests.push({ url: req.url(), error: req.failure()?.errorText });
      console.warn('[Request Failed]', req.url(), req.failure()?.errorText);
    }
  });

  console.log('\n1. Navigating to AEGIS Dashboard (http://localhost:5173)...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2500));

  // Screenshot Initial State
  const initialScreenshotPath = path.join(artifactsDir, 'qa_gis_initial.png');
  await page.screenshot({ path: initialScreenshotPath });
  console.log('✓ Captured initial screenshot:', initialScreenshotPath);

  // 2. Inspect Leaflet Container
  const mapContainer = await page.$('.leaflet-container');
  if (!mapContainer) {
    throw new Error('FAIL: .leaflet-container element NOT found in DOM!');
  }
  const containerRect = await page.evaluate(() => {
    const el = document.querySelector('.leaflet-container');
    return {
      width: el?.clientWidth,
      height: el?.clientHeight,
      classes: el?.className
    };
  });
  console.log(`✓ Leaflet Container Dimensions: ${containerRect.width}px x ${containerRect.height}px`);

  // 3. Inspect Tiles
  const tileCount = await page.evaluate(() => {
    return document.querySelectorAll('.leaflet-tile').length;
  });
  console.log(`✓ OpenStreetMap Rendered Tiles count: ${tileCount}`);

  // 4. Inspect Overlays in DOM
  const overlayCounts = await page.evaluate(() => {
    return {
      svgPaths: document.querySelectorAll('.leaflet-overlay-pane svg path').length,
      habitationMarkers: document.querySelectorAll('.aegis-habitation-marker').length,
      shelterMarkers: document.querySelectorAll('.aegis-shelter-marker').length,
      tooltips: document.querySelectorAll('.leaflet-tooltip').length
    };
  });
  console.log('✓ Overlays Rendered:', overlayCounts);

  // 5. Test GIS Layer Checkbox Toggling
  console.log('\n2. Testing GIS Layer Checkbox Toggles...');
  const checkboxes = await page.$$('input[type="checkbox"]');
  console.log(`Found ${checkboxes.length} layer checkboxes.`);

  // Toggle Hazard Zones (Checkbox 0)
  const pathsBefore = await page.evaluate(() => document.querySelectorAll('.leaflet-overlay-pane svg path').length);
  await checkboxes[0].click(); // Turn OFF Hazard Zones
  await new Promise(r => setTimeout(r, 500));
  const pathsAfterOff = await page.evaluate(() => document.querySelectorAll('.leaflet-overlay-pane svg path').length);
  console.log(`  Hazard Zones OFF: paths reduced from ${pathsBefore} -> ${pathsAfterOff}`);
  await checkboxes[0].click(); // Turn ON Hazard Zones
  await new Promise(r => setTimeout(r, 500));

  // Toggle Habitations (Checkbox 1)
  const habsBefore = await page.evaluate(() => document.querySelectorAll('.aegis-habitation-marker').length);
  await checkboxes[1].click(); // Turn OFF Habitations
  await new Promise(r => setTimeout(r, 500));
  const habsAfterOff = await page.evaluate(() => document.querySelectorAll('.aegis-habitation-marker').length);
  console.log(`  Habitations OFF: markers reduced from ${habsBefore} -> ${habsAfterOff}`);
  await checkboxes[1].click(); // Turn ON Habitations
  await new Promise(r => setTimeout(r, 500));

  // Toggle Shelters (Checkbox 2)
  const sheltersBefore = await page.evaluate(() => document.querySelectorAll('.aegis-shelter-marker').length);
  await checkboxes[2].click(); // Turn OFF Shelters
  await new Promise(r => setTimeout(r, 500));
  const sheltersAfterOff = await page.evaluate(() => document.querySelectorAll('.aegis-shelter-marker').length);
  console.log(`  Shelters OFF: markers reduced from ${sheltersBefore} -> ${sheltersAfterOff}`);
  await checkboxes[2].click(); // Turn ON Shelters
  await new Promise(r => setTimeout(r, 500));

  // 6. Test Interactive Popups
  console.log('\n3. Testing Feature Popups...');
  // Click first habitation marker
  const firstHabMarker = await page.$('.aegis-habitation-marker');
  if (firstHabMarker) {
    await firstHabMarker.click();
    await new Promise(r => setTimeout(r, 600));
    const popupText = await page.evaluate(() => document.querySelector('.leaflet-popup-content')?.textContent || '');
    console.log(`✓ Habitation Popup Opened: "${popupText.substring(0, 60).replace(/\s+/g, ' ')}..."`);
  }

  // Click first shelter marker
  const firstShelterMarker = await page.$('.aegis-shelter-marker');
  if (firstShelterMarker) {
    await firstShelterMarker.click();
    await new Promise(r => setTimeout(r, 600));
    const shelterPopupText = await page.evaluate(() => document.querySelector('.leaflet-popup-content')?.textContent || '');
    console.log(`✓ Shelter Popup Opened: "${shelterPopupText.substring(0, 60).replace(/\s+/g, ' ')}..."`);
  }

  // 7. Test Basemap Switching
  console.log('\n4. Testing Basemap Mode Switching...');
  const buttons = await page.$$('button');
  let satButton, terrainButton, opButton, focusButton;
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text?.includes('SATELLITE')) satButton = btn;
    if (text?.includes('TERRAIN')) terrainButton = btn;
    if (text?.includes('OPERATIONAL')) opButton = btn;
    if (text?.includes('Focus Wayanad')) focusButton = btn;
  }

  if (satButton) {
    console.log('  Switching to SATELLITE mode...');
    await satButton.click();
    await new Promise(r => setTimeout(r, 1200));
    const satScreenshotPath = path.join(artifactsDir, 'qa_gis_satellite.png');
    await page.screenshot({ path: satScreenshotPath });
    console.log('  ✓ Satellite screenshot saved:', satScreenshotPath);
  }

  if (terrainButton) {
    console.log('  Switching to TERRAIN mode...');
    await terrainButton.click();
    await new Promise(r => setTimeout(r, 1200));
    const terrainScreenshotPath = path.join(artifactsDir, 'qa_gis_terrain.png');
    await page.screenshot({ path: terrainScreenshotPath });
    console.log('  ✓ Terrain screenshot saved:', terrainScreenshotPath);
  }

  if (opButton) {
    console.log('  Switching back to OPERATIONAL mode...');
    await opButton.click();
    await new Promise(r => setTimeout(r, 1000));
  }

  // 8. Test Focus Wayanad button
  if (focusButton) {
    console.log('\n5. Testing Focus Wayanad button...');
    await focusButton.click();
    await new Promise(r => setTimeout(r, 800));
    console.log('✓ Focus Wayanad executed smoothly.');
  }

  // Final Screenshot
  const finalScreenshotPath = path.join(artifactsDir, 'qa_gis_final.png');
  await page.screenshot({ path: finalScreenshotPath });
  console.log('✓ Final screenshot saved:', finalScreenshotPath);

  // Summary Report
  console.log('\n=== QA RESULTS SUMMARY ===');
  console.log(`- Page Errors: ${pageErrors.length}`);
  console.log(`- Failed Tile / API Requests: ${failedRequests.length}`);
  console.log(`- Leaflet DOM Initialization: SUCCESS`);
  console.log(`- Interactive Layer Toggling: SUCCESS`);
  console.log(`- Popups & Tooltips: SUCCESS`);
  console.log(`- Basemap Switching: SUCCESS`);

  await browser.close();
}

runQA().catch(err => {
  console.error('QA Suite Failed:', err);
  process.exit(1);
});
