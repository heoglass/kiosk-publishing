document.addEventListener("DOMContentLoaded", () => {
  initTablePayCategoryNav();
  initTablePayProducts();
  initSetItemDetail();
  updateCartBadge();
  initCartReview();
  initPaymentType();
});

/**
 * 좌측 카테고리 메뉴 탭 전환 및 직원호출 이벤트
 */
function initTablePayCategoryNav() {
  const categoryItems = document.querySelectorAll(
    ".foodcourt-category__nav li"
  );
  categoryItems.forEach((item) => {
    item.addEventListener("click", () => {
      // 세트메뉴 선택 화면 등 다른 페이지에 있을 경우 index.html로 이동하면서 카테고리 전환 가능
      if (!window.location.pathname.endsWith("/index.html")) {
        const cat = item.dataset.category || "all";
        sessionStorage.setItem("tablePay_selected_cat", cat);
        window.location.href = "./index.html";
        return;
      }

      categoryItems.forEach((li) => li.classList.remove("is-active"));
      item.classList.add("is-active");

      const category = item.dataset.category;
      filterProductsByCategory(category);
    });
  });

  // 이전 선택 카테고리 복원
  const savedCat = sessionStorage.getItem("tablePay_selected_cat");
  if (savedCat && window.location.pathname.endsWith("/index.html")) {
    const targetLi = document.querySelector(
      `.foodcourt-category__nav li[data-category="${savedCat}"]`
    );
    if (targetLi) {
      categoryItems.forEach((li) => li.classList.remove("is-active"));
      targetLi.classList.add("is-active");
      filterProductsByCategory(savedCat);
    }
    sessionStorage.removeItem("tablePay_selected_cat");
  }

  // 직원호출 버튼
  const staffCallBtn = document.querySelector(".btn-staff-call");
  if (staffCallBtn) {
    staffCallBtn.addEventListener("click", () => {
    });
  }

  // 주문내역 버튼
  const orderHistoryBtns = document.querySelectorAll(".btn-order-history");
  const historyDialog = document.querySelector(".table-pay-history");
  const historyContent = document.querySelector(".table-pay-history__content");
  orderHistoryBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const savedItems = getTableOrderItems();
      if (savedItems.length === 0) {
        historyContent.textContent = "현재 주문 내역이 없습니다.";
      } else {
        const descriptions = savedItems.map((item) => {
          const itemDesc = item.단품
            ? `[단품] ${item.name} (${item.count}개)`
            : `[세트] ${item.name} - 구성: ${item.setMenu || ""}, ${item.setMenu2 || ""} (${item.count}개)`;
          const optionDesc = item.option ? `\n옵션: ${item.option}` : "";
          return `${itemDesc}${optionDesc}\n금액: ${(item.price * item.count).toLocaleString()}원`;
        });
        historyContent.textContent = descriptions.join("\n\n");
      }
      historyDialog.showModal();
    });
  });
}

/**
 * 카테고리 선택별 상품 필터링 (마크업 유지하며 display 처리)
 */
function filterProductsByCategory(category) {
  const cards = document.querySelectorAll(".product-card");
  cards.forEach((card) => {
    const cardType = card.dataset.type;
    if (!category || category === "all" || cardType === category) {
      card.style.display = "flex";
    } else {
      card.style.display = "none";
    }
  });
  const productList = document.querySelector(".foodcourt-products__list");
  if (productList) productList.scrollTop = 0;
}

/**
 * 상품 카드 클릭 이벤트
 */
function initTablePayProducts() {
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    card.addEventListener("click", () => {
      const type = card.dataset.type;
      const name = card.dataset.name || "돼지국밥세트";
      const price = Number(card.dataset.price) || 6000;
      const setMenu = card.dataset.setMenu || "국밥";
      const setMenu2 = card.dataset.setMenu2 || "편육";

      if (["set", "side", "drink", "beverage"].includes(type)) {
        sessionStorage.setItem(
          "tablePay_selected_item",
          JSON.stringify({
            type,
            name,
            price,
            setMenu,
            setMenu2,
            sub: card.dataset.sub || card.querySelector(".product-desc").textContent,
            desc: card.dataset.desc,
            hasOptions: card.dataset.hasOptions === "true",
          })
        );
        window.location.href = "./tableP-02.html";
      } else {
        // 단품메뉴 선택 시
        const singleItem = {
          name,
          price,
          count: 1,
          단품: true,
        };
        saveTableOrderItem(singleItem);
        updateCartBadge();
      }
    });
  });
}

/**
 * 상품 상세 및 수량 선택 화면 (tableP-02.html) 인터랙션
 */
