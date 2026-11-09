document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.foodcourt__nav .nav__tab');
  const contents = document.querySelectorAll('.foodcourt__content');
  const swiperInstances = [];

  const currentPageId = document.body.id;

  // 페이지별 '뒤로 가기' 목적지 매핑 테이블 (현재 파일명 구조에 맞게 설정)
  const backUrlMap = {
    'index-fast-order': 'index-tekeout-select.html',
    'index-tekeout-select': 'index.html',
    'index': '/index.html',
    'index-orderlist': 'index-order.html',
    'index-option-step1': 'index-order.html',
  };

  // 상단 뒤로가기 버튼 동작 제어
  const headerBackBtn = document.getElementById('header-back');
  if (headerBackBtn) {
    headerBackBtn.addEventListener('click', () => {
      if (backUrlMap[currentPageId]) {
        window.location.href = backUrlMap[currentPageId];
      } else {
        window.history.back();
      }
    });
  }

  const setSideOptions = document.querySelectorAll('.fastfood-set-side__option');
  let selectedSetSide =
    localStorage.getItem('option-set-side') ||
    '프렌치프라이';

  const updateSetSideSelection = () => {
    setSideOptions.forEach((option) => {
      const isSelected = option.getAttribute('option-set-side') === selectedSetSide;
      option.classList.toggle('fastfood-set-side__option--selected', isSelected);
      option.setAttribute('aria-checked', String(isSelected));
    });
  };

  setSideOptions.forEach((option) => {
    option.addEventListener('click', () => {
      selectedSetSide = option.getAttribute('option-set-side') || '프렌치프라이';
      localStorage.setItem('option-set-side', selectedSetSide);
      updateSetSideSelection();
    });
  });

  updateSetSideSelection();

  document.getElementById('set-side-back')?.addEventListener('click', () => {
    window.location.href = 'index-order.html';
  });

  document.getElementById('set-side-next')?.addEventListener('click', () => {
    const savedOrderData = JSON.parse(localStorage.getItem('kiosk_order_data') || '{}');
    const setItem = Object.values(savedOrderData).find((item) => item.name.includes('세트'));

    if (setItem) {
      setItem.option = selectedSetSide;
      localStorage.setItem('kiosk_order_data', JSON.stringify(savedOrderData));
    }

    window.location.href = 'index-tekeout-option-step2.html';
  });

  document.querySelectorAll('.fastfood__contents--tekeout .fastfood__btn').forEach((button) => {
    button.addEventListener('click', () => {
      localStorage.setItem('fastFoodOrderType', button.value);
      window.location.href = 'index-order.html';
    });
  });

  document.querySelectorAll('.btn-dine-in, .btn-takeout').forEach((button) => {
    button.addEventListener('click', () => {
      window.location.href = 'index-orderlist-payment-step1.html';
    });
  });

  document.querySelectorAll('.order__btn--back').forEach((button) => {
    button.addEventListener('click', () => {
      window.location.href = 'index-order.html';
    });
  });

  // 첫화면 이동 버튼 처리 (#foodcourt-start)
  const foodcourtStartBtn = document.getElementById('fastfood-start');
  if (foodcourtStartBtn) {
    foodcourtStartBtn.addEventListener('click', () => {
      window.location.href = 'index-tekeout-select.html'; // 주문 화면 파일명으로 이동
    });
  }

  // 1. 각 카테고리 탭 내부 Swiper 독립 초기화
  contents.forEach((content, index) => {
    const swiperEl = content.querySelector('.product-swiper');
    if (swiperEl) {
      const swiper = new Swiper(swiperEl, {
        slidesPerView: 1,
        spaceBetween: 20,
        observer: true,
        observeParents: true,
        pagination: {
          el: content.querySelector('.swiper-pagination'),
          clickable: true,
        },
        navigation: {
          nextEl: content.querySelector('.slider-controls__btn--next'),
          prevEl: content.querySelector('.slider-controls__btn--prev'),
          disabledClass: 'swiper-button-disabled',
        },
      });
      swiperInstances[index] = swiper;
    }
  });

  // 2. 탭의 상품 유형에 따라 메뉴 필터링
  const productCards = document.querySelectorAll('.product-card');
  const filterProducts = (itemType) => {
    productCards.forEach((card) => {
      const cardType = card.getAttribute('item-type');
      card.hidden = !cardType || (itemType !== 'all' && cardType !== itemType);
    });

    contents.forEach((content, index) => {
      content.querySelectorAll('.swiper-slide').forEach((slide) => {
        slide.hidden = !slide.querySelector('.product-card:not([hidden])');
      });

      const hasVisibleProducts = Boolean(content.querySelector('.product-card:not([hidden])'));
      content.classList.toggle('foodcourt__content--active', hasVisibleProducts);

      if (swiperInstances[index]) {
        swiperInstances[index].slideTo(0, 0);
        swiperInstances[index].update();
      }
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((item) => item.classList.remove('nav__tab--active'));
      tab.classList.add('nav__tab--active');
      filterProducts(tab.dataset.itemType || 'all');
    });
  });

  filterProducts(tabs[0]?.dataset.itemType || 'all');

  // ==========================================
  // 3. 장바구니 / 주문 데이터 동적 추가
  // ==========================================
  const STORAGE_KEY = 'kiosk_order_data';

  // 페이지 이동 후에도 주문 데이터를 유지
  let orderData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  const setProduct = Object.values(orderData).find((item) => item.name.includes('세트'));
  if (setProduct) {
    const productName = document.querySelector('.fastfood-set-side__product-name');
    const productPrice = document.querySelector('.fastfood-set-side__product-price');
    if (productName) productName.textContent = setProduct.name;
    if (productPrice) productPrice.textContent = `${setProduct.price.toLocaleString()}원`;
  }

  const orderCountEl = document.querySelector('.order-count');
  const orderTotalEl = document.querySelector('.order-total');
  const orderSubmitBtn = document.querySelector('.order-submit.oder__fastfood');
  const cartClearBtn = document.querySelector('.cart-clear');
  const cartList = document.querySelector('.cart-list');
  const cartItemTemplate = document.getElementById('cart-item-template');

  // 모달 제어용
  const modal = document.getElementById('option-modal');
  const phoneModal = document.getElementById('modal-points-phone');
  const pointsPrompt = document.getElementById('modal-points-prompt');
  const modalCancelBtn = document.getElementById('modal-cancel');
  const modalConfirmBtn = document.getElementById('modal-confirm');
  let selectedProduct = null;

  if (phoneModal instanceof HTMLDialogElement) {
    phoneModal.addEventListener('close', () => {
      document.querySelector('.foodcourt-dimed')?.classList.remove('foodcourt-dimed');
    });
  }

  // 화면 갱신 함수
  function updateOrderUI() {
    let totalCount = 0;
    let totalPrice = 0;

    if (cartList && cartItemTemplate instanceof HTMLTemplateElement) {
      cartList.replaceChildren();

      Object.entries(orderData).forEach(([key, item]) => {
        const row = cartItemTemplate.content.firstElementChild.cloneNode(true);
        const itemName = item.name;
        const displayName =
          item.option && item.option !== '일반' && item.option !== '옵션 선택 안함'
            ? `${itemName} (${item.option})`
            : itemName;

        row.dataset.cartKey = key;
        row.dataset.price = String(item.price);
        row.querySelector('.cart-item-name').textContent = displayName;
        row.querySelector('.cart-quantity-value').value = String(item.count);
        row.querySelector('.cart-item-price').textContent =
          `${(item.price * item.count).toLocaleString()}원`;

        const decreaseButton = row.querySelector('.cart-decrease');
        const decreaseImage = row.querySelector('.cart-minus-image');
        decreaseButton.disabled = item.count <= 1;
        decreaseImage.src = item.count <= 1
          ? '../../shared/images/icon/minus-disabled.png'
          : '../../shared/images/icon/minus.png';
        row.querySelector('.cart-remove').setAttribute('aria-label', `${displayName} 삭제`);
        cartList.append(row);

        totalCount += item.count;
        totalPrice += item.price * item.count;
      });
    } else {
      for (const key in orderData) {
        totalCount += orderData[key].count;
        totalPrice += orderData[key].price * orderData[key].count;
      }
    }

    // 총 갯수 및 총 금액 텍스트 반영
    if (orderCountEl) orderCountEl.textContent = `${totalCount}개`;
    if (orderTotalEl) orderTotalEl.textContent = `${totalPrice.toLocaleString()}원`;

    // 데이터가 있으면 활성화, 없으면 비활성화
    if (totalCount > 0) {
      if (orderSubmitBtn) orderSubmitBtn.removeAttribute('disabled');
      if (cartClearBtn) cartClearBtn.removeAttribute('disabled');
    } else {
      if (orderSubmitBtn) orderSubmitBtn.setAttribute('disabled', 'true');
      if (cartClearBtn) cartClearBtn.setAttribute('disabled', 'true');
    }

    // 스토리지 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orderData));
  }

  if (cartList) {
    cartList.addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest('button') : null;
      const row = button?.closest('.cart-item');
      const cartKey = row?.dataset.cartKey;
      if (!button || !cartKey || !orderData[cartKey]) return;

      if (button.matches('.cart-increase')) {
        orderData[cartKey].count += 1;
      } else if (button.matches('.cart-decrease')) {
        orderData[cartKey].count = Math.max(1, orderData[cartKey].count - 1);
      } else if (button.matches('.cart-remove')) {
        delete orderData[cartKey];
      } else {
        return;
      }

      updateOrderUI();
    });

    cartList.addEventListener('change', (event) => {
      if (!(event.target instanceof HTMLInputElement) || !event.target.matches('.cart-quantity-value')) {
        return;
      }

      const row = event.target.closest('.cart-item');
      const cartKey = row?.dataset.cartKey;
      if (!cartKey || !orderData[cartKey]) return;

      const quantity = Number(event.target.value);
      orderData[cartKey].count = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
      updateOrderUI();
    });
  }

  // 초기 로드 시 UI 동기화
  updateOrderUI();

  // 상품 카드 클릭 시 장바구니에 추가하거나 구성 선택 모달을 연다.
  const optionLabels = document.querySelectorAll('.fastfood-composition-option');
  const optionRadios = document.querySelectorAll("input[name='food-option']");
  const addOrderItem = (name, price) => {
    if (orderData[name]) {
      orderData[name].count += 1;
    } else {
      orderData[name] = { name, option: '일반', price, count: 1 };
    }
    updateOrderUI();
  };

  optionRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      optionLabels.forEach((label) => {
        label.classList.toggle(
          'fastfood-composition-option--selected',
          label.querySelector('input[name="food-option"]')?.checked === true,
        );
      });
    });
  });

  productCards.forEach((card) => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const titleEl = card.querySelector('.product-card__title');
      const priceEl = card.querySelector('.product-card__price');
      const name = card.dataset.name || (titleEl ? titleEl.textContent.trim() : '');
      const priceStr = card.dataset.price || (priceEl ? priceEl.textContent.replace(/[^0-9]/g, '') : '0');
      const price = parseInt(priceStr, 10) || 0;
      if (!name) return;

      if (card.getAttribute('item-type') === 'burger' && modal) {
        selectedProduct = { name, price };
        const defaultOption = modal.querySelector('input[name="food-option"]');
        if (defaultOption) {
          defaultOption.checked = true;
          defaultOption.dispatchEvent(new Event('change', { bubbles: true }));
        }
        modal.style.display = 'flex';
        return;
      }

      addOrderItem(name, price);
    });
  });

  // [취소 버튼] 모달 닫기
  if (modalCancelBtn) {
    modalCancelBtn.addEventListener('click', () => {
      if (modal) modal.style.display = 'none';
      if (phoneModal) {
        phoneModal.style.display = 'none';
        document.querySelector('.foodcourt-dimed')?.classList.remove('foodcourt-dimed');
      }
      selectedProduct = null;
    });
  }

  if (modalConfirmBtn && modal) {
    modalConfirmBtn.addEventListener('click', () => {
      const selectedOption = modal.querySelector('input[name="food-option"]:checked');
      if (!selectedProduct || !(selectedOption instanceof HTMLInputElement)) return;

      const name = selectedOption.dataset.productName;
      const price = Number(selectedOption.dataset.productPrice);
      if (!name || !Number.isFinite(price) || price <= 0) return;

      addOrderItem(name, price);
      modal.style.display = 'none';
      selectedProduct = null;
    });
  }

  if (modalConfirmBtn && phoneModal) {
    modalConfirmBtn.addEventListener('click', () => {
      window.location.href = 'index-orderlist-payment-step2.html';
    });
  }

  const pointsNoBtn = pointsPrompt?.querySelector('.points-no');
  const pointsYesBtn = pointsPrompt?.querySelector('.points-yes');

  if (pointsYesBtn || pointsNoBtn) {
    pointsYesBtn.addEventListener('click', (event) => {
      event.preventDefault();
      const nextPage = pointsYesBtn.dataset.nextPage || 'index-orderlist-payment-step6.html';
      const nextUrl = new URL(nextPage, window.location.href);

      if (
        window.location.pathname.endsWith('/index-orderlist-payment-step9.html') &&
        nextUrl.pathname === '/shared/order-complete.html'
      ) {
        nextUrl.searchParams.set('orderImage', 'red');
      }

      window.location.href = nextUrl.href;
    });

    pointsNoBtn.addEventListener('click', (event) => {
      event.preventDefault();
      const nextPage = pointsYesBtn.dataset.nextPage || 'index-orderlist-payment-step6.html';
      const nextUrl = new URL(nextPage, window.location.href);

      if (
        window.location.pathname.endsWith('/index-orderlist-payment-step9.html') &&
        nextUrl.pathname === '/shared/order-complete.html'
      ) {
        nextUrl.searchParams.set('orderImage', 'red');
      }

      window.location.href = nextUrl.href;
    });
  }

  document.querySelectorAll('.points-confirm').forEach((button) => {
    button.addEventListener('click', () => {
      window.location.href = 'index-orderlist-payment-step9.html';
    });
  });

  // 전체 취소(전체삭제) 버튼 클릭 시 객체 삭제 및 초기화
  if (cartClearBtn) {
    cartClearBtn.addEventListener('click', () => {
      orderData = {};
      localStorage.removeItem(STORAGE_KEY);
      updateOrderUI();
    });
  }

  // 주문하기 버튼 클릭 시 식사 장소 선택 화면으로 이동
  if (orderSubmitBtn) {
    orderSubmitBtn.addEventListener('click', () => {
      if (orderSubmitBtn.hasAttribute('disabled')) return;
      window.location.href = 'index-tekeout-option-step1.html';
    });
  }
});
