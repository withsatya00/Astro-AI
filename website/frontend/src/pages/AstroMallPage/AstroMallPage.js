// Astro Mall Listing Page - 1:1 Blueprint Reference Match to Image 7 (media_1793433116910_5dfd5de9.jpg)
import { loadTemplate } from '../../utils/templateLoader.js';
import { esc, money, toast, api, mediaUrl, t, goTo } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';
import { CartStore } from '../../utils/cart-store.js';
import { CartDrawer } from '../../components/shop/CartDrawer.js';

export const REFERENCE_PRODUCTS = [
  {
    id: 'prod-rudraksha-5mukhi',
    title: 'Sacred 5 Mukhi Rudraksha Mala (108 Beads)',
    title_hi: 'पवित्र 5 मुखी रुद्राक्ष माला (108 मनके)',
    category: 'Mala',
    category_id: 'mala',
    tag: 'Bestseller',
    tag_class: '',
    rating: 4.8,
    reviews: '1,240',
    price: 699,
    original_price: 999,
    discount_percent: 30,
    image: '/assets/img/products/rudraksha-5.jpg',
    in_stock: true
  },
  {
    id: 'prod-kamal-gatta',
    title: '108 Lotus Seeds (Kamal Gatta) for Maha Puja',
    title_hi: 'कमलगट्टा माला (108 कमल बीज)',
    category: 'Puja Item',
    category_id: 'puja_essentials',
    tag: 'Trending',
    tag_class: 'tag-trending',
    rating: 4.7,
    reviews: '892',
    price: 299,
    original_price: 399,
    discount_percent: 25,
    image: '/assets/img/products/kamalgatta-mala.jpg',
    in_stock: true
  },
  {
    id: 'prod-rudraksha-beads',
    title: 'Natural 5–7 Mukhi Rudraksha Beads (Panchmukhi Set)',
    title_hi: 'प्राकृतिक पंचमुखी रुद्राक्ष दाने सेट',
    category: 'Rudraksha',
    category_id: 'rudraksha',
    tag: 'Bestseller',
    tag_class: '',
    rating: 4.8,
    reviews: '1,756',
    price: 1199,
    original_price: 1599,
    discount_percent: 25,
    image: '/assets/img/products/rudraksha-7.jpg',
    in_stock: true
  },
  {
    id: 'prod-navgrah-dhoop',
    title: 'Vedic Navgrah Dhoop Muskan Kit (11 Herbs)',
    title_hi: 'वैदिक नवग्रह धूप मुस्कान किट (11 दुर्लभ जड़ी-बूटियाँ)',
    category: 'Hawan & Dhoop',
    category_id: 'puja_essentials',
    tag: 'Handpicked',
    tag_class: 'tag-handpicked',
    rating: 4.7,
    reviews: '624',
    price: 399,
    original_price: 599,
    discount_percent: 33,
    image: '/assets/img/products/hawan-kit.jpg',
    in_stock: true
  },
  {
    id: 'prod-vastu-yantra',
    title: 'Siddh Maina Draw – Vastu & Yantra (For Peace & Prosperity)',
    title_hi: 'सिद्ध मैना द्रोह वास्तु यंत्र (सुख-शांति व समृद्धि)',
    category: 'Yantra',
    category_id: 'yantra',
    tag: 'Trending',
    tag_class: 'tag-trending',
    rating: 4.9,
    reviews: '482',
    price: 1899,
    original_price: 2499,
    discount_percent: 24,
    image: '/assets/img/products/vyapar-yantra.jpg',
    in_stock: true
  },
  {
    id: 'prod-hanuman-kavach',
    title: 'Panchmukhi Hanuman Kavach Pendant (Pure Metal)',
    title_hi: 'पंचमुखी हनुमान कवच लॉकेट (शुद्ध धातु)',
    category: 'Idol',
    category_id: 'idols',
    tag: 'Bestseller',
    tag_class: '',
    rating: 4.8,
    reviews: '917',
    price: 799,
    original_price: 1099,
    discount_percent: 27,
    image: '/assets/img/products/hanuman-locket.jpg',
    in_stock: true
  },
  {
    id: 'prod-tulsi-rudraksha',
    title: '100 Beads Tulsi & Rudraksha Mala (Energized)',
    title_hi: '100 मनके तुलसी व रुद्राक्ष संयुक्त माला (अभिमंत्रित)',
    category: 'Puja Essentials',
    category_id: 'puja_essentials',
    tag: 'Handpicked',
    tag_class: 'tag-handpicked',
    rating: 4.7,
    reviews: '368',
    price: 899,
    original_price: 1299,
    discount_percent: 31,
    image: '/assets/img/products/sphatik-mala.jpg',
    in_stock: true
  },
  {
    id: 'prod-shree-yantra',
    title: 'Siddh Shree Yantra (Copper) for Wealth & Success',
    title_hi: 'सिद्ध श्री यंत्र (ताम्र पत्र - धन व कार्य सिद्धि)',
    category: 'Yantra',
    category_id: 'yantra',
    tag: 'Bestseller',
    tag_class: '',
    rating: 4.9,
    reviews: '2,103',
    price: 999,
    original_price: 1499,
    discount_percent: 33,
    image: '/assets/img/products/kuber-yantra.jpg',
    in_stock: true
  },
  {
    id: 'prod-tulsi-mala-108',
    title: 'Original Tulsi Mala (Rosary – 108 Beads)',
    title_hi: 'ओरिजिनल तुलसी माला (108 मनके)',
    category: 'Mala',
    category_id: 'mala',
    tag: 'Handpicked',
    tag_class: 'tag-handpicked',
    rating: 4.8,
    reviews: '1,347',
    price: 399,
    original_price: 599,
    discount_percent: 33,
    image: '/assets/img/products/tulsi-mala.jpg',
    in_stock: true
  },
  {
    id: 'prod-narmadeshwar-shivling',
    title: 'Siddh Narmadeshwar Shivling (For Mercury & Peace)',
    title_hi: 'सिद्ध नर्मदेश्वर पारद शिवलिंग',
    category: 'Shivling',
    category_id: 'idols',
    tag: 'Trending',
    tag_class: 'tag-trending',
    rating: 4.8,
    reviews: '896',
    price: 2499,
    original_price: 3499,
    discount_percent: 29,
    image: '/assets/img/products/parad-shivling.jpg',
    in_stock: true
  },
  {
    id: 'prod-dakshinavarti-shankh',
    title: 'Natural Dakshinavarti Shankh (Right-Handed)',
    title_hi: 'प्राकृतिक दक्षिणावर्ती शंख',
    category: 'Shankh',
    category_id: 'puja_essentials',
    tag: 'Bestseller',
    tag_class: '',
    rating: 4.9,
    reviews: '764',
    price: 1499,
    original_price: 2099,
    discount_percent: 29,
    image: '/assets/img/products/shankh.jpg',
    in_stock: true
  },
  {
    id: 'prod-emerald-gemstone',
    title: 'Natural Columbian Emerald (Panna – 4.25 Ratti)',
    title_hi: 'प्राकृतिक पन्ना रत्न (4.25 रत्ती)',
    category: 'Gemstone',
    category_id: 'gemstones',
    tag: 'Handpicked',
    tag_class: 'tag-handpicked',
    rating: 4.7,
    reviews: '295',
    price: 5299,
    original_price: 6999,
    discount_percent: 24,
    image: '/assets/img/products/emerald.jpg',
    in_stock: true
  }
];