function initSetItemDetail() {
  const counterValEl = document.getElementById("setitemCount");
  const minusBtn = document.querySelector(".setitem-counter .btn-minus");
  const plusBtn = document.querySelector(".setitem-counter .btn-plus");
  const addCartBtn = document.getElementById("btnAddToCart");
  const priceEl = document.getElementById("setitemPrice");
  const optionsDialog = document.querySelector(".table-pay-options");
  const optionsForm = document.getElementById("tablePayOptionsForm");
  const addedDialog = document.querySelector(".table-pay-added");

  if (!addCartBtn || !counterValEl) return;

  let count = 1;
  const selectedItemInfo = JSON.parse(
    sessionStorage.getItem("tablePay_selected_item") || "{}"
  );
  const basePrice = selectedItemInfo.price || 10000;
  const name = selectedItemInfo.name || "돼지국밥세트";
  const isSet = !selectedItemInfo.type || selectedItemInfo.type === "set";
  document.querySelector(".setitem-title").textContent = name;
  if (selectedItemInfo.sub) {
    document.querySelector(".setitem-sub").textContent = selectedItemInfo.sub;
  }
  const description = document.querySelector(".setitem-desc");
  if (selectedItemInfo.name) {
    description.textContent = selectedItemInfo.desc || "";
    description.hidden = !selectedItemInfo.desc;
  }
  const image = document.querySelector(".setitem-detail__image img");
  image.hidden = !isSet;
  image.alt = `${name} 이미지`;
  image.parentElement.classList.toggle("is-placeholder", !isSet);
  priceEl.textContent = `${basePrice.toLocaleString()}원`;

  // 수량 감소
  minusBtn?.addEventListener("click", () => {
    if (count > 1) {
      count--;
      counterValEl.textContent = count;
      if (priceEl) {
        priceEl.textContent = `${(basePrice * count).toLocaleString()}원`;
      }
    }
  });

  // 수량 증가
  plusBtn?.addEventListener("click", () => {
    count++;
    counterValEl.textContent = count;
    if (priceEl) {
      priceEl.textContent = `${(basePrice * count).toLocaleString()}원`;
    }
  });

  function addToCart(option) {
    const itemData = {
      name,
      price: basePrice,
      count: count,
      단품: !isSet,
    };

    if (isSet) {
      itemData.setMenu = selectedItemInfo.setMenu || "국밥";
      itemData.setMenu2 = selectedItemInfo.setMenu2 || "편육";
    }
    if (option) itemData.option = option;
    saveTableOrderItem(itemData);
    if (optionsDialog.open) optionsDialog.close();
    document.querySelector(".table-pay-added__name").textContent = name;
    addedDialog.showModal();
    window.setTimeout(() => {
      window.location.href = "./index.html";
    }, 2000);
  }

  function updateOptionSelection() {
    optionsForm.querySelectorAll(".table-pay-options__choice").forEach((choice) => {
      choice.classList.toggle("is-selected", choice.querySelector("input").checked);
    });
  }

  addCartBtn.addEventListener("click", () => {
    if (selectedItemInfo.hasOptions) {
      optionsForm.reset();
      updateOptionSelection();
      optionsDialog.showModal();
    } else {
      addToCart();
    }
  });

  optionsDialog.querySelector(".table-pay-options__cancel").addEventListener("click", () => {
    optionsDialog.close();
  });
  optionsForm.addEventListener("change", updateOptionSelection);
  optionsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const selectedOption = optionsForm.querySelector('input[name="productOption"]:checked');
    if (selectedOption) addToCart(selectedOption.value);
  });
  addedDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
  });
}

/**
 * tableOrderItem 로컬스토리지 저장 함수
 */
function saveTableOrderItem(itemData) {
  const items = getTableOrderItems();
  items.push(itemData);
  localStorage.setItem("tableOrderItem", JSON.stringify(items));
}

/**
 * tableOrderItem 로컬스토리지 로드 함수
 */
function getTableOrderItems() {
  const data = localStorage.getItem("tableOrderItem");
  if (data === null) return [];
  let saved;
  try {
    saved = JSON.parse(data);
  } catch (error) {
    console.error("장바구니 데이터를 읽을 수 없습니다.", error);
    throw error;
  }
  const items = Array.isArray(saved) ? saved : [saved];
  if (!items.every((item) =>
    item && typeof item === "object" && !Array.isArray(item) &&
    typeof item.name === "string" && Number.isFinite(item.price) &&
    Number.isInteger(item.count) && item.count > 0
  )) {
    const error = new Error("장바구니 데이터 형식이 올바르지 않습니다.");
    console.error(error);
    throw error;
  }
  return items;
}

/**
 * 장바구니 뱃지 수량 업데이트
 */
function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (!badge) return;

  const totalCount = getTableOrderItems().reduce((total, item) => total + item.count, 0);
  badge.textContent = `${totalCount}개`;
}

