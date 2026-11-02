const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();

  // 1. Desktop Home Page - Gau Seva & Spacing
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const gausewaEl = await page.$(".home-ref-gausewa-banner");
  if (gausewaEl) {
    await gausewaEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: "C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/react_home_desktop_gausewa_fixed.png",
      fullPage: false,
    });
  }

  // 2. Mobile Home Page - Hero & Stats Strip
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({
    path: "C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/react_home_mobile_hero_fixed.png",
    fullPage: false,
  });

  // Mobile Home Page - Scroll to 4-Step Journey & Gau Seva
  await mobilePage.evaluate(() => window.scrollBy(0, 420));
  await mobilePage.waitForTimeout(300);
  await mobilePage.screenshot({
    path: "C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/react_home_mobile_journey_fixed.png",
    fullPage: false,
  });

  // 3. Mobile Astrologers Directory - Search & Arranged Filters & Compact Cards
  await mobilePage.goto("http://localhost:3000/astrologers", { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({
    path: "C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/react_directory_mobile_filters_fixed.png",
    fullPage: false,
  });

  // Scroll down slightly to see astrologer cards
  await mobilePage.evaluate(() => window.scrollBy(0, 320));
  await mobilePage.waitForTimeout(300);
  await mobilePage.screenshot({
    path: "C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/react_directory_mobile_cards_fixed.png",
    fullPage: false,
  });

  // 4. Mobile Footer - Collapsed Accordions & Compact Trust Row
  await mobilePage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await mobilePage.waitForTimeout(300);
  await mobilePage.screenshot({
    path: "C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/react_mobile_footer_fixed.png",
    fullPage: false,
  });

  // Test expanding Quick Links in Footer
  await mobilePage.click("button:has-text('Quick Links')");
  await mobilePage.waitForTimeout(300);
  await mobilePage.screenshot({
    path: "C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/react_mobile_footer_expanded.png",
    fullPage: false,
  });

  await browser.close();
  console.log("All fix verification screenshots captured successfully!");
})();
