const LOW_STOCK_THRESHOLD = 3;

  // --- START: Data Definitions ---
  const bannerSlides = [
    { 
      img: 'Images/winter.png', 
      title: 'Winter Mega Sale!', 
      desc: 'Get 20% OFF on all Audio products. Use code: AUDIO20' 
    },
    { 
      img: 'Images/Shockproof.png', 
      title: 'New Shockproof Cases Available on Shop', 
      desc: 'Premium quality protection for your new phone. Starting at just ₹99.' 
    },
    { 
      img: 'Images/Delivery.png', 
      title: 'Fast Delivery Across India', 
      desc: 'Order today and get your accessories in 7 working days.' 
    }
  ];
  
  const priceRanges = [
    { id: 'r1', min: 0, max: 299, label: '₹0 - ₹299' },
    { id: 'r2', min: 300, max: 599, label: '₹300 - ₹599' },
    { id: 'r3', min: 600, max: 999, label: '₹600 - ₹999' },
    { id: 'r4', min: 1000, max: 9999, label: '₹1000+' }
  ];

  // 🔴🔴 GOOGLE SHEET URL UPDATED 🔴🔴
  const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbwm4V7J3Mjj0IMK_L71o2a4XeySVZbAMExG9Z_XKYLk9Rd1irVxSqKd2oZkFRmml2M/exec';

  let products = [];
  
  const UPI_ID = '8869829525-2@ybl';
  const ADVANCE_PERCENTAGE = 0.30;
  const WHATSAPP_NUMBER = "918869829525";
  const BUSINESS_NAME = encodeURIComponent("AyaanAhmad Mobile");

  const SHIPPING_COST = 50;
  const FREE_SHIPPING_THRESHOLD = 500;
  
  const coupons = {
    "FLAT100": { type: 'flat', value: 100 },
    "SAVE200": { type: 'flat', value: 200, minOrder: 1000 },
    "AUDIO20": { type: 'percent', value: 0.20, category: 'Audio' }
  };
  // --- END: Data Definitions ---
  
  let appliedCoupon = null;
  let appliedDiscount = 0;

  // New Categories List
  const categories = ['All', 'Data Cables', 'Audio Buds', 'Neck bands', 'Apple Data Cable', 'Power Adaptor'];
  
  // --- START: Element Selectors ---
  const grid = document.getElementById('product-grid');
  const categoryList = document.getElementById('category-list');
  const cartItems = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('subtotal');
  const cartCount = document.getElementById('cart-count');
  const cartHeaderBtn = document.getElementById('cart-header-btn');
  const orderModal = document.getElementById('order-modal');
  const selectedItem = document.getElementById('selected-item');
  const search = document.getElementById('search');
  const searchResults = document.getElementById('search-results');
  const contactModal = document.getElementById('contact-modal');
  
  const couponInput = document.getElementById('coupon-input');
  const applyCouponBtn = document.getElementById('apply-coupon-btn');
  const discountLine = document.getElementById('discount-line');
  const discountAmountEl = document.getElementById('discount-amount');
  const totalEl = document.getElementById('total');
  
  const shippingLine = document.getElementById('shipping-line');
  const shippingCostEl = document.getElementById('shipping-cost');
  
  const wishlistBtn = document.getElementById('wishlist-header-btn');
  const wishlistCount = document.getElementById('wishlist-count');
  const wishlistModal = document.getElementById('wishlist-modal');
  const wishlistItemsEl = document.getElementById('wishlist-items');
  
  const modalSubtotalEl = document.getElementById('modal-subtotal');
  const modalShippingEl = document.getElementById('modal-shipping');
  const modalTotalEl = document.getElementById('modal-total');
  const modalAdvanceAmountEl = document.getElementById('modal-advance-amount');
  
  const qtyInput = document.getElementById('qty');
  const qtyGroup = document.getElementById('qty-group');
  
  const productModal = document.getElementById('product-modal');
  const productModalMainImg = document.getElementById('product-modal-main-img');
  const productModalThumbnails = document.getElementById('product-modal-thumbnails');
  const productModalTitle = document.getElementById('product-modal-title');
  const productModalPrice = document.getElementById('product-modal-price');
  const productModalDesc = document.getElementById('product-modal-desc');
  const modalAddToCartBtn = document.getElementById('modal-add-to-cart');
  const modalShareBtn = document.getElementById('modal-share-wa');
  
  const sortSelect = document.getElementById('sort-select');
  
  const priceFilterList = document.getElementById('price-filter-list');
  
  const sliderTrack = document.querySelector('.slider-track');
  const sliderDotsContainer = document.querySelector('.slider-dots');
  
  const nameError = document.getElementById('name-error');
  const phoneError = document.getElementById('phone-error');
  const emailError = document.getElementById('email-error');
  const addressError = document.getElementById('address-error');
  const pincodeError = document.getElementById('pincode-error');
  const stateError = document.getElementById('state-error');
  
  const backToTopBtn = document.getElementById('back-to-top-btn');
  const shippingPolicyModal = document.getElementById('shipping-policy-modal');
  const refundPolicyModal = document.getElementById('refund-policy-modal');
  const termsPolicyModal = document.getElementById('terms-policy-modal');
  // --- END: Element Selectors ---
  
  let currentSlide = 0;
  let slideInterval;
  let selectedProduct = null;
  let orderMode = 'single';
  let cart = [];
  let wishlist = [];
  let currentCategory = 'All';

  function setHash(hash) {
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  }

  // --- START: FETCH DATA FROM GOOGLE SHEET (FIXED LOGIC) ---
  async function fetchProductsFromSheet() {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = ''; // Clear existing
    // Add Loading Skeleton
    for(let i=0; i<6; i++) {
        const skel = document.createElement('div');
        skel.className = 'skeleton-card';
        skel.innerHTML = '<div class="skeleton-img"></div><div class="skeleton-info"><div class="skeleton-line title"></div><div class="skeleton-line category"></div><div class="skeleton-line price"></div></div>';
        grid.appendChild(skel);
    }

    try {
      const response = await fetch(SHEET_API_URL);
      const data = await response.json();

      // Data ko sahi format mein convert karna
      products = data.map(item => {
        // Safe keys (lowercase)
        let lowerItem = {};
        Object.keys(item).forEach(k => lowerItem[k.toLowerCase().trim()] = item[k]);

        return {
          id: lowerItem.id,
          title: lowerItem.title,
          category: lowerItem.category,
          // Price Fix: '₹' remove karke number banana
          price: parseInt(String(lowerItem.price).replace(/[^0-9]/g, '')) || 0,
          // Images Fix: Array banana
          images: lowerItem.images ? String(lowerItem.images).split(',').map(s => s.trim()) : ['https://via.placeholder.com/300'], 
          // Description Fix: 'desc' ya 'description' check karna
          description: lowerItem.description || lowerItem.desc || "No description available.",
          stock: Number(lowerItem.stock) || 0,
          rating: Number(lowerItem.rating) || 4.5,
          reviews: Number(lowerItem.reviews) || 10
        };
      });

      // UI Update karna
      renderCategories();
      renderPriceFilters();
      renderProducts(); 
      updateLiveSearch();
      showToast('Inventory Updated!');

    } catch (error) {
      console.error("Error loading data:", error);
      showToast('Failed to load products. Check internet/URL.');
      grid.innerHTML = '<p style="text-align:center; margin-top:20px; color:red;">Unable to load products. Please check Web App URL.</p>';
    }
  }
  // --- END: FETCH DATA FROM GOOGLE SHEET ---

  // --- START: Modal/URL Hash Management ---
  function closeAllModals() {
    orderModal.classList.add('hidden');
    contactModal.classList.add('hidden');
    productModal.classList.add('hidden');
    wishlistModal.classList.add('hidden');
    shippingPolicyModal.classList.add('hidden');
    refundPolicyModal.classList.add('hidden');
    termsPolicyModal.classList.add('hidden');
  }

  function handleHashChange() {
    const hash = window.location.hash;
    closeAllModals();
    
    if (hash.startsWith('#product/')) {
      const id = parseInt(hash.split('/')[1]);
      const product = products.find(p => p.id === id);
      if (product) {
        openProductModal(product);
        productModal.classList.remove('hidden');
      }
    } else if (hash === '#wishlist') {
      openWishlistModal();
      wishlistModal.classList.remove('hidden');
    } else if (hash === '#contact') {
      contactModal.classList.remove('hidden');
    } else if (hash === '#policy-shipping') {
      shippingPolicyModal.classList.remove('hidden');
    } else if (hash === '#policy-refund') {
      refundPolicyModal.classList.remove('hidden');
    } else if (hash === '#policy-terms') {
      termsPolicyModal.classList.remove('hidden');
    }
  }
  // --- END: Modal/URL Hash Management ---
  
  // --- START: Local Storage & Toast ---
  function saveCart() {
    localStorage.setItem('myWebCart', JSON.stringify(cart));
  }

  function loadCart() {
    const savedCart = localStorage.getItem('myWebCart');
    cart = savedCart ? JSON.parse(savedCart) : [];
  }
  
  function saveWishlist() {
    localStorage.setItem('myWebWishlist', JSON.stringify(wishlist));
  }

  function loadWishlist() {
    const savedWishlist = localStorage.getItem('myWebWishlist');
    wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
  }

  function updateWishlistCount() {
    wishlistCount.textContent = wishlist.length;
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }
  // --- END: Local Storage & Toast ---

  // --- START: Slider Logic ---
  function createSlider() {
    sliderTrack.innerHTML = '';
    sliderDotsContainer.innerHTML = '';
    
    bannerSlides.forEach((slide, index) => {
      const slideEl = document.createElement('div');
      slideEl.className = 'slide';
      slideEl.innerHTML = `
        <img src="${slide.img}" alt="${slide.title}">
        <div class="slide-content">
          <h2>${slide.title}</h2>
          <p>${slide.desc}</p>
        </div>
      `;
      sliderTrack.appendChild(slideEl);
      
      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.dataset.index = index;
      if (index === 0) dot.classList.add('active');
      dot.onclick = () => showSlide(index);
      sliderDotsContainer.appendChild(dot);
    });
  }

  function showSlide(index) {
    sliderTrack.style.transform = `translateX(-${index * 100}%)`;
    sliderDotsContainer.querySelectorAll('.dot').forEach(dot => {
      dot.classList.remove('active');
      if (parseInt(dot.dataset.index) === index) {
        dot.classList.add('active');
      }
    });
    currentSlide = index;
  }

  function nextSlide() {
    let newIndex = currentSlide + 1;
    if (newIndex >= bannerSlides.length) {
      newIndex = 0;
    }
    showSlide(newIndex);
  }

  function prevSlide() {
    let newIndex = currentSlide - 1;
    if (newIndex < 0) {
      newIndex = bannerSlides.length - 1;
    }
    showSlide(newIndex);
  }

  function startSlider() {
    slideInterval = setInterval(nextSlide, 5000);
    document.getElementById('next-slide').onclick = () => {
      nextSlide();
      clearInterval(slideInterval);
      slideInterval = setInterval(nextSlide, 5000);
    };
    document.getElementById('prev-slide').onclick = () => {
      prevSlide();
      clearInterval(slideInterval);
      slideInterval = setInterval(nextSlide, 5000);
    };
  }
  // --- END: Slider Logic ---
  
  // --- START: Filtering & Display Logic ---
  function renderPriceFilters() {
    priceFilterList.innerHTML = '';
    priceRanges.forEach(range => {
      const item = document.createElement('label');
      item.className = 'price-filter-item';
      item.innerHTML = `
        <input type="checkbox" value="${range.id}">
        <span>${range.label}</span>
      `;
      item.querySelector('input').onchange = renderProducts;
      priceFilterList.appendChild(item);
    });
  }
  
  function getStarRatingHTML(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    let starsHTML = '';
    
    for(let i = 0; i < fullStars; i++) starsHTML += '★';
    for(let i = 0; i < (halfStar + emptyStars); i++) starsHTML += '☆';
    
    return `<span class="star-rating">${starsHTML}</span>`;
  }

  function renderCategories() {
    categoryList.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.textContent = cat;
      btn.className = cat === currentCategory ? 'active' : '';
      btn.onclick = () => { 
        currentCategory = cat; 
        document.querySelectorAll('#price-filter-list input:checked').forEach(input => input.checked = false);
        renderProducts(); 
        renderCategories(); 
      };
      categoryList.appendChild(btn);
    });
  }

  function renderProducts() {
    const q = search.value.toLowerCase();
    const sortValue = sortSelect.value;
    const selectedPriceRanges = Array.from(document.querySelectorAll('#price-filter-list input:checked')).map(input => input.value);
    
    grid.innerHTML = '';
    
    let filtered = products.filter(p => {
      const categoryMatch = (currentCategory === 'All' || p.category === currentCategory);
      const searchMatch = p.title.toLowerCase().includes(q);
      const priceMatch = (selectedPriceRanges.length === 0) || selectedPriceRanges.some(rangeId => {
        const range = priceRanges.find(r => r.id === rangeId);
        return p.price >= range.min && p.price <= range.max;
      });
      
      return categoryMatch && searchMatch && priceMatch;
    });
    
    if (sortValue === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortValue === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    }
    
    if (filtered.length === 0) {
      if(products.length === 0) {
         // Do nothing, waiting for fetch
      } else {
         grid.innerHTML = '<p>No products found for your selection.</p>';
      }
      return;
    }

    filtered.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product';
      
      const isInWishlist = wishlist.some(i => i.id === p.id);
      
      let stockWarningHTML = '';
      let buttonsHTML = '';

      if (p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD) {
        stockWarningHTML = `<p class="stock-warning">🔥 Only ${p.stock} left in stock!</p>`;
        buttonsHTML = `
          <button class="btn-add" onclick="addToCartWrapper('${p.id}', this)">Add</button>
          <button class="btn-order" onclick="openOrderModalWrapper('${p.id}')">Order</button>
        `;
      } else if (p.stock > 0) {
        buttonsHTML = `
          <button class="btn-add" onclick="addToCartWrapper('${p.id}', this)">Add</button>
          <button class="btn-order" onclick="openOrderModalWrapper('${p.id}')">Order</button>
        `;
      } else {
        card.classList.add('sold-out');
        buttonsHTML = `
          <button class="btn-sold-out" disabled>Sold Out</button>
        `;
      }

      card.innerHTML = `
        <img src="${p.images[0]}" alt="${p.title}" onclick="openProductModalWrapper('${p.id}')">
        <div class="info">
          <h3 onclick="openProductModalWrapper('${p.id}')">${p.title}</h3>
          <div class="rating-container">
            ${getStarRatingHTML(p.rating)}
            <span class="review-count">(${p.reviews})</span>
          </div>
          <p class="category">${p.category}</p>
          <div class="price-line">
            <div class="price">₹${p.price}</div>
            <button class="btn-wishlist ${isInWishlist ? 'active' : ''}" onclick="toggleWishlistWrapper('${p.id}', this)">❤️</button>
          </div>
          ${stockWarningHTML}
          <div class="buttons-container" style="margin-top: ${stockWarningHTML ? '8px' : '10px'};">
            ${buttonsHTML}
          </div>
        </div>`;
      
      grid.appendChild(card);
    });
  }
  
  function updateLiveSearch() {
    const q = search.value.toLowerCase();
    searchResults.innerHTML = '';
    
    if (q.length < 2) {
      searchResults.classList.add('hidden');
      return;
    }
    
    const results = products.filter(p => p.title.toLowerCase().includes(q)).slice(0, 5);
    
    if (results.length === 0) {
      searchResults.classList.add('hidden');
    } else {
      searchResults.classList.remove('hidden');
      results.forEach(p => {
        const item = document.createElement('div');
        item.className = 'search-item';
        item.innerHTML = `
          <img src="${p.images[0]}" alt="${p.title}">
          <div>
            <h5>${p.title}</h5>
            <p>₹${p.price}</p>
          </div>
        `;
        item.onclick = () => {
          setHash('#product/' + p.id);
          search.value = '';
          searchResults.classList.add('hidden');
          renderProducts();
        };
        searchResults.appendChild(item);
      });
    }
  }

  // --- JS Wrappers for HTML onclick ---
  function addToCartWrapper(id, btn) { const p = products.find(x => x.id == id); if(p) addToCart(p, btn); }
  function openOrderModalWrapper(id) { const p = products.find(x => x.id == id); if(p) openOrderModal(p); }
  function openProductModalWrapper(id) { const p = products.find(x => x.id == id); if(p) openProductModal(p); }
  function toggleWishlistWrapper(id, btn) { const p = products.find(x => x.id == id); if(p) toggleWishlist(p, btn); }

  // --- END: Filtering & Display Logic ---
  
  // --- START: Cart & Wishlist Logic ---
  function toggleWishlist(p, btnElement) {
    const existingIndex = wishlist.findIndex(i => i.id === p.id);
    
    if (existingIndex > -1) {
      wishlist.splice(existingIndex, 1);
      btnElement.classList.remove('active');
      showToast(`${p.title} removed from wishlist.`);
    } else {
      wishlist.push(p);
      btnElement.classList.add('active');
      showToast(`${p.title} added to wishlist!`);
    }
    
    saveWishlist();
    updateWishlistCount();
  }

  function openWishlistModal() {
    wishlistItemsEl.innerHTML = '';
    if (wishlist.length === 0) {
      wishlistItemsEl.innerHTML = '<p>Your wishlist is empty.</p>';
    } else {
      wishlist.forEach(p => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'wishlist-item';
        itemDiv.innerHTML = `
          <img src="${p.images[0]}" alt="${p.title}"> <div class="info">
            <h4>${p.title}</h4>
            <p>₹${p.price}</p>
          </div>
          <div class="actions">
            <button class="btn btn-add-cart-wishlist" data-id="${p.id}">🛒 Add to Cart</button>
            <button class="btn btn-remove-wishlist" data-id="${p.id}">Remove</button>
          </div>
        `;
        wishlistItemsEl.appendChild(itemDiv);
      });
      
      wishlistItemsEl.querySelectorAll('.btn-add-cart-wishlist').forEach(btn => {
        btn.onclick = (e) => {
          const id = parseInt(e.target.dataset.id);
          const product = wishlist.find(p => p.id === id);
          if (product) {
            addToCart(product, e.currentTarget);
            wishlist = wishlist.filter(p => p.id !== id);
            saveWishlist();
            updateWishlistCount();
            renderProducts();
            openWishlistModal();
            showToast(`${product.title} moved to cart!`);
          }
        };
      });
      
      wishlistItemsEl.querySelectorAll('.btn-remove-wishlist').forEach(btn => {
        btn.onclick = (e) => {
          const id = parseInt(e.target.dataset.id);
          const product = wishlist.find(p => p.id === id);
          if (product) {
            wishlist = wishlist.filter(p => p.id !== id);
            saveWishlist();
            updateWishlistCount();
            renderProducts();
            openWishlistModal();
            showToast(`${product.title} removed from wishlist.`);
          }
        };
      });
    }
  }

  function addToCart(p, btnElement) {
    const existing = cart.find(i => i.id === p.id);
    
    if (existing) {
      if (existing.qty >= p.stock) {
        showToast("No more stock available!");
        return;
      }
      existing.qty++;
    } else {
      if (p.stock <= 0) {
        showToast("Item is out of stock!");
        return;
      }
      cart.push({...p, qty:1});
    }
    
    if (btnElement && (btnElement.classList.contains('btn-add') || btnElement.id === 'modal-add-to-cart')) {
      let oldText = btnElement.textContent;
      btnElement.textContent = 'Added ✓';
      btnElement.disabled = true;
      setTimeout(() => {
        btnElement.textContent = oldText;
        btnElement.disabled = false;
      }, 2000);
    }
    
    showToast(`${p.title} added to cart!`);
    updateCart();
  }
  
  function increaseQuantity(productId) {
    const item = cart.find(i => i.id == productId);
    const product = products.find(p => p.id == productId);
    if (!item) return;
    
    if (item.qty >= product.stock) {
      showToast("No more stock available!");
      return;
    }
    
    item.qty++;
    updateCart();
  }
  
  function decreaseQuantity(productId) {
    const item = cart.find(i => i.id == productId);
    if (item) {
      item.qty--;
      if (item.qty <= 0) {
        removeFromCart(productId);
      } else {
        updateCart();
      }
    }
  }

  function removeFromCart(productId) {
    cart = cart.filter(item => item.id != productId);
    showToast(`Item removed from cart.`);
    updateCart();
  }

  function updateCart() {
    if (cart.length === 0) {
      cartItems.innerHTML = '<p>Your cart is empty.</p>';
      appliedCoupon = null;
      couponInput.value = '';
    } else {
      cartItems.innerHTML = '';
    }
    
    let subtotal = 0;
    cart.forEach(item => {
      subtotal += item.price * item.qty;
      const div = document.createElement('div');
      div.className = 'cart-item';
      
      div.innerHTML = `
        <span style="flex: 1;">${item.title}</span>
        <div class="cart-qty-controls">
          <button class="btn-qty-decrease">-</button>
          <span>${item.qty}</span>
          <button class="btn-qty-increase">+</button>
        </div>
        <span style="width: 60px; text-align: right; font-weight: 600;">₹${item.price * item.qty}</span>
        <button class="btn-remove" title="Remove item">X</button>
      `;
      
      div.querySelector('.btn-qty-increase').onclick = () => increaseQuantity(item.id);
      div.querySelector('.btn-qty-decrease').onclick = () => decreaseQuantity(item.id);
      div.querySelector('.btn-remove').onclick = () => removeFromCart(item.id);
      
      cartItems.appendChild(div);
    });
    
    let total = subtotal;
    appliedDiscount = 0;
    
    if (appliedCoupon) {
      let valid = true;
      let discount = 0;
      let targetSubtotal = subtotal;
      
      if (appliedCoupon.minOrder && subtotal < appliedCoupon.minOrder) {
        valid = false;
        showToast(`Coupon requires a minimum order of ₹${appliedCoupon.minOrder}.`);
        appliedCoupon = null;
      }
      
      if (valid && appliedCoupon.category) {
        targetSubtotal = cart
          .filter(item => item.category === appliedCoupon.category)
          .reduce((sum, item) => sum + item.price * item.qty, 0);
          
        if (targetSubtotal === 0) {
          valid = false;
          showToast(`Coupon is only valid for ${appliedCoupon.category} items.`);
          appliedCoupon = null;
        }
      }
      
      if (valid) {
        if (appliedCoupon.type === 'percent') {
          discount = targetSubtotal * appliedCoupon.value;
        } else {
          discount = appliedCoupon.value;
        }
        
        if (discount > targetSubtotal) {
          discount = targetSubtotal;
        }
        
        appliedDiscount = discount;
        total = subtotal - appliedDiscount;
        discountLine.classList.remove('hidden');
        discountAmountEl.textContent = Math.round(appliedDiscount);
      } else {
        couponInput.value = '';
        discountLine.classList.add('hidden');
      }
    } else {
      discountLine.classList.add('hidden');
    }
    
    let shippingCost = 0;
    if (cart.length > 0 && total < FREE_SHIPPING_THRESHOLD) {
      shippingCost = SHIPPING_COST;
      shippingLine.classList.remove('hidden');
      shippingLine.classList.remove('free');
      shippingCostEl.textContent = Math.round(shippingCost);
    } else if (cart.length > 0 && total >= FREE_SHIPPING_THRESHOLD) {
      shippingCost = 0;
      shippingLine.classList.remove('hidden');
      shippingLine.classList.add('free');
      shippingCostEl.textContent = "FREE";
    } else {
      shippingLine.classList.add('hidden');
    }
    
    const grandTotal = total + shippingCost;
    
    subtotalEl.textContent = Math.round(subtotal);
    totalEl.textContent = Math.round(grandTotal);
    
    let totalItemsInCart = cart.reduce((total, item) => total + item.qty, 0);
    cartCount.textContent = totalItemsInCart;
    
    saveCart();
  }
  // --- END: Cart & Wishlist Logic ---

  // --- START: Order Modals & Submission ---
  function openOrderModal(p) {
    orderMode = 'single';
    selectedProduct = p;
    
    if (p.stock <= 0) {
      showToast("Sorry, this item is sold out!");
      return;
    }
    
    orderModal.classList.remove('hidden');
    selectedItem.textContent = `Ordering: ${p.title} (₹${p.price})`;
    qtyGroup.style.display = 'block';
    
    function updateModalAdvance() {
        let qty = parseInt(qtyInput.value) || 1;
        if (qty > p.stock) {
          qty = p.stock;
          qtyInput.value = p.stock;
          showToast(`Only ${p.stock} items available in stock.`);
        }
        
        const total = selectedProduct.price * qty;
        let shipping = 0;
        if (total > 0 && total < FREE_SHIPPING_THRESHOLD) {
          shipping = SHIPPING_COST;
        }
        
        const grandTotal = total + shipping;
        const advanceAmount = grandTotal * ADVANCE_PERCENTAGE;

        modalSubtotalEl.textContent = Math.round(total);
        modalShippingEl.textContent = Math.round(shipping);
        modalTotalEl.textContent = Math.round(grandTotal);
        modalAdvanceAmountEl.textContent = Math.round(advanceAmount);
    }
    
    qtyInput.value = 1;
    qtyInput.oninput = updateModalAdvance; 
    updateModalAdvance(); 
  }
  
  function openProductModal(p) {
    const product = products.find(item => item.id === p.id);
    if (!product) return;

    document.getElementById('product-modal-title').innerText = product.title;
    document.getElementById('product-modal-price').innerText = `₹${product.price}`;
    
    // FIX DESCRIPTION KEY
    document.getElementById('product-modal-desc').innerText = product.description;

    document.getElementById('product-modal-main-img').src = product.images[0]; 
    
    const thumbs = document.getElementById('product-modal-thumbnails');
    thumbs.innerHTML = '';
    product.images.forEach((imgSrc, index) => {
      const thumb = document.createElement('img');
      thumb.src = imgSrc;
      thumb.onclick = () => {
        document.getElementById('product-modal-main-img').src = imgSrc;
        thumbs.querySelectorAll('img').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      };
      if (index === 0) thumb.classList.add('active');
      thumbs.appendChild(thumb);
    });
    
    if (product.stock > 0) {
      modalAddToCartBtn.style.display = 'inline-flex';
      modalAddToCartBtn.textContent = '🛒 Add to Cart';
      modalAddToCartBtn.disabled = false;
      modalAddToCartBtn.className = 'btn btn-primary';
      
      modalAddToCartBtn.onclick = (e) => {
        addToCart(product, e.currentTarget);
        modalAddToCartBtn.textContent = 'Added ✓';
        modalAddToCartBtn.disabled = true;
        setTimeout(() => {
          modalAddToCartBtn.textContent = '🛒 Add to Cart';
          modalAddToCartBtn.disabled = false;
        }, 2000);
      };
      
    } else {
      modalAddToCartBtn.style.display = 'inline-flex';
      modalAddToCartBtn.textContent = 'Sold Out';
      modalAddToCartBtn.disabled = true;
      modalAddToCartBtn.className = 'btn btn-sold-out';
      modalAddToCartBtn.onclick = null;
    }

    modalShareBtn.onclick = () => {
      const text = encodeURIComponent(`Check out ${product.title} for ₹${product.price}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    };
    
    document.getElementById('product-modal').classList.remove('hidden');
  }

  function resetErrors() {
    nameError.textContent = '';
    phoneError.textContent = '';
    emailError.textContent = '';
    addressError.textContent = '';
    pincodeError.textContent = '';
    stateError.textContent = '';
  }

  document.getElementById('order-form').onsubmit = (e) => {
    e.preventDefault();
    resetErrors();
    
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const address = document.getElementById('address').value.trim();
    const pincode = document.getElementById('pincode').value.trim();
    const landmark = document.getElementById('landmark').value.trim();
    const state = document.getElementById('state').value.trim();
    
    let isValid = true;
    
    if (!name) { nameError.textContent = "Please enter your full name."; isValid = false; }
    if (!phone) { phoneError.textContent = "Please enter your phone number."; isValid = false; }
    else if (!/^\d{10}$/.test(phone)) { phoneError.textContent = "Please enter a valid 10-digit phone number."; isValid = false; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { emailError.textContent = "Please enter a valid email address."; isValid = false; }
    if (!address) { addressError.textContent = "Please enter your full address."; isValid = false; }
    if (!pincode) { pincodeError.textContent = "Please enter your PINCODE."; isValid = false; }
    else if (!/^\d{6}$/.test(pincode)) { pincodeError.textContent = "Please enter a valid 6-digit PINCODE."; isValid = false; }
    if (!state) { stateError.textContent = "Please select your state."; isValid = false; }
    
    if (!isValid) {
      showToast("Please fix the errors in the form.");
      return;
    }

    let total = 0;
    let subtotal = 0;
    let shipping = 0;
    let discount = 0;
    let orderDetails = '';
    let couponText = '';
    let advanceAmount = 0;
    let balanceDue = 0;
    
    if (orderMode === 'single' && selectedProduct) {
      const qty = parseInt(qtyInput.value) || 1;
      
      if (qty > selectedProduct.stock) {
        showToast(`Only ${selectedProduct.stock} items available. Order failed.`);
        return;
      }
      
      total = selectedProduct.price * qty;
      subtotal = total;
      
      if (total > 0 && total < FREE_SHIPPING_THRESHOLD) {
        shipping = SHIPPING_COST;
      }
      
      orderDetails = `${selectedProduct.title} (x${qty}) - ₹${subtotal}`;
      
      const productInStore = products.find(p => p.id === selectedProduct.id);
      if (productInStore) {
        productInStore.stock -= qty;
      }
      
    } else { // 'cart' mode
      subtotal = parseFloat(subtotalEl.textContent);
      discount = appliedDiscount;
      total = subtotal - discount;
      
      if (!shippingLine.classList.contains('free') && cart.length > 0) {
         shipping = parseFloat(shippingCostEl.textContent);
      }
      
      orderDetails = cart.map(item => {
        return `${item.title} (x${item.qty}) - ₹${item.price * item.qty}`;
      }).join('\n');
      
      if (discount > 0) {
        couponText = `*Discount (${appliedCoupon.code}):* -₹${Math.round(discount)}\n`;
      }
      
      cart.forEach(cartItem => {
        const productInStore = products.find(p => p.id === cartItem.id);
        if (productInStore) {
          productInStore.stock -= cartItem.qty;
        }
      });
      
      cart = [];
      appliedCoupon = null; 
      couponInput.value = '';
    }
    
    const grandTotal = total + shipping;
    
    advanceAmount = grandTotal * ADVANCE_PERCENTAGE;
    balanceDue = grandTotal - advanceAmount;
    
    const finalTotal = Math.round(grandTotal);
    const finalSubtotal = Math.round(subtotal);
    const finalShipping = Math.round(shipping);
    const finalAdvance = Math.round(advanceAmount);
    const finalBalance = Math.round(balanceDue);
    
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=${BUSINESS_NAME}&am=${finalAdvance.toFixed(2)}&cu=INR&tn=Order%20for%20${name.replace(" ", "%20")}`;

    let message = "📦 *New Order Request* 📦\n\n";
    message += `*Name:* ${name}\n`;
    message += `*Customer Phone:* +91${phone}\n`;
    if(email) {
      message += `*Email ID:* ${email}\n`;
    }
    message += `*Address:* ${address}\n`;
    message += `*Pincode:* ${pincode}\n`;
    if(landmark) {
      message += `*Landmark:* ${landmark}\n`;
    }
    message += `*State:* ${state}\n\n`;
    message += "--- *Order Details* ---\n";
    message += `${orderDetails}\n\n`;
    message += "--- *Payment Summary* ---\n";
    message += `*Subtotal:* ₹${finalSubtotal}\n`;
    message += couponText; 
    message += `*Shipping:* ₹${finalShipping}\n`;
    message += `*Grand Total:* *₹${finalTotal}*\n\n`;
    message += "--- *Advance Payment (30%)* ---\n";
    message += `*Advance to Pay:* *₹${finalAdvance}*\n`;
    message += `*Balance Due (on Delivery):* ₹${finalBalance}\n\n`;
    message += "*(Step 1) Click this link to pay advance:*\n";
    message += `${upiLink}\n\n`;
    message += "*(Step 2) Send this message & payment screenshot to confirm.*";

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    window.open(url, '_blank');
    
    showToast('Opening WhatsApp to send order...');
    orderModal.classList.add('hidden');
    e.target.reset();
    
    renderProducts();
    updateCart();
  };
  // --- END: Order Modals & Submission ---
  
  // --- START: Event Listeners & Initialization ---
  
  // 🔴🔴 FIXED 🔴🔴: X Button Logic
  document.getElementById('close-product-modal').onclick = () => {
      productModal.classList.add('hidden'); // Force hide immediately
      setHash(''); // Clear URL hash
  };
  
  productModal.onclick = (e) => {
    if (e.target === productModal) {
      setHash('');
    }
  };
  
  applyCouponBtn.onclick = () => {
    const code = couponInput.value.trim().toUpperCase();
    if (coupons[code]) {
      appliedCoupon = { code, ...coupons[code] };
      updateCart();
    } else {
      appliedCoupon = null;
      showToast("Invalid coupon code.");
      updateCart();
    }
  };

  document.getElementById('close-order-modal').onclick = () => orderModal.classList.add('hidden');
  orderModal.onclick = (e) => {
    if (e.target === orderModal) {
      orderModal.classList.add('hidden');
    }
  };
  
  document.getElementById('close-contact-modal').onclick = () => setHash('');
  contactModal.onclick = (e) => {
    if (e.target === contactModal) {
      setHash('');
    }
  };

  document.getElementById('close-wishlist-modal').onclick = () => setHash('');
  wishlistModal.onclick = (e) => {
    if (e.target === wishlistModal) {
      setHash('');
    }
  };
  
  wishlistBtn.onclick = () => setHash('#wishlist');
  document.getElementById('contact-header-btn').onclick = () => setHash('#contact');
  cartHeaderBtn.onclick = () => {
    document.getElementById('order-btn').click();
  };
  
  function setupPolicyModal(btnId, modalId, hash) {
    const btn = document.getElementById(btnId);
    const modal = document.getElementById(modalId);
    const closeBtn = modal.querySelector('.close-btn');
    
    btn.onclick = () => setHash(hash);
    closeBtn.onclick = () => setHash('');
    modal.onclick = (e) => {
      if (e.target === modal) {
        setHash('');
      }
    };
  }
  setupPolicyModal('shipping-policy-btn', 'shipping-policy-modal', '#policy-shipping');
  setupPolicyModal('refund-policy-btn', 'refund-policy-modal', '#policy-refund');
  setupPolicyModal('terms-policy-btn', 'terms-policy-modal', '#policy-terms');
  
  window.onscroll = () => {
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
      backToTopBtn.style.display = "block";
    } else {
      backToTopBtn.style.display = "none";
    }
  };
  backToTopBtn.onclick = () => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  };
  
  document.getElementById('order-btn').onclick = () => {
    if (cart.length === 0) {
      showToast('Your cart is empty!');
      return;
    }
    orderMode = 'cart';
    selectedProduct = null;
    orderModal.classList.remove('hidden');
    
    const grandTotal = parseFloat(totalEl.textContent);
    const subtotal = parseFloat(subtotalEl.textContent);
    let shipping = 0;
    if (cart.length > 0 && (subtotal - appliedDiscount) < FREE_SHIPPING_THRESHOLD) {
         shipping = SHIPPING_COST;
    }
    
    const advanceAmount = grandTotal * ADVANCE_PERCENTAGE;
    
    selectedItem.textContent = `Ordering ${cart.reduce((count, item) => count + item.qty, 0)} items. Grand Total: ₹${Math.round(grandTotal)}`;
    qtyGroup.style.display = 'none';
    qtyInput.oninput = null; 
    
    modalSubtotalEl.textContent = Math.round(subtotal);
    modalShippingEl.textContent = Math.round(shipping);
    modalTotalEl.textContent = Math.round(grandTotal);
    modalAdvanceAmountEl.textContent = Math.round(advanceAmount);
  };
  
  search.oninput = () => {
    updateLiveSearch();
  };
  
  search.addEventListener('change', renderProducts); 
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      searchResults.classList.add('hidden');
    }
  });
  
  sortSelect.onchange = renderProducts;
  
  document.getElementById('year').textContent = new Date().getFullYear();
  
  // Initializers
  window.addEventListener('hashchange', handleHashChange);
  window.addEventListener('load', () => {
    loadCart();
    loadWishlist();
    createSlider();
    startSlider();
    renderCategories();
    renderPriceFilters();
    
    // 🚀 FETCH DATA WITH LOADING INDICATOR
    fetchProductsFromSheet();
    
    updateCart();
    updateWishlistCount();
    
    setTimeout(handleHashChange, 100);
  });
  // --- END: Event Listeners & Initialization ---