function initCartReview() {
  document.querySelector(".btn-cart")?.addEventListener("click", () => {
    window.location.href = "./tableP-04.html";
  });

  const review = document.getElementById("tablePay-cart-list");
  if (!review) return;

  const items = getTableOrderItems();
  const list = review.querySelector(".tablePayWrap__cartList-items");
  let totalCount = 0;
  let totalPrice = 0;

  if (items.length === 0) {
    const empty = document.createElement("li");
    empty.className = "cart-list-empty";
    empty.textContent = "장바구니에 담긴 상품이 없습니다.";
    list.append(empty);
  }

  items.forEach((item) => {
    const row = document.createElement("li");
    const name = document.createElement("span");
    const quantity = document.createElement("span");
    const price = document.createElement("span");

    name.className = "cart-item-name";
    name.textContent = item.name;
    quantity.className = "cart-item-quantity";
    quantity.textContent = `${item.count}개`;
    price.className = "cart-item-price";
    price.textContent = `${(item.price * item.count).toLocaleString()}원`;
    row.append(name, quantity, price);

    if (item.option) {
      const options = document.createElement("div");
      const option = document.createElement("span");
      options.className = "cart-item-options";
      option.className = "cart-item-option-list";
      option.textContent = `옵션: ${item.option}`;
      options.append(option);
      row.append(options);
    }

    list.append(row);
    totalCount += item.count;
    totalPrice += item.price * item.count;
  });

  review.querySelector(".total-price-count").textContent = `${totalCount}개`;
  review.querySelector(".total-price-currency").textContent = totalPrice.toLocaleString();
  review.querySelector("#tablePayWrap__btn-back").addEventListener("click", () => {
    window.location.href = "./index.html";
  });
  review.querySelector("#tablePayWrap__btn-pay").addEventListener("click", () => {
    window.location.href = "./tableP-05.html";
  });
}

function initPaymentType() {
  const total = document.getElementById("tablePay-payment-total");
  if (!total) return;

  const totalPrice = getTableOrderItems().reduce(
    (sum, item) => sum + item.price * item.count,
    0
  );
  total.textContent = `총 ${totalPrice.toLocaleString()}원`;

  document.querySelectorAll("[data-payment-dialog]").forEach((button) => {
    button.addEventListener("click", () => {
      const dialog = document.getElementById(button.dataset.paymentDialog);
      if (!(dialog instanceof HTMLDialogElement)) {
        console.error("결제 안내 모달을 찾을 수 없습니다.", button.dataset.paymentDialog);
        return;
      }
      dialog.showModal();
    });
  });

  const initialDialog = document.getElementById("split-payment-dialog");
  if (!(initialDialog instanceof HTMLDialogElement)) {
    console.error("결제 안내 모달을 찾을 수 없습니다.", "split-payment-dialog");
    return;
  }
  popupNextMove();
  initialDialog.showModal();
}

function popupNextMove() {
  const lottieBtn = document.getElementById("lottieBtn");
  if (!lottieBtn) {
    console.error("Lottie 버튼을 찾을 수 없습니다.");
    return;
  }

  const splitDialog = document.getElementById("split-payment-dialog");
  const loadingDialog = document.getElementById("full-payment-dialog");
  const removedDialog = document.getElementById("card-removed-dialog");
  const completedDialog = document.getElementById("order-completed-dialog");
  const removedButton = removedDialog?.querySelector(".card-completed-icon");
  const completeButton = document.getElementById("creditCompleteBtn");
  if (
    !(splitDialog instanceof HTMLDialogElement) ||
    !(loadingDialog instanceof HTMLDialogElement) ||
    !(removedDialog instanceof HTMLDialogElement) ||
    !(completedDialog instanceof HTMLDialogElement) ||
    !(removedButton instanceof HTMLButtonElement) ||
    !(completeButton instanceof HTMLButtonElement)
  ) {
    console.error("결제 단계 모달을 찾을 수 없습니다.");
    return;
  }

  let timer = null;
  loadingDialog.addEventListener("cancel", (event) => {
    if (timer !== null) event.preventDefault();
  });
  loadingDialog.addEventListener("close", () => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  });

  lottieBtn.addEventListener("click", () => {
    if (timer !== null) return;
    splitDialog.close();
    loadingDialog.showModal();
    timer = window.setTimeout(() => {
      timer = null;
      loadingDialog.close();
      removedDialog.showModal();
    }, 3000);
  });

  removedButton.addEventListener("click", () => {
    removedDialog.close();
    completedDialog.showModal();
  });

  completeButton.addEventListener("click", () => {
    window.location.href = "./tableP-06.html";
  });
}