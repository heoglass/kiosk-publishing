document.addEventListener("DOMContentLoaded", function () {
  document.querySelector("#header-back").addEventListener("click", () => {
    const currentScreen = document.querySelector(".cafe-screen:not([hidden])");

    if (!currentScreen) return;

    switch (currentScreen.id) {
      case "category-start-screen":
        window.location.href = "../main/index.html";
        break;

      case "screen-menu":
        showScreen("category-start-screen");
        break;

      case "screen-options":
        activeOptionMenuId = null;
        showScreen("screen-menu");
        break;

      case "screen-review":
        showScreen("screen-menu");
        break;
    }
  });

  const welcomeStartButton = document.querySelector(".category-start");

  function showScreen(screenId) {
    const targetScreen = document.getElementById(screenId);
    if (!targetScreen) return;

    document.querySelectorAll(".cafe-screen").forEach((screen) => {
      screen.hidden = screen !== targetScreen;
    });
  }

  // 시작 화면 터치 → 메뉴 선택 화면
  welcomeStartButton.addEventListener("click", () => {
    showScreen("screen-menu");
  });

  // 최초 화면
  showScreen("category-start-screen");

  const categoryNav = document.querySelector(".menu-tab");
  const menuTrack = document.querySelector(".menu-track");
  const prevButton = document.querySelector(".menu-prev");
  const nextButton = document.querySelector(".menu-next");
  const pagination = document.querySelector(".menu-pagination");

  const PAGE_SIZE = 6;

  const allMenuCards = Array.from(
    menuTrack.querySelectorAll(".cafe-menu-card")
  );

  let currentCategory = "all";
  let currentPage = 0;
  let menuPages = [];

  // --------------------------------
  // 1. 현재 페이지 표시 및 버튼 상태 갱신
  // --------------------------------
  function updatePage() {
    menuTrack.style.transform = `translateX(-${currentPage * 100}%)`;

    // 첫 페이지 / 마지막 페이지 버튼 비활성화
    prevButton.disabled = currentPage === 0;
    nextButton.disabled =
      menuPages.length === 0 || currentPage === menuPages.length - 1;

    // 현재 페이지 표시
    pagination.querySelectorAll(".menu-dot").forEach((dot, index) => {
      const isActive = index === currentPage;

      dot.classList.toggle("is-active", isActive);

      if (isActive) {
        dot.setAttribute("aria-current", "page");
      } else {
        dot.removeAttribute("aria-current");
      }
    });

    // 화면 밖 페이지의 메뉴에 키보드 포커스가 가지 않도록 처리
    menuPages.forEach((page, index) => {
      const isActive = index === currentPage;

      page.inert = !isActive;
      page.setAttribute("aria-hidden", String(!isActive));
    });
  }

  // --------------------------------
  // 2. 페이지 이동
  // --------------------------------
  function goToPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= menuPages.length) return;

    currentPage = pageIndex;
    updatePage();
  }

  // --------------------------------
  // 3. 카테고리별 메뉴 페이지 구성
  // --------------------------------
  function renderCategory(category) {
    currentCategory = category;
    currentPage = 0;

    const filteredCards = allMenuCards.filter((card) => {
      return (
        currentCategory === "all" || card.dataset.category === currentCategory
      );
    });

    // 카테고리 변경 시 첫 페이지로 즉시 돌아가도록
    // 잠시 슬라이드 효과 해제
    const previousTransition = menuTrack.style.transition;
    menuTrack.style.transition = "none";

    const pageFragment = document.createDocumentFragment();
    menuPages = [];

    // 메뉴를 6개씩 묶어서 페이지 생성
    for (let i = 0; i < filteredCards.length; i += PAGE_SIZE) {
      const page = document.createElement("div");
      page.className = "menu-page";

      const cards = filteredCards.slice(i, i + PAGE_SIZE);

      cards.forEach((card) => {
        page.appendChild(card);
      });

      menuPages.push(page);
      pageFragment.appendChild(page);
    }

    menuTrack.replaceChildren(pageFragment);

    // 페이지 수에 맞춰 페이지네이션 생성
    const dotFragment = document.createDocumentFragment();

    menuPages.forEach((_, index) => {
      const dot = document.createElement("button");

      dot.type = "button";
      dot.className = "menu-dot";
      dot.dataset.page = String(index);
      dot.setAttribute("aria-label", `${index + 1}페이지로 이동`);

      dotFragment.appendChild(dot);
    });

    pagination.replaceChildren(dotFragment);

    // 선택한 카테고리 표시
    categoryNav.querySelectorAll("[data-category]").forEach((button) => {
      const isActive = button.dataset.category === currentCategory;

      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    updatePage();

    // 초기 위치를 반영한 뒤 슬라이드 효과 복구
    void menuTrack.offsetWidth;
    menuTrack.style.transition = previousTransition;
  }

  // --------------------------------
  // 4. 이벤트 연결
  // --------------------------------

  // 카테고리 선택
  categoryNav.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;

    renderCategory(button.dataset.category);
  });

  // 이전 페이지
  prevButton.addEventListener("click", () => {
    goToPage(currentPage - 1);
  });

  // 다음 페이지
  nextButton.addEventListener("click", () => {
    goToPage(currentPage + 1);
  });

  // 페이지네이션 선택
  pagination.addEventListener("click", (event) => {
    const dot = event.target.closest(".menu-dot");
    if (!dot) return;

    goToPage(Number(dot.dataset.page));
  });

  // --------------------------------
  // 5. 최초 실행
  // --------------------------------
  renderCategory("all");

  // --------------------------------
  // 주문 내역 요소
  // --------------------------------
  const cartList = document.querySelector(".cart-list");
  const cartClearButton = document.querySelector(".cart-clear");
  const orderSubmitButton = document.querySelector(".order-submit");
  const orderCount = document.querySelector(".order-count");
  const orderTotal = document.querySelector(".order-total");

  // 메뉴 정보를 최초 한 번 저장
  // 금액은 메뉴 카드에 작성된 가격을 사용
  const menuDataById = new Map(
    allMenuCards.map((card) => {
      const id = card.dataset.menuId;
      const name = card.querySelector(".menu-card-name").textContent.trim();
      const priceText = card.querySelector(".menu-card-price").textContent;
      const price = Number(priceText.replace(/[^\d]/g, ""));

      return [id, { id, name, price }];
    })
  );

  // 선택한 메뉴 저장
  const cartItems = new Map();

  function formatPrice(price) {
    return `${price.toLocaleString("ko-KR")}원`;
  }

  // --------------------------------
  // 1. 총수량·총금액 계산
  // --------------------------------
  function getCartSummary() {
    let totalQuantity = 0;
    let totalPrice = 0;

    cartItems.forEach((item) => {
      totalQuantity += item.quantity;
      totalPrice += item.price * item.quantity;
    });

    return { totalQuantity, totalPrice };
  }

  // --------------------------------
  // 2. 주문 상품 한 행 생성
  // --------------------------------
  function createCartItem(item) {
    const row = document.createElement("li");

    row.className = "cart-item";
    row.dataset.cartId = item.cartKey;

    row.innerHTML = `
      <span class="cart-item-name"></span>
  
      <div class="cart-quantity" role="group">
        <button
          type="button"
          class="cart-decrease"
          aria-label="수량 줄이기"
        >
          <img
            src="../../shared/images/icon/minus-disabled.png"
            class="cart-minus-image"
            alt=""
          />
        </button>
  
        <output
          class="cart-quantity-value"
          aria-label="수량"
        ></output>
  
        <button
          type="button"
          class="cart-increase"
          aria-label="수량 늘리기"€
        >
          <img
            src="../../shared/images/icon/plus.png"
            class="cart-plus-image"
            alt=""
          />
        </button>
      </div>
  
      <span class="cart-item-price"><span>원</span></span>
  
      <button type="button" class="cart-remove">
        <span aria-hidden="true">삭제</span>
      </button>
    `;

    // 2. 상품명 입력
    const nameElement = row.querySelector(".cart-item-name");
    nameElement.textContent = item.name;

    // 4. 수량과 금액 입력
    row.querySelector(".cart-quantity-value").textContent = item.quantity;

    row.querySelector(".cart-item-price").textContent = formatPrice(
      item.price * item.quantity
    );

    const decreaseButton = row.querySelector(".cart-decrease");
    const minusImage = row.querySelector(".cart-minus-image");
    const isDisabled = item.quantity <= 1;

    decreaseButton.disabled = isDisabled;

    minusImage.src = isDisabled
      ? "../../shared/images/icon/minus-disabled.png"
      : "../../shared/images/icon/minus.png";

    // 5. 접근성 설명
    row
      .querySelector(".cart-quantity")
      .setAttribute("aria-label", `${item.name} 수량 조절`);

    row
      .querySelector(".cart-remove")
      .setAttribute("aria-label", `${item.name} 삭제`);

    return row;
  }

  // --------------------------------
  // 3. 주문 내역 화면 갱신
  // --------------------------------
  function renderCart() {
    const fragment = document.createDocumentFragment();

    if (cartItems.size === 0) {
      const emptyMessage = document.createElement("li");

      emptyMessage.className = "cart-empty";
      emptyMessage.textContent = "";

      fragment.appendChild(emptyMessage);
    } else {
      cartItems.forEach((item) => {
        fragment.appendChild(createCartItem(item));
      });
    }

    cartList.replaceChildren(fragment);

    const { totalQuantity, totalPrice } = getCartSummary();

    orderCount.textContent = `${totalQuantity}개`;
    orderTotal.textContent = formatPrice(totalPrice);

    const isEmpty = cartItems.size === 0;

    cartClearButton.disabled = isEmpty;
    orderSubmitButton.disabled = isEmpty;
  }

  // --------------------------------
  // 5. 수량 변경 및 개별 삭제
  // --------------------------------
  cartList.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;

    const row = button.closest(".cart-item");
    if (!row) return;

    const item = cartItems.get(row.dataset.cartId);
    if (!item) return;

    if (button.classList.contains("cart-increase")) {
      item.quantity += 1;
    } else if (button.classList.contains("cart-decrease")) {
      item.quantity = Math.max(1, item.quantity - 1);
    } else if (button.classList.contains("cart-remove")) {
      cartItems.delete(row.dataset.cartId);
    } else {
      return;
    }

    renderCart();
  });

  // --------------------------------
  // 6. 전체취소
  // --------------------------------
  cartClearButton.addEventListener("click", () => {
    cartItems.clear();
    renderCart();
  });

  // --------------------------------
  // 7. 주문하기
  // --------------------------------
  orderSubmitButton.addEventListener("click", () => {
    if (cartItems.size === 0) return;

    const orderData = {
      items: Array.from(cartItems.values(), (item) => ({
        menuId: item.id,
        name: item.name,
        unitPrice: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
        options: item.options ?? [],
      })),
      ...getCartSummary(),
    };

    console.log("주문 데이터:", orderData);

    // 주문 확인 화면 내용 갱신
    renderReview(orderData);

    // 주문 확인 화면으로 이동
    showScreen("screen-review");
  });

  // --------------------------------
  // 주문 확인 화면 생성
  // --------------------------------
  function renderReview(orderData) {
    const screen = document.querySelector("#screen-review");
    const reviewList = screen.querySelector(".review-list");
    const template = screen.querySelector("#review-item-template");

    const rows = orderData.items.map((item) => {
      // HTML에 작성해둔 주문 항목 복사
      const row = template.content.firstElementChild.cloneNode(true);

      row.querySelector(".review-item-name").textContent = item.name;

      row.querySelector(
        ".review-item-quantity"
      ).textContent = `${item.quantity}개`;

      row.querySelector(".review-item-price").textContent = formatPrice(
        item.subtotal
      );

      return row;
    });

    reviewList.replaceChildren(...rows);

    screen.querySelector(
      ".review-total-count"
    ).textContent = `${orderData.totalQuantity}개`;

    screen.querySelector(".review-total-price").textContent = formatPrice(
      orderData.totalPrice
    );
  }

  // --------------------------------
  // 돌아가기 → 메뉴 화면
  // 주문 내역은 유지
  // --------------------------------
  document.querySelector(".review-back").addEventListener("click", () => {
    showScreen("screen-menu");
  });
  // --------------------------------
  // 8. 최초 실행
  // HTML에 작성한 샘플 주문 내역을 비우고 시작
  // --------------------------------
  renderCart();

  // --------------------------------
  // 옵션 화면 요소
  // --------------------------------
  const optionForm = document.querySelector("#option-form");
  const optionGroups = document.querySelector(".option-groups");
  const optionProductName = document.querySelector(".option-product-name");
  const optionProductImage = document.querySelector(".option-product-image");
  const optionProductDescription = document.querySelector(
    ".option-product-description"
  );
  const optionTotal = document.querySelector(".option-total");
  const optionCancelButton = document.querySelector(".option-cancel");

  // 현재 옵션을 선택하고 있는 메뉴
  let activeOptionMenuId = null;

  // --------------------------------
  // 옵션 데이터
  // choices: [옵션 값, 표시 이름, 추가금액]
  // --------------------------------
  const optionDefinitions = {
    size: {
      title: "사이즈",
      defaultValue: "basic",
      required: true,
      choices: [
        ["basic", "기본 사이즈", 0],
        ["large", "큰 사이즈", 500],
      ],
    },

    ice: {
      title: "얼음",
      choices: [
        ["more", "얼음 많이", 0],
        ["less", "얼음 적게", 0],
      ],
    },

    water: {
      title: "물양",
      choices: [
        ["more", "물양 많이", 0],
        ["less", "물양 적게", 0],
      ],
    },

    temperature: {
      title: "종류",
      defaultValue: "hot",
      required: true,
      choices: [
        ["hot", "HOT", 0],
        ["ice", "ICE", 0],
      ],
    },

    shot: {
      title: "샷 추가",
      choices: [
        ["one", "1샷 추가", 500],
        ["two", "2샷 추가", 1000],
      ],
    },

    cream: {
      title: "휘핑크림",
      choices: [
        ["none", "빼기", 0],
        ["less", "적게", 0],
        ["more", "많이", 0],
      ],
    },
  };

  // 이 목록에 없는 메뉴는 옵션 없이 바로 추가
  const menuOptionGroups = {
    "coffee-01": ["size", "ice", "water"],
    "coffee-02": ["size", "water"],
    "coffee-04": ["temperature", "shot", "cream"],
    "coffee-07": ["temperature", "shot", "cream"],
  };

  // 상품 이미지·설명을 읽기 위한 기존 메뉴 카드 목록
  const menuCardById = new Map(
    allMenuCards.map((card) => [card.dataset.menuId, card])
  );

  // --------------------------------
  // 1. 옵션 그룹 생성
  // --------------------------------
  function createOptionGroup(groupId) {
    const definition = optionDefinitions[groupId];

    const fieldset = document.createElement("fieldset");
    fieldset.className = "option-group";
    fieldset.dataset.group = groupId;

    const legend = document.createElement("legend");
    legend.className = "option-group-title";
    legend.textContent = definition.title;

    const choices = document.createElement("div");
    choices.className = "option-choices";

    definition.choices.forEach(([value, label, extraPrice]) => {
      const choice = document.createElement("label");
      choice.className = "option-choice";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = groupId;
      input.value = value;
      input.required = Boolean(definition.required);
      input.checked = value === definition.defaultValue;

      const text = document.createElement("span");
      text.className = "option-choice-label";
      text.textContent = label;

      choice.append(input, text);

      // 사이즈·종류·샷 추가에는 추가금액 표시
      if (["size", "temperature", "shot"].includes(groupId)) {
        const price = document.createElement("span");
        price.className = "option-choice-price";
        price.textContent = `+${formatPrice(extraPrice)}`;

        choice.appendChild(price);
      }

      choices.appendChild(choice);
    });

    fieldset.append(legend, choices);

    return fieldset;
  }

  // --------------------------------
  // 2. 현재 선택한 옵션 읽기
  // --------------------------------
  function getSelectedOptions() {
    const groupIds = menuOptionGroups[activeOptionMenuId] ?? [];

    return groupIds.flatMap((groupId) => {
      const checked = optionForm.querySelector(
        `input[name="${groupId}"]:checked`
      );

      if (!checked) return [];

      const definition = optionDefinitions[groupId];
      const choice = definition.choices.find(
        ([value]) => value === checked.value
      );

      if (!choice) return [];

      return [
        {
          groupId,
          groupName: definition.title,
          value: choice[0],
          label: choice[1],
          extraPrice: choice[2],
        },
      ];
    });
  }

  // --------------------------------
  // 3. 옵션 포함 금액 표시
  // --------------------------------
  function updateOptionPrice() {
    const menu = menuDataById.get(activeOptionMenuId);
    if (!menu) return;

    const extraPrice = getSelectedOptions().reduce(
      (total, option) => total + option.extraPrice,
      0
    );

    optionTotal.textContent = formatPrice(menu.price + extraPrice);
  }

  // --------------------------------
  // 4. 옵션 화면 열기
  // --------------------------------
  function openOptionScreen(menuId) {
    const menu = menuDataById.get(menuId);
    const card = menuCardById.get(menuId);
    const groupIds = menuOptionGroups[menuId];

    if (!menu || !groupIds) return;

    activeOptionMenuId = menuId;

    optionProductName.textContent = menu.name;

    // 메뉴 카드의 이미지를 사용
    const imageSrc = card?.querySelector("img")?.getAttribute("src");

    optionProductImage.hidden = !imageSrc;

    if (imageSrc) {
      optionProductImage.src = imageSrc;
    } else {
      optionProductImage.removeAttribute("src");
    }

    // 메뉴 카드에 data-description이 있으면 설명 표시
    const description = card?.dataset.description ?? "";

    optionProductDescription.textContent = description;
    optionProductDescription.hidden = !description;

    // 새로 열 때마다 기본 선택 상태로 구성
    optionGroups.replaceChildren(...groupIds.map(createOptionGroup));

    updateOptionPrice();
    showScreen("screen-options");
  }

  // --------------------------------
  // 5. 옵션을 포함해 주문 내역에 추가
  // --------------------------------
  function addMenuToCart(menu, options = []) {
    // 같은 상품이라도 옵션이 다르면 별도 항목으로 관리
    const optionKey = options
      .map((option) => [option.groupId, option.value])
      .sort((a, b) => a[0].localeCompare(b[0]));

    const cartKey = JSON.stringify([menu.id, optionKey]);
    const existingItem = cartItems.get(cartKey);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      const extraPrice = options.reduce(
        (total, option) => total + option.extraPrice,
        0
      );

      cartItems.set(cartKey, {
        ...menu,
        cartKey,
        basePrice: menu.price,
        price: menu.price + extraPrice,
        quantity: 1,
        options,
      });
    }

    renderCart();
  }

  menuTrack.addEventListener("click", (event) => {
    const card = event.target.closest(".cafe-menu-card");
    if (!card || card.disabled) return;

    const menu = menuDataById.get(card.dataset.menuId);
    if (!menu) return;

    if (menuOptionGroups[menu.id]) {
      openOptionScreen(menu.id);
    } else {
      addMenuToCart(menu);
    }
  });
  // --------------------------------
  // 7. 옵션 변경 시 금액 갱신
  // --------------------------------
  optionForm.addEventListener("change", updateOptionPrice);

  // 선택 사항 초기화
  optionGroups.addEventListener("click", (event) => {
    const button = event.target.closest(".option-reset");
    if (!button) return;

    button
      .closest("fieldset")
      .querySelectorAll("input")
      .forEach((input) => {
        input.checked = false;
      });

    updateOptionPrice();
  });

  // --------------------------------
  // 8. 취소
  // --------------------------------
  optionCancelButton.addEventListener("click", () => {
    activeOptionMenuId = null;
    showScreen("screen-menu");
  });

  // --------------------------------
  // 9. 주문담기
  // --------------------------------
  optionForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const menu = menuDataById.get(activeOptionMenuId);
    if (!menu || !optionForm.reportValidity()) return;

    addMenuToCart(menu, getSelectedOptions());

    activeOptionMenuId = null;
    showScreen("screen-menu");
  });

  // --------------------------- 모달창 --------------------------- //

  let selectedDiningType = null;
  let selectedPaymentMethod = null;

  // 먹고가기 / 포장하기 → 결제수단 선택 팝업
  document
    .querySelector(".review-bottom")
    .addEventListener("click", (event) => {
      const button = event.target.closest(".review-dine-in, .review-takeout");

      if (!button || cartItems.size === 0) return;

      selectedDiningType = button.classList.contains("review-dine-in")
        ? "dine-in"
        : "takeout";

      selectedPaymentMethod = null;

      window.openModal("modal-payment");
    });

  // 결제수단 선택
  document
    .querySelector("#modal-payment")
    .addEventListener("click", (event) => {
      const button = event.target.closest("[data-payment-method]");
      if (!button) return;

      selectedPaymentMethod = button.dataset.paymentMethod;

      console.log("이용 방식:", selectedDiningType);
      console.log("결제수단:", selectedPaymentMethod);

      if (selectedPaymentMethod === "card") {
        openCardPaymentModal();
      }
    });

  function openCardPaymentModal() {
    if (cartItems.size === 0) return;

    const modal = document.querySelector("#modal-card-payment");
    const { totalQuantity, totalPrice } = getCartSummary();

    modal.querySelector(
      ".card-payment-count"
    ).textContent = `${totalQuantity}개`;

    modal.querySelector(".card-payment-total").textContent =
      formatPrice(totalPrice);

    window.openModal("modal-card-payment");
  }

  const paymentProgressModal = document.querySelector(
    "#modal-payment-progress"
  );
  const paymentCompleteModal = document.querySelector(
    "#modal-payment-complete"
  );
  const pointsPromptModal = document.querySelector("#modal-points-prompt");

  function showPaymentProgress() {
    window.openModal("modal-payment-progress");

    let completionScheduled = false;

    function showCompletionAfterDelay() {
      if (completionScheduled) return;
      completionScheduled = true;

      window.setTimeout(() => {
        if (paymentProgressModal.open) {
          window.openModal("modal-payment-complete");
        }
      }, 2000);
    }

    if (
      "speechSynthesis" in window &&
      typeof window.SpeechSynthesisUtterance === "function"
    ) {
      const guide = new SpeechSynthesisUtterance(
        "결제 진행중입니다. 잠시만 기다려주세요."
      );

      guide.lang = "ko-KR";
      guide.onend = showCompletionAfterDelay;
      guide.onerror = showCompletionAfterDelay;

      window.speechSynthesis.speak(guide);
    } else {
      showCompletionAfterDelay();
    }
  }

  // 체험용 카드 삽입 버튼 → 결제 진행
  document
    .querySelector("#modal-card-payment [data-card-inserted]")
    .addEventListener("click", showPaymentProgress);

  // 진행 중에는 Esc로 화면이 닫히지 않도록 처리
  paymentProgressModal.addEventListener("cancel", (event) => {
    event.preventDefault();
  });

  // 카드 제거 완료 → 적립 안내
  paymentCompleteModal
    .querySelector("[data-card-removed]")
    .addEventListener("click", () => {
      pointsPromptModal.returnValue = "";
      window.openModal("modal-points-prompt");
    });

  const pointsPhoneModal = document.getElementById("modal-points-phone");
  const pointsPhoneNumber = document.getElementById("points-phone-number");
  const pointsKeypad = pointsPhoneModal.querySelector(".points-keypad");
  const phonePrefixButton = pointsKeypad.querySelector(
    '[data-phone-key="010"]'
  );

  function updatePointsPhoneNumber(value) {
    pointsPhoneNumber.value = value;
    phonePrefixButton.disabled = value.length > 0;
  }

  // 적립 안내에서 예 / 아니오를 선택한 경우
  pointsPromptModal.addEventListener("close", () => {
    if (pointsPromptModal.returnValue === "yes") {
      updatePointsPhoneNumber("");
      window.openModal("modal-points-phone");
    } else if (pointsPromptModal.returnValue === "no") {
      window.openModal("modal-receipt");
    }
  });

  pointsKeypad.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-phone-key]");
    if (!button || button.disabled || !pointsPhoneModal.open) return;

    const key = button.dataset.phoneKey;

    // 하이픈을 제외한 숫자만 가져오기
    const currentNumber = pointsPhoneNumber.value.replace(/\D/g, "");

    const nextNumber =
      key === "delete" ? currentNumber.slice(0, -1) : currentNumber + key;

    if (nextNumber.length > 11) return;

    // 기존 번호 업데이트 로직 유지
    updatePointsPhoneNumber(nextNumber);

    // 화면에는 하이픈을 포함해서 표시
    if (nextNumber.length > 7) {
      pointsPhoneNumber.value = `${nextNumber.slice(0, 3)}-${nextNumber.slice(
        3,
        7
      )}-${nextNumber.slice(7)}`;
    } else if (nextNumber.length > 3) {
      pointsPhoneNumber.value = `${nextNumber.slice(0, 3)}-${nextNumber.slice(
        3
      )}`;
    } else {
      pointsPhoneNumber.value = nextNumber;
    }

    // 하이픈을 제외한 숫자 11자리 기준
    if (nextNumber.length === 11) {
      window.openModal("modal-points-complete");
    }
  });

  // 입력 팝업을 닫으면 화면에 남은 번호 지우기
  pointsPhoneModal.addEventListener("close", () => {
    updatePointsPhoneNumber("");
  });

  // 번호 입력 건너뛰기 / 적립 완료 확인
  document
    .querySelectorAll(
      "#modal-points-phone [data-open-receipt], " +
        "#modal-points-complete [data-open-receipt]"
    )
    .forEach((button) => {
      button.addEventListener("click", () => {
        window.openModal("modal-receipt");
      });
    });
});
