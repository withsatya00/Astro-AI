// Product Detail Page - 1:1 Blueprint Reference Match to Image 8 (media_1793433133533_48f23c04.jpg)
import { esc, money, toast, api, mediaUrl, t, goTo } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';
import { CartStore } from '../../utils/cart-store.js';
import { CartDrawer } from '../../components/shop/CartDrawer.js';
import { REFERENCE_PRODUCTS } from '../AstroMallPage/AstroMallPage.js';

export class ProductPageComponent {
  static root = null;
  static currentId = null;
  static productData = null;
  static activeImageIndex = 0;
  static quantity = 1;
  static activeTab = 'details';

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return null;
    this.root = target;
    CartDrawer.mount();
    window.addEventListener('astro:languagechange', () => {
      if (this.root && this.root.offsetParent !== null && this.currentId) this.open(this.currentId);
    });
    return target;
  }

  static getFallbackProduct(id) {
    const hi = currentLang() === 'hi';
    const found = REFERENCE_PRODUCTS.find(p => p.id === id || p.id.includes(id));

    // Base fallback tailored to 1:1 Reference Blueprint (Sacred Tulsi Kanthi Mala Vrindavan)
    const base = found || REFERENCE_PRODUCTS[8] || REFERENCE_PRODUCTS[0];

    return {
      id: id || 'prod-tulsi-kanthi-mala',
      title: hi ? 'श्री पावन तुलसी कंठी माला (वृंदावन धाम)' : 'Sacred Tulsi Kanthi Mala (Vrindavan)',
      category: 'MALA',
      tag: 'Bestseller',
      badges: [
        hi ? '🛕 श्रीधाम वृंदावन से प्रामाणिक' : '🛕 Authentic from Vrindavan',
        hi ? '🍃 अभिमंत्रित व प्राण प्रतिष्ठित' : '🍃 Energized & Blessed'
      ],
      rating: '4.8',
      reviews_count: '1,240',
      price: 299,
      original_price: 499,
      discount_percent: 40,
      save_amount: 200,
      in_stock: true,
      photos: [
        '/assets/img/products/tulsi-mala.jpg',
        '/assets/img/products/kamalgatta-mala.jpg',
        '/assets/img/products/sphatik-mala.jpg',
        '/assets/img/products/rudraksha-5.jpg'
      ],
      description: hi
        ? 'श्रीधाम वृंदावन की पावन भूमि से हस्तनिर्मित मूल तुलसी कंठी माला, जो भगवान श्री हरि विष्णु एवं श्री राधा-कृष्ण को अति प्रिय है। सनातन शास्त्रों में तुलसी धारण करने से मन को शांति, एकाग्रता, दैवीय सुरक्षा और सात्विक ऊर्जा प्राप्त होती है।'
        : 'A handcrafted Tulsi Kanthi Mala from the holy land of Vrindavan, dedicated to Lord Vishnu and Shri Krishna. Tulsi is considered highly sacred in Vedic traditions and is known to bring devotion, protection and peace of mind.',
      highlight: hi
        ? '🕉 वृंदावन के प्रतिष्ठित बांके बिहारी धाम में वैदिक मंत्रोच्चार द्वारा अभिमंत्रित एवं संकल्पित।'
        : '🕉 Energized with Vedic mantras at a revered temple in Vrindavan.',
      faqs: [
        {
          q: hi ? 'तुलसी कंठी माला क्या है?' : 'What is a Tulsi Kanthi Mala?',
          a: hi
            ? 'तुलसी कंठी माला पवित्र तुलसी की लकड़ी से बनी एक कंठमाला है, जिसे गले में धारण किया जाता है। यह भगवान विष्णु की भक्ति और आध्यात्मिक चेतना का प्रतीक है।'
            : 'A Tulsi Kanthi Mala is a sacred neckpiece made from authentic holy basil (Tulsi) wood beads, traditionally worn as a symbol of surrender and devotion to Lord Vishnu.'
        },
        {
          q: hi ? 'तुलसी माला धारण करने के क्या लाभ हैं?' : 'What are its benefits?',
          a: hi
            ? 'तुलसी माला मन को शांत रखती है, रक्तचाप को नियंत्रित करने में सहायक मानी जाती है, नकारात्मक शक्तियों से रक्षा करती है और सकारात्मक ऊर्जा का संचार करती है।'
            : 'Wearing a Tulsi Mala calms the mind, aids spiritual focus, balances positive throat vibrations, and provides protection against negative planetary and environmental influences.'
        },
        {
          q: hi ? 'क्या मैं इस उत्पाद को वापस या बदल सकता हूँ?' : 'Can I return or exchange this product?',
          a: hi
            ? 'हाँ, डिलीवरी के 7 दिनों के भीतर बिना किसी प्रश्न के आसान रिटर्न और रिफंड की सुविधा उपलब्ध है।'
            : 'Yes, we provide a hassle-free 7-day return and exchange policy if the product arrives damaged or does not meet your expectations.'
        },
        {
          q: hi ? 'यह उत्पाद कैसे डिलीवर किया जाएगा?' : 'How will it be delivered?',
          a: hi
            ? 'पवित्र बॉक्स में सुरक्षित पैकिंग के साथ अखिल भारतीय स्पीड पोस्ट / कूरियर द्वारा 3 से 5 कार्यदिवसों में आपके पते पर डिलीवर किया जाता है।'
            : 'It will be shipped in a sacred, tamper-proof sanctified box via insured courier across India within 3 to 5 business days.'
        }
      ],
      related: [
        {
          id: 'prod-sphatik',
          title: hi ? '108 मनके प्राकृतिक स्फटिक माला' : '108 Beads Natural Sphatik Mala',
          tag: 'Bestseller',
          rating: '4.8 (562)',
          price: 650,
          orig_price: 850,
          off: 24,
          img: '/assets/img/products/sphatik-mala.jpg'
        },
        {
          id: 'prod-kamal',
          title: hi ? '108 कमलगट्टा माला' : '108 Lotus Seed (Kamal Gatta) Mala',
          tag: 'Trending',
          rating: '4.7 (892)',
          price: 399,
          orig_price: 599,
          off: 33,
          img: '/assets/img/products/kamalgatta-mala.jpg'
        },
        {
          id: 'prod-narmada',
          title: hi ? 'सिद्ध नर्मदेश्वर शिवलिंग (5 इंच)' : 'Siddh Narmadeshwar Shivling (Pure Mercury, 5 inch)',
          tag: 'Bestseller',
          rating: '4.8 (986)',
          price: 2150,
          orig_price: 2999,
          off: 28,
          img: '/assets/img/products/parad-shivling.jpg'
        },
        {
          id: 'prod-shankh',
          title: hi ? 'प्राकृतिक दक्षिणावर्ती शंख' : 'Natural Dakshinavarti Shankh (Right-Handed)',
          tag: 'Handpicked',
          rating: '4.9 (764)',
          price: 1499,
          orig_price: 2099,
          off: 29,
          img: '/assets/img/products/shankh.jpg'
        }
      ]
    };
  }

  static async open(id) {
    this.currentId = id;
    this.productData = this.getFallbackProduct(id);
    this.activeImageIndex = 0;
    this.quantity = 1;
    this.activeTab = 'details';
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  static render() {
    if (!this.root) this.root = document.getElementById('view-product');
    if (!this.root || !this.productData) return;

    const p = this.productData;
    const hi = currentLang() === 'hi';
    const wished = CartStore.isWished(p.id);

    this.root.innerHTML = `
      <div class="pr-reference-page">
        <!-- Breadcrumbs -->
        <nav class="pr-ref-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span>›</span>
          <a href="/mall">${hi ? 'एस्ट्रो मॉल' : 'Astro Mall'}</a>
          <span>›</span>
          <span>${esc(p.category)}</span>
          <span>›</span>
          <span class="current">${esc(p.title)}</span>
        </nav>

        <!-- Top Hero Two-Column Card -->
        <div class="pr-ref-hero-card">
          <!-- Left: Gallery Column -->
          <div class="pr-ref-gallery">
            <div class="pr-ref-main-media">
              <span class="pr-ref-tag-badge">${esc(p.tag)}</span>
              <button type="button" class="pr-ref-wish-btn ${wished ? 'is-on' : ''}" id="pr-wish-btn" aria-label="Wishlist">
                ${wished ? '♥' : '♡'}
              </button>
              <img id="pr-main-photo" src="${p.photos[this.activeImageIndex]}" alt="${esc(p.title)}" class="pr-ref-main-img" />
              <button type="button" class="pr-ref-nav-arrow prev" id="pr-prev-img" aria-label="Previous Photo">‹</button>
              <button type="button" class="pr-ref-nav-arrow next" id="pr-next-img" aria-label="Next Photo">›</button>
              <div class="pr-ref-zoom-pill">🔍 ${hi ? 'बड़ा देखें' : 'Zoom View'}</div>
            </div>

            <!-- Thumbnails Strip -->
            <div class="pr-ref-thumbs-row">
              ${p.photos.map((src, i) => `
                <div class="pr-ref-thumb ${i === this.activeImageIndex ? 'is-active' : ''}" data-thumb-idx="${i}">
                  <img src="${src}" alt="Thumb ${i + 1}" />
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Right: Info Column -->
          <div class="pr-ref-info-col">
            <div class="pr-ref-cat-eyebrow">${esc(p.category)}</div>
            <h1 class="pr-ref-product-title">${esc(p.title)}</h1>

            <!-- Badges -->
            <div class="pr-ref-badges-row">
              ${p.badges.map(b => `<span class="pr-ref-badge-item">${esc(b)}</span>`).join('')}
            </div>

            <!-- Rating & Trust -->
            <div class="pr-ref-ratings-row">
              <strong>★ ${p.rating} (${p.reviews_count} reviews)</strong>
              <span>|</span>
              <span>🛡 ${hi ? '10,000+ संतुष्ट भक्तों का भरोसा' : 'Trusted by 10,000+ Devotees'}</span>
            </div>

            <!-- Price Block -->
            <div class="pr-ref-price-block">
              <div class="pr-ref-price-main-line">
                <span class="pr-ref-price-now">₹${p.price.toLocaleString('en-IN')}</span>
                <span class="pr-ref-price-was">₹${p.original_price.toLocaleString('en-IN')}</span>
                <span class="pr-ref-discount-badge">${p.discount_percent}% OFF</span>
              </div>
              <div class="pr-ref-tax-note">
                ${hi ? `आप बचा रहे हैं ₹${p.save_amount} | सभी कर सम्मिलित` : `You save ₹${p.save_amount} | Inclusive of all taxes`}
              </div>
            </div>

            <!-- Stock status -->
            <div class="pr-ref-stock-status">
              <span>●</span> ${hi ? 'स्टॉक में उपलब्ध (शीघ्र डिलीवरी)' : 'In Stock'}
            </div>

            <!-- Quantity Selector -->
            <div class="pr-ref-qty-row">
              <span class="pr-ref-qty-label">${hi ? 'मात्रा:' : 'Quantity'}</span>
              <div class="pr-ref-qty-control">
                <button type="button" class="pr-ref-qty-btn" id="pr-qty-dec">-</button>
                <span class="pr-ref-qty-val" id="pr-qty-val">${this.quantity}</span>
                <button type="button" class="pr-ref-qty-btn" id="pr-qty-inc">+</button>
              </div>
            </div>

            <!-- CTA Actions -->
            <div class="pr-ref-ctas-row">
              <button type="button" class="pr-ref-buy-now" id="pr-buy-now">
                ⚡ ${hi ? 'अभी खरीदें' : 'Buy Now'}
              </button>
              <button type="button" class="pr-ref-add-cart" id="pr-add-cart">
                🛒 ${hi ? 'कार्ट में जोड़ें' : 'Add to Cart'}
              </button>
            </div>

            <!-- Pincode Checker -->
            <div class="pr-ref-pincode-box">
              <span style="font-size:16px;">🚚</span>
              <span style="font-size:12.5px; font-weight:700; color:#2D0810;">${hi ? 'डिलीवरी जांचें' : 'Check Delivery'}</span>
              <input type="text" class="pr-ref-pincode-input" placeholder="${hi ? 'पिनकोड दर्ज करें' : 'Enter pincode'}" maxlength="6" id="pr-pincode-input" />
              <button type="button" class="pr-ref-pincode-btn" id="pr-pincode-btn">${hi ? 'जांचें' : 'Check'}</button>
            </div>

            <!-- 4 Trust Tiles -->
            <div class="pr-ref-trust-grid">
              <div class="pr-ref-trust-tile">
                <span class="pr-ref-trust-icon">🚚</span>
                <div>
                  <strong>${hi ? 'मुफ्त शिपिंग' : 'Free Shipping'}</strong>
                  <small>${hi ? '₹999 से अधिक के ऑर्डर पर' : 'On orders above ₹999'}</small>
                </div>
              </div>
              <div class="pr-ref-trust-tile">
                <span class="pr-ref-trust-icon">🔄</span>
                <div>
                  <strong>${hi ? 'आसान रिटर्न' : 'Easy Returns'}</strong>
                  <small>${hi ? '7 दिनों की वापसी नीति' : '7 days return policy'}</small>
                </div>
              </div>
              <div class="pr-ref-trust-tile">
                <span class="pr-ref-trust-icon">🛡</span>
                <div>
                  <strong>${hi ? 'सुरक्षित भुगतान' : 'Secure Payment'}</strong>
                  <small>${hi ? '100% सुरक्षित एवं एन्क्रिप्टेड' : '100% secure & encrypted'}</small>
                </div>
              </div>
              <div class="pr-ref-trust-tile">
                <span class="pr-ref-trust-icon">💵</span>
                <div>
                  <strong>${hi ? 'कैश ऑन डिलीवरी' : 'Cash on Delivery'}</strong>
                  <small>${hi ? 'सभी ऑर्डरों पर उपलब्ध' : 'Available on all orders'}</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Detail Tabs Bar -->
        <nav class="pr-ref-tabs-bar" aria-label="Product Information">
          <button type="button" class="pr-ref-tab-btn ${this.activeTab === 'details' ? 'is-active' : ''}" data-tab="details">
            📋 ${hi ? 'विवरण' : 'Details'}
          </button>
          <button type="button" class="pr-ref-tab-btn ${this.activeTab === 'specs' ? 'is-active' : ''}" data-tab="specs">
            📑 ${hi ? 'विशिष्टताएँ' : 'Specifications'}
          </button>
          <button type="button" class="pr-ref-tab-btn ${this.activeTab === 'cert' ? 'is-active' : ''}" data-tab="cert">
            🏅 ${hi ? 'प्रमाण पत्र' : 'Certificate'}
          </button>
          <button type="button" class="pr-ref-tab-btn ${this.activeTab === 'returns' ? 'is-active' : ''}" data-tab="returns">
            🔄 ${hi ? 'वापसी व रिफंड' : 'Returns & Refunds'}
          </button>
          <button type="button" class="pr-ref-tab-btn ${this.activeTab === 'reviews' ? 'is-active' : ''}" data-tab="reviews">
            ⭐ ${hi ? `समीक्षाएं (${p.reviews_count})` : `Reviews (${p.reviews_count})`}
          </button>
        </nav>

        <!-- Tab Content Card -->
        <div class="pr-ref-tab-card">
          <p class="pr-ref-tab-text">${esc(p.description)}</p>
          <div class="pr-ref-highlight-note">${esc(p.highlight)}</div>
        </div>

        <!-- Before you book (FAQ Accordion) -->
        <section class="pr-ref-faq-section">
          <h2 class="pr-ref-section-title">
            <span>❓</span> ${hi ? 'खरीदने से पूर्व महत्वपूर्ण प्रश्न' : 'Before you book'}
          </h2>
          <div class="pr-ref-faq-list">
            ${p.faqs.map((f, i) => `
              <div class="pr-ref-faq-item ${i === 0 ? 'is-open' : ''}">
                <div class="pr-ref-faq-q">
                  <span>${esc(f.q)}</span>
                  <span>▼</span>
                </div>
                <div class="pr-ref-faq-a">${esc(f.a)}</div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- You may also like Carousel -->
        <section class="pr-ref-related-section">
          <div class="pr-ref-related-head">
            <h2 class="pr-ref-section-title" style="margin:0;">
              <span>🎁</span> ${hi ? 'आपको यह भी पसंद आ सकता है' : 'You may also like'}
            </h2>
            <div style="display:flex; gap:8px;">
              <button type="button" class="pr-ref-nav-arrow" style="position:static; transform:none;" aria-label="Previous">‹</button>
              <button type="button" class="pr-ref-nav-arrow" style="position:static; transform:none;" aria-label="Next">›</button>
            </div>
          </div>
          <div class="pr-ref-related-grid">
            ${p.related.map(r => `
              <div class="pr-ref-rel-card">
                <img src="${r.img}" alt="${esc(r.title)}" class="pr-ref-rel-img" />
                <span style="font-size:10px; font-weight:700; color:#650D24; text-transform:uppercase;">${r.tag}</span>
                <div class="pr-ref-rel-title">${esc(r.title)}</div>
                <div style="font-size:11.5px; color:#B45309; font-weight:700; margin-bottom:4px;">★ ${r.rating}</div>
                <div style="font-size:14px; font-weight:800; color:#2D0810; margin-top:auto;">
                  ₹${r.price.toLocaleString('en-IN')} <span style="font-size:11px; color:#9CA3AF; text-decoration:line-through;">₹${r.orig_price}</span>
                </div>
                <button type="button" class="pr-ref-rel-btn" data-cart-id="${r.id}">
                  🛒 ${hi ? 'कार्ट में जोड़ें' : 'Add to Cart'}
                </button>
              </div>
            `).join('')}
          </div>
        </section>
      </div>
    `;

    this.bindEvents();
  }

  static bindEvents() {
    if (!this.root) return;

    // Gallery Thumbnails
    this.root.querySelectorAll('[data-thumb-idx]').forEach(th => {
      th.addEventListener('click', () => {
        const idx = parseInt(th.dataset.thumbIdx, 10);
        if (!isNaN(idx) && this.productData.photos[idx]) {
          this.activeImageIndex = idx;
          const img = this.root.querySelector('#pr-main-photo');
          if (img) img.src = this.productData.photos[idx];
          this.root.querySelectorAll('.pr-ref-thumb').forEach((t, i) => t.classList.toggle('is-active', i === idx));
        }
      });
    });

    // Gallery Arrows
    const prevBtn = this.root.querySelector('#pr-prev-img');
    const nextBtn = this.root.querySelector('#pr-next-img');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const total = this.productData.photos.length;
        this.activeImageIndex = (this.activeImageIndex - 1 + total) % total;
        this.root.querySelector('#pr-main-photo').src = this.productData.photos[this.activeImageIndex];
        this.root.querySelectorAll('.pr-ref-thumb').forEach((t, i) => t.classList.toggle('is-active', i === this.activeImageIndex));
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const total = this.productData.photos.length;
        this.activeImageIndex = (this.activeImageIndex + 1) % total;
        this.root.querySelector('#pr-main-photo').src = this.productData.photos[this.activeImageIndex];
        this.root.querySelectorAll('.pr-ref-thumb').forEach((t, i) => t.classList.toggle('is-active', i === this.activeImageIndex));
      });
    }

    // Wishlist Toggle
    const wishBtn = this.root.querySelector('#pr-wish-btn');
    if (wishBtn) {
      wishBtn.addEventListener('click', () => {
        CartStore.toggleWish(this.productData.id);
        const on = CartStore.isWished(this.productData.id);
        wishBtn.classList.toggle('is-on', on);
        wishBtn.innerHTML = on ? '♥' : '♡';
        toast(on
          ? (currentLang() === 'hi' ? 'विशलिस्ट में जोड़ा गया' : 'Added to Wishlist')
          : (currentLang() === 'hi' ? 'विशलिस्ट से हटाया गया' : 'Removed from Wishlist'), 'info');
      });
    }

    // Quantity Inc / Dec
    const decBtn = this.root.querySelector('#pr-qty-dec');
    const incBtn = this.root.querySelector('#pr-qty-inc');
    const qtyVal = this.root.querySelector('#pr-qty-val');
    if (decBtn && incBtn && qtyVal) {
      decBtn.addEventListener('click', () => {
        if (this.quantity > 1) {
          this.quantity--;
          qtyVal.textContent = this.quantity;
        }
      });
      incBtn.addEventListener('click', () => {
        if (this.quantity < 10) {
          this.quantity++;
          qtyVal.textContent = this.quantity;
        }
      });
    }

    // Add to Cart
    const addCartBtn = this.root.querySelector('#pr-add-cart');
    if (addCartBtn) {
      addCartBtn.addEventListener('click', () => {
        CartStore.add(this.productData.id, this.quantity, {}, 10);
        toast(currentLang() === 'hi'
          ? `${this.productData.title} (${this.quantity}) कार्ट में जोड़ा गया!`
          : `${this.productData.title} (${this.quantity}) added to Cart!`, 'success');
      });
    }

    // Buy Now
    const buyNowBtn = this.root.querySelector('#pr-buy-now');
    if (buyNowBtn) {
      buyNowBtn.addEventListener('click', () => {
        CartStore.add(this.productData.id, this.quantity, {}, 10);
        window.CartDrawer?.open?.();
      });
    }

    // Pincode Check
    const pinBtn = this.root.querySelector('#pr-pincode-btn');
    const pinInput = this.root.querySelector('#pr-pincode-input');
    if (pinBtn && pinInput) {
      pinBtn.addEventListener('click', () => {
        const val = pinInput.value.trim();
        if (/^\d{6}$/.test(val)) {
          toast(currentLang() === 'hi' ? `पिनकोड ${val} पर 3-4 दिनों में डिलीवरी उपलब्ध है` : `Delivery available to ${val} within 3-4 days`, 'success');
        } else {
          toast(currentLang() === 'hi' ? 'कृपया मान्य 6-अंकों का पिनकोड दर्ज करें' : 'Please enter a valid 6-digit pincode', 'error');
        }
      });
    }

    // FAQ Accordion click
    this.root.querySelectorAll('.pr-ref-faq-q').forEach(q => {
      q.addEventListener('click', () => {
        const it = q.closest('.pr-ref-faq-item');
        if (it) it.classList.toggle('is-open');
      });
    });

    // Related cards Add to Cart
    this.root.querySelectorAll('[data-cart-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.cartId;
        CartStore.add(id, 1, {}, 10);
        toast(currentLang() === 'hi' ? 'कार्ट में जोड़ा गया!' : 'Added to Cart!', 'success');
      });
    });
  }
}

if (typeof window !== 'undefined') {
  window.ProductPageComponent = ProductPageComponent;
}
