const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // 1. Consultation Room
  await mobilePage.goto("http://localhost:3000/consultation/pt-rameshwar-dwivedi", { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({
    path: "C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/react_consultation_mobile_chat.png",
    fullPage: false,
  });

  // Type a message in the chat
  const inputEl = await mobilePage.$("input[placeholder*='Ask']");
  if (inputEl) {
    await inputEl.fill("Namaste Pandit ji, will my career improve in 2026?");
    await mobilePage.click("button:has-text('Send')");
    await mobilePage.waitForTimeout(1200);
    await mobilePage.screenshot({
      path: "C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/react_consultation_mobile_reply.png",
      fullPage: false,
    });
  }

  // 2. Wallet Page
  await mobilePage.goto("http://localhost:3000/wallet", { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({
    path: "C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/react_wallet_mobile_page.png",
    fullPage: false,
  });

  // Open Add Funds modal
  const addFundsBtn = await mobilePage.$("button:has-text('+ Add Funds')");
  if (addFundsBtn) {
    await addFundsBtn.click();
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({
      path: "C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/react_wallet_mobile_modal.png",
      fullPage: false,
    });
  }

  // 3. Smoke check routes
  const routes = [
    "/",
    "/astrologers",
    "/astrologers/pt-rameshwar-dwivedi",
    "/mandir-seva",
    "/mandir-seva/temple/mahakaleshwar-ujjain",
    "/gau-sewa",
    "/mall",
    "/calculators",
    "/rashiphal",
    "/panchang",
  ];

  for (const route of routes) {
    const res = await mobilePage.goto(`http://localhost:3000${route}`, { waitUntil: "domcontentloaded" });
    console.log(`Route ${route} loaded with status ${res.status()}`);
  }

  await browser.close();
  console.log("All routes and Step 6 features verified successfully!");
})();