export class AstroMallPageComponent {
  static templatePath = '/src/pages/AstroMallPage/AstroMallPage.html';
  static root = null;
  static productsData = REFERENCE_PRODUCTS;
  static activeCategory = 'all';
  static searchQuery = '';
  static sortBy = 'popular';
  static inStockOnly = false;

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return null;
    target.innerHTML = await loadTemplate(this.templatePath);
    this.root = target;
    CartDrawer.mount();
    window.addEventListener('astro:languagechange', () => {
      if (this.root && this.root.offsetParent !== null) this.render();
    });
    await CartStore.init();
    this.render();
    return target;
  }

  static getFilteredProducts() {
    return this.productsData.filter(p => {
      if (this.activeCategory !== 'all') {
        if (this.activeCategory === 'rudraksha' && p.category_id !== 'rudraksha' && !p.title.toLowerCase().includes('rudraksha')) return false;
        if (this.activeCategory === 'mala' && p.category_id !== 'mala' && !p.title.toLowerCase().includes('mala')) return false;
        if (this.activeCategory === 'yantra' && p.category_id !== 'yantra' && !p.title.toLowerCase().includes('yantra')) return false;
        if (this.activeCategory === 'gemstones' && p.category_id !== 'gemstones') return false;
        if (this.activeCategory === 'puja_essentials' && p.category_id !== 'puja_essentials') return false;
        if (this.activeCategory === 'idols' && p.category_id !== 'idols') return false;
      }
      if (this.inStockOnly && !p.in_stock) return false;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      }
      return true;
    });
  }

  static render() {
    const container = document.getElementById('mall-main-container');
    if (!container) return;

    const hi = currentLang() === 'hi';
    const list = this.getFilteredProducts();

    const categoryChips = [
      { id: 'all', label: hi ? 'सभी उत्पाद' : 'All Products' },
      { id: 'rudraksha', label: hi ? 'रुद्राक्ष' : 'Rudraksha' },
      { id: 'mala', label: hi ? 'माला' : 'Mala' },
      { id: 'yantra', label: hi ? 'यंत्र व वास्तु' : 'Yantra & Vastu' },
      { id: 'gemstones', label: hi ? 'रत्न व उपरत्न' : 'Gemstones' },
      { id: 'puja_essentials', label: hi ? 'पूजा सामग्री' : 'Puja Essentials' },
      { id: 'idols', label: hi ? 'मूर्तियां' : 'Idols' },
      { id: 'prasad', label: hi ? 'प्रसाद' : 'Prasad' },
      { id: 'other', label: hi ? 'अन्य सामग्री' : 'Other Items' }
    ];

    container.innerHTML = `
      <!-- Hero Banner (Unified Chadhava Blueprint) -->
      <section class="service-banner service-banner--mall ml-ref-hero">
        <figure class="service-banner__art">
          <img src="/assets/img/mall-banner.webp" alt="Vedic Astro Mall Altar" fetchpriority="high" />
          <figcaption>${esc(hi ? 'प्रतीकात्मक चित्र' : 'Illustrative image')}</figcaption>
        </figure>
        <div class="mandir-hero__copy service-banner__copy">
          <p class="mandir-hero__eyebrow">
            ${hi ? 'आपकी आध्यात्मिक यात्रा हेतु प्रामाणिक सामग्री' : 'AUTHENTIC VEDIC ITEMS FOR YOUR SPIRITUAL JOURNEY'}
          </p>
          <h1>
            ${hi ? 'वैदिक एस्ट्रो <em>मॉल</em>' : 'Vedic Astro <em>Mall</em>'}
          </h1>
          <p>
            ${hi
              ? 'अनुभवी वैदिक आचार्यों द्वारा प्राण-प्रतिष्ठित एवं सिद्ध की गई आध्यात्मिक सामग्रियों का पावन संग्रह। सुख, शांति व समृद्धि हेतु घर बैठे मंगाएं।'
              : 'Discover a curated collection of Vedic and spiritual essentials, handpicked by experts and energized as per traditional rituals to bring positivity and balance.'}
          </p>
          <div class="shop-hero__actions">
            <a href="#ml-search-input" class="shop-btn shop-btn--gold" data-scroll="#ml-search-input">${hi ? 'उत्पाद खोजें' : 'Explore Products'} &rarr;</a>
            <button type="button" class="shop-btn shop-btn--ghost" onclick="window.CartDrawer && window.CartDrawer.open ? window.CartDrawer.open() : null">🛒 ${hi ? 'मेरी टोकरी' : 'My Cart'}</button>
          </div>
        </div>
        <div class="shop-trust service-benefits">
          <div><span>🛡️</span><p><b>${hi ? '100% प्रामाणिक' : '100% Authentic'}</b><small>${hi ? 'अभिमंत्रित सामग्री' : 'Energized as per Vedic rites'}</small></p></div>
          <div><span>⚡</span><p><b>${hi ? 'शास्त्रोक्त सिद्ध' : 'Vedic Energized'}</b><small>${hi ? 'विद्वानों द्वारा पूजित' : 'Blessed by Vedic priests'}</small></p></div>
          <div><span>🚚</span><p><b>${hi ? 'सुरक्षित डिलीवरी' : 'Pan-India Delivery'}</b><small>${hi ? 'सुरक्षित पैकेजिंग' : 'Safe & quick shipping'}</small></p></div>
        </div>
      </section>

      <!-- Category Filter Chips -->
      <nav class="ml-ref-chips-bar" aria-label="Product Categories">
        ${categoryChips.map(c => `
          <button type="button" class="ml-ref-chip ${this.activeCategory === c.id ? 'is-active' : ''}" data-cat="${c.id}">
            ${esc(c.label)}
          </button>
        `).join('')}
      </nav>

      <!-- Search & Filter Toolbar -->
      <div class="ml-ref-toolbar">
        <div class="ml-ref-search-wrap">
          <span class="ml-ref-search-icon">🔍</span>
          <input
            type="search"
            id="ml-search-input"
            class="ml-ref-search-input"
            placeholder="${hi ? 'उत्पाद खोजें (जैसे रुद्राक्ष, यंत्र, माला...)' : 'Search products (e.g. Rudraksha, Yantra...)'}"
            value="${esc(this.searchQuery)}"
            autocomplete="off"
          />
        </div>
        <select id="ml-cat-select" class="ml-ref-select" aria-label="Select Category">
          <option value="all">${hi ? 'सभी श्रेणियां' : 'All Categories'}</option>
          <option value="rudraksha">${hi ? 'रुद्राक्ष' : 'Rudraksha'}</option>
          <option value="mala">${hi ? 'माला' : 'Mala'}</option>
          <option value="yantra">${hi ? 'यंत्र' : 'Yantra'}</option>
          <option value="gemstones">${hi ? 'रत्न' : 'Gemstones'}</option>
        </select>
        <select id="ml-sort-select" class="ml-ref-select" aria-label="Sort By">
          <option value="popular">${hi ? 'क्रमबद्ध: लोकप्रियता' : 'Sort by: Popularity'}</option>
          <option value="price_asc">${hi ? 'मूल्य: कम से ज्यादा' : 'Price: Low to High'}</option>
          <option value="price_desc">${hi ? 'मूल्य: ज्यादा से कम' : 'Price: High to Low'}</option>
        </select>
        <label class="ml-ref-checkbox-label">
          <input type="checkbox" id="ml-stock-check" ${this.inStockOnly ? 'checked' : ''} />
          <span>${hi ? 'केवल स्टॉक में उपलब्ध' : 'In Stock Only'}</span>
        </label>
      </div>

      <!-- 4-Column Product Grid -->
      <div class="ml-ref-products-grid">
        ${list.map(p => {
          const wished = CartStore.isWished(p.id);
          const pTitle = hi ? p.title_hi : p.title;
          const url = `/astro-mall/product/${p.id}`;
          return `
            <article class="ml-ref-product-card" data-prod-id="${p.id}">
              <div class="ml-ref-card-media">
                <a href="${url}">
                  <img src="${p.image}" alt="${esc(pTitle)}" class="ml-ref-card-img" loading="lazy" />
                </a>
                <span class="ml-ref-card-tag ${p.tag_class}">${p.tag}</span>
                <button type="button" class="ml-ref-card-heart ${wished ? 'is-on' : ''}" data-wish-id="${p.id}" aria-label="Wishlist">
                  ${wished ? '♥' : '♡'}
                </button>
              </div>
              <div class="ml-ref-card-cat">🕉 ${esc(p.category)}</div>
              <h3 class="ml-ref-card-title">
                <a href="${url}" style="text-decoration:none; color:inherit;">${esc(pTitle)}</a>
              </h3>
              <div class="ml-ref-card-rating">
                <strong>★ ${p.rating}</strong>
                <span>(${p.reviews} reviews)</span>
              </div>
              <div class="ml-ref-card-price-row">
                <span class="ml-ref-price-main">₹${p.price.toLocaleString('en-IN')}</span>
                <span class="ml-ref-price-orig">₹${p.original_price.toLocaleString('en-IN')}</span>
                <span class="ml-ref-price-off">${p.discount_percent}% OFF</span>
              </div>
              <button type="button" class="ml-ref-cart-btn" data-cart-id="${p.id}">
                🛒 ${hi ? 'कार्ट में जोड़ें' : 'Add to Cart'}
              </button>
            </article>
          `;
        }).join('')}
      </div>

      <!-- Pagination -->
      <div class="ml-ref-pagination">
        <button type="button" class="ml-ref-page-btn" aria-label="Previous Page">‹</button>
        <button type="button" class="ml-ref-page-btn is-active">1</button>
        <button type="button" class="ml-ref-page-btn">2</button>
        <button type="button" class="ml-ref-page-btn">3</button>
        <button type="button" class="ml-ref-page-btn">4</button>
        <button type="button" class="ml-ref-page-btn">5</button>
        <span>...</span>
        <button type="button" class="ml-ref-page-btn">12</button>
        <button type="button" class="ml-ref-page-btn" aria-label="Next Page">›</button>
      </div>

      <!-- Recently Viewed Section -->
      <section class="ml-ref-recent-section">
        <div class="ml-ref-recent-head">
          <div>
            <h3 class="ml-ref-recent-title">
              <span>⏱</span> ${hi ? 'हाल ही में देखे गए उत्पाद' : 'Recently Viewed'}
            </h3>
            <span class="ml-ref-recent-sub">
              ${hi ? 'आपके द्वारा हाल में पसंद किए गए पवित्र उत्पाद' : 'Revisit the products you explored recently.'}
            </span>
          </div>
          <a href="/mall" style="color:#650D24; font-size:12.5px; font-weight:700; text-decoration:none;">
            ${hi ? 'सभी देखें ➔' : 'View All ➔'}
          </a>
        </div>
        <div class="ml-ref-recent-grid">
          ${this.productsData.slice(0, 4).map(p => `
            <a href="/astro-mall/product/${p.id}" class="ml-ref-recent-mini">
              <img src="${p.image}" alt="${esc(p.title)}" class="ml-ref-recent-img" />
              <div>
                <div class="ml-ref-recent-name">${esc(hi ? p.title_hi : p.title)}</div>
                <div class="ml-ref-recent-price">₹${p.price.toLocaleString('en-IN')}</div>
              </div>
            </a>
          `).join('')}
        </div>
      </section>
    `;

    this.bindEvents();
  }

  static bindEvents() {
    const container = document.getElementById('mall-main-container');
    if (!container) return;

    // Category chips click
    container.querySelectorAll('.ml-ref-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeCategory = btn.dataset.cat;
        this.render();
      });
    });

    // Search input
    const searchInput = container.querySelector('#ml-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        // Re-render grid without losing search focus
        const list = this.getFilteredProducts();
        const grid = container.querySelector('.ml-ref-products-grid');
        if (grid) {
          const hi = currentLang() === 'hi';
          grid.innerHTML = list.map(p => {
            const wished = CartStore.isWished(p.id);
            const pTitle = hi ? p.title_hi : p.title;
            const url = `/astro-mall/product/${p.id}`;
            return `
              <article class="ml-ref-product-card" data-prod-id="${p.id}">
                <div class="ml-ref-card-media">
                  <a href="${url}"><img src="${p.image}" alt="${esc(pTitle)}" class="ml-ref-card-img" loading="lazy" /></a>
                  <span class="ml-ref-card-tag ${p.tag_class}">${p.tag}</span>
                  <button type="button" class="ml-ref-card-heart ${wished ? 'is-on' : ''}" data-wish-id="${p.id}" aria-label="Wishlist">${wished ? '♥' : '♡'}</button>
                </div>
                <div class="ml-ref-card-cat">🕉 ${esc(p.category)}</div>
                <h3 class="ml-ref-card-title"><a href="${url}" style="text-decoration:none; color:inherit;">${esc(pTitle)}</a></h3>
                <div class="ml-ref-card-rating"><strong>★ ${p.rating}</strong><span>(${p.reviews} reviews)</span></div>
                <div class="ml-ref-card-price-row">
                  <span class="ml-ref-price-main">₹${p.price.toLocaleString('en-IN')}</span>
                  <span class="ml-ref-price-orig">₹${p.original_price.toLocaleString('en-IN')}</span>
                  <span class="ml-ref-price-off">${p.discount_percent}% OFF</span>
                </div>
                <button type="button" class="ml-ref-cart-btn" data-cart-id="${p.id}">🛒 ${hi ? 'कार्ट में जोड़ें' : 'Add to Cart'}</button>
              </article>
            `;
          }).join('');
        }
      });
    }

    // In Stock filter
    const stockCheck = container.querySelector('#ml-stock-check');
    if (stockCheck) {
      stockCheck.addEventListener('change', (e) => {
        this.inStockOnly = e.target.checked;
        this.render();
      });
    }

    // Add to Cart Buttons
    container.querySelectorAll('[data-cart-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.cartId;
        const p = this.productsData.find(x => x.id === id);
        if (p) {
          CartStore.add(id, 1, {}, 10);
          toast(currentLang() === 'hi' ? `${p.title_hi || p.title} कार्ट में जोड़ा गया!` : `${p.title} added to Cart!`, 'success');
        }
      });
    });

    // Wishlist Toggle Buttons
    container.querySelectorAll('[data-wish-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.wishId;
        CartStore.toggleWish(id);
        const on = CartStore.isWished(id);
        btn.classList.toggle('is-on', on);
        btn.innerHTML = on ? '♥' : '♡';
        toast(on
          ? (currentLang() === 'hi' ? 'विशलिस्ट में जोड़ा गया' : 'Added to Wishlist')
          : (currentLang() === 'hi' ? 'विशलिस्ट से हटाया गया' : 'Removed from Wishlist'), 'info');
      });
    });
  }
}

if (typeof window !== 'undefined') {
  window.AstroMallPageComponent = AstroMallPageComponent;
}
