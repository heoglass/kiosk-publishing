/* ==========================================================
   selfCheckout 공통 스크립트 (ice-02 ~ ice-08)
   - ice-03 주문내역: 수량 조절 / 합계 계산 / 바코드 스캔 상품 추가 / 삭제 / 결제하기
   - ice-04 결제수단 선택: 모달 오픈 + dimmed
   - 바닐라 JS, DOMContentLoaded 시 페이지별 init
   ========================================================== */

/* ---------- 설정 ---------- */
const MAX_QTY = 99;
const DISCOUNT = 0; // 하드코딩 할인금액
const CHECKOUT_PAYMENT_KEY = "selfCheckoutPayment";
let pendingRipple = null;

function playRipple(event, target, duration = 700) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;

  target.classList.add("selfCheckout-ripple-host");
  if (getComputedStyle(target).position === "static") target.style.position = "relative";
  const rect = target.getBoundingClientRect();
  const size = Math.hypot(target.clientWidth, target.clientHeight) * 2;
  const ripple = document.createElement("span");
  ripple.className = "selfCheckout-ripple";
  ripple.setAttribute("aria-hidden", "true");
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${event.detail ? ((event.clientX - rect.left) / rect.width) * 100 : 50}%`;
  ripple.style.top = `${event.detail ? ((event.clientY - rect.top) / rect.height) * 100 : 50}%`;
  target.append(ripple);

  const animation = ripple.animate([
    { transform: "translate(-50%, -50%) scale(0)", opacity: 1 },
    { transform: "translate(-50%, -50%) scale(1)", opacity: 0 }
  ], { duration, easing: "ease-out" });
  animation.addEventListener("finish", () => ripple.remove());
  animation.addEventListener("cancel", () => ripple.remove());
  return animation;
}

function runAfterRipple(event, target, action) {
  if (pendingRipple) return;
  const animation = playRipple(event, target, 250);
  if (!animation) {
    action();
    return;
  }
  pendingRipple = animation;
  animation.addEventListener("finish", () => {
    if (pendingRipple !== animation) return;
    pendingRipple = null;
    action();
  });
}

function initRipples() {
  const managedButtons = [
    ".selfCheckout__pay-btn", ".selfCheckout__cart-remove", ".selfCheckout__modal-close",
    ".selfCheckout__end-btn[data-href]", "[data-card-inserted]",
    ".selfCheckout__mode-btn[data-mode-next]", "[data-barcode-next]"
  ].join(", ");

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest("button, a[href]");
    if (!target || target.disabled || target.getAttribute("aria-disabled") === "true") return;
    if (pendingRipple && event.button === 0 && !event.ctrlKey && !event.metaKey &&
        !event.shiftKey && !event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (target instanceof HTMLButtonElement && !target.matches(managedButtons)) {
      playRipple(event, target);
    }
  }, true);

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || link.getAttribute("aria-disabled") === "true" ||
        event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey ||
        event.altKey || link.hasAttribute("download") ||
        (link.target && link.target !== "_self")) return;
    if (link.getAttribute("href").startsWith("#") || link.protocol === "javascript:") {
      playRipple(event, link);
      return;
    }
    event.preventDefault();
    runAfterRipple(event, link, () => {
      location.href = link.href;
    });
  });

  window.addEventListener("pagehide", () => {
    if (pendingRipple) pendingRipple.cancel();
    pendingRipple = null;
  });
}

// 바코드 스캔 시 순서대로 추가되는 상품 (끝나면 처음부터 반복)
const SCAN_PRODUCTS = [
  { name: "두부", price: 2500 },
  { name: "사과", price: 5000 },
  { name: "라면", price: 1200 },
  { name: "콜라", price: 2000 },
  { name: "식빵", price: 3000 },
];
let scanIndex = 0;

/* ---------- 요소 가져오기 ---------- */
const getList = () => document.querySelector(".selfCheckout__cart-list");
const getItems = () => [...getList().querySelectorAll(".selfCheckout__cart-item")];
const getSummary = (key) => document.querySelector(`[data-summary="${key}"]`);

/* ---------- 계산 ---------- */
const formatWon = (n) => n.toLocaleString("ko-KR") + "원";

// 입력값 → 1 ~ MAX_QTY 사이 숫자
const toQty = (value) => {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? 1 : Math.min(Math.max(n, 1), MAX_QTY);
};

const getQty = (item) => toQty(item.querySelector(".selfCheckout__qty-count").value);
const getSubtotal = (item) => Number(item.dataset.price) * getQty(item);
const getCartTotals = () => {
  const items = getItems();
  const sum = items.reduce((acc, item) => acc + getSubtotal(item), 0);
  return {
    totalQuantity: items.reduce((acc, item) => acc + getQty(item), 0),
    paymentAmount: Math.max(sum - DISCOUNT, 0),
    sum,
  };
};

/* ---------- 화면 그리기 ---------- */
// 한 줄: 수량, 줄 금액, -/+ 버튼 상태
function renderItem(item) {
  const qty = getQty(item);
  const minus = item.querySelector(".selfCheckout__qty-btn--minus");
  const plus = item.querySelector(".selfCheckout__qty-btn--plus");

  item.querySelector(".selfCheckout__qty-count").value = qty;
  item.querySelector(".selfCheckout__cart-total").textContent = formatWon(getSubtotal(item));

  minus.classList.toggle("is-disabled", qty <= 1);
  minus.disabled = qty <= 1;
  plus.disabled = qty >= MAX_QTY;
}

// 합계 / 할인 / 결제
function renderSummary() {
  const { sum, paymentAmount } = getCartTotals();

  getSummary("sum").textContent = formatWon(sum);
  getSummary("discount").textContent = formatWon(DISCOUNT);
  getSummary("pay").textContent = formatWon(paymentAmount);
}

function render() {
  getItems().forEach(renderItem);
  renderSummary();
}

// 목록 영역에 새 줄이 들어갈 자리가 있는지
function isListFull() {
  const list = getList();
  const items = getItems();
  if (items.length === 0) return false;

  const usedHeight = items.reduce((acc, item) => {
    const marginBottom = parseFloat(getComputedStyle(item).marginBottom) || 0;
    return acc + item.offsetHeight + marginBottom;
  }, 0);
  const newItemHeight = items[items.length - 1].offsetHeight;

  return usedHeight + newItemHeight > list.clientHeight;
}

/* ---------- 상품 추가 (바코드 스캔) ---------- */
function createItem({ name, price }) {
  const li = document.createElement("li");
  li.className = "selfCheckout__cart-item";
  li.dataset.price = price;
  li.innerHTML = `
    <span class="selfCheckout__cart-name"></span>
    <span class="selfCheckout__cart-price"></span>
    <div class="selfCheckout__cart-qty">
      <button type="button" class="selfCheckout__qty-btn selfCheckout__qty-btn--minus" aria-label="수량 감소"></button>
      <input type="text" class="selfCheckout__qty-count" value="1" inputmode="numeric" maxlength="2" aria-label="수량" />
      <button type="button" class="selfCheckout__qty-btn selfCheckout__qty-btn--plus" aria-label="수량 증가"></button>
    </div>
    <strong class="selfCheckout__cart-total"></strong>
    <button type="button" class="selfCheckout__cart-remove" aria-label="${name} 삭제"></button>
  `;
  // 상품명은 textContent로 넣어 HTML 삽입 방지
  li.querySelector(".selfCheckout__cart-name").textContent = name;
  li.querySelector(".selfCheckout__cart-price").textContent = price.toLocaleString("ko-KR");
  return li;
}

const findItemByName = (name) =>
  getItems().find((item) => item.querySelector(".selfCheckout__cart-name").textContent === name);

// 마지막으로 스캔한 줄만 강조
const highlightOnly = (target) =>
  getItems().forEach((item) => item.classList.toggle("is-highlight", item === target));

function onScan() {
  const product = SCAN_PRODUCTS[scanIndex++ % SCAN_PRODUCTS.length];
  let item = findItemByName(product.name);
  if (isListFull()) return;
  
  if (item) {
    // 이미 있는 상품이면 수량 +1
    const input = item.querySelector(".selfCheckout__qty-count");
    input.value = toQty(getQty(item) + 1);
  } else {
    item = createItem(product);
    getList().appendChild(item);
  }

  highlightOnly(item);
  render();
  getList().scrollTop = getList().scrollHeight;
}

/* ---------- 수량 조절 ---------- */
// -, + 버튼
function onQtyButtonClick(e) {
  const btn = e.target.closest(".selfCheckout__qty-btn");
  if (!btn || btn.disabled) return;

  const item = btn.closest(".selfCheckout__cart-item");
  const delta = btn.classList.contains("selfCheckout__qty-btn--plus") ? 1 : -1;

  item.querySelector(".selfCheckout__qty-count").value = toQty(getQty(item) + delta);
  render();
}

// 직접 입력: 숫자만 허용, 입력 중 빈 값은 허용
function onQtyInput(e) {
  if (!e.target.matches(".selfCheckout__qty-count")) return;

  e.target.value = e.target.value.replace(/[^0-9]/g, "");
  if (e.target.value !== "") render();
}

// 입력 끝났을 때(빈 값/0 → 1 보정)
function onQtyCommit(e) {
  if (e.target.matches(".selfCheckout__qty-count")) render();
}
function onRemoveClick(e) {
  const btn = e.target.closest(".selfCheckout__cart-remove");
  if (!btn) return;

  runAfterRipple(e, btn, () => {
    btn.closest(".selfCheckout__cart-item").remove();
    keepLastHighlight();
    render();
  });
}

// 강조된 줄이 삭제돼서 없어지면, 목록의 마지막 줄을 강조
function keepLastHighlight() {
  const items = getItems();
  if (items.length === 0 || items.some((item) => item.classList.contains("is-highlight"))) return;

  highlightOnly(items[items.length - 1]);
}

/* ---------- 결제하기 (ice-03 → ice-04) ---------- */
function onPayClick() {
  const { totalQuantity, paymentAmount } = getCartTotals();
  try {
    sessionStorage.setItem(CHECKOUT_PAYMENT_KEY, JSON.stringify({ totalQuantity, paymentAmount }));
  } catch (error) {
    console.error("결제 정보를 저장하지 못했습니다.", error);
  }
  location.href = "./ice-04.html";
}

/* ---------- ice-04 결제수단 선택 모달 ---------- */
const getModal = () => document.querySelector("#payModal");

const openModal = () => getModal().classList.add("is-open");
const closeModal = () => getModal().classList.remove("is-open");

// 카드결제 / 앱카드 선택 표시
function onModeClick(e) {
  const btn = e.target.closest(".selfCheckout__mode-btn");
  if (!btn) return;

  if (btn.dataset.modeNext) {
    runAfterRipple(e, btn, () => {
      location.href = btn.dataset.modeNext;
    });
    return;
  }

  document.querySelectorAll(".selfCheckout__mode-btn").forEach((el) => {
    el.classList.toggle("is-active", el === btn);
  });
}

// X 버튼: 이전 화면으로 복귀
function onModalCloseClick(e) {
  const button = e.currentTarget;
  runAfterRipple(e, button, () => {
    closeModal();
    location.href = button.dataset.closeNext || "./ice-03.html";
  });
}

/* ---------- 초기화 ---------- */
// ice-03: 주문내역
function bindCartEvents() {
  const list = getList();

  document.querySelector(".selfCheckout__barcode-btn").addEventListener("click", onScan);
  document.querySelector(".selfCheckout__pay-btn").addEventListener("click", (event) => {
    runAfterRipple(event, event.currentTarget, onPayClick);
  });
  list.addEventListener("click", onQtyButtonClick);
  list.addEventListener("input", onQtyInput);
  list.addEventListener("change", onQtyCommit);
  list.addEventListener("focusout", onQtyCommit);
  list.addEventListener("click", onRemoveClick);
}

function initCart() {
  bindCartEvents();
  render();
}

// ice-04 ~ ice-08: 결제 모달
function initPayModal() {
  const mode = document.querySelector(".selfCheckout__modal-mode");
  const cardButton = document.querySelector("[data-card-inserted]");
  if (mode) mode.addEventListener("click", onModeClick);
  if (cardButton) {
    cardButton.addEventListener("click", (event) => {
      runAfterRipple(event, cardButton, () => {
        location.href = cardButton.dataset.next;
      });
    });
    try {
      const payment = JSON.parse(sessionStorage.getItem(CHECKOUT_PAYMENT_KEY));
      if (payment && Number.isSafeInteger(payment.totalQuantity) && payment.totalQuantity >= 0 &&
          Number.isSafeInteger(payment.paymentAmount) && payment.paymentAmount >= 0) {
        document.querySelector("[data-payment-quantity]").textContent = `${payment.totalQuantity.toLocaleString("ko-KR")}개`;
        document.querySelector("[data-payment-amount]").textContent = formatWon(payment.paymentAmount);
      } else {
        console.warn("표시할 결제 정보가 없습니다.");
      }
    } catch (error) {
      console.error("결제 정보를 읽지 못했습니다.", error);
    }
  }
  const closeButton = document.querySelector(".selfCheckout__modal-close");
  if (closeButton) closeButton.addEventListener("click", onModalCloseClick);
  openModal();
  const next = getModal().dataset.paymentNext;
  if (next) {
    setTimeout(() => {
      location.href = next;
    }, 3000);
  }
}

// 페이지에 있는 요소를 기준으로 해당 화면만 초기화 (ice-02는 해당 없음)
function init() {
  initRipples();

  if (document.querySelector(".selfCheckout__section--end")) {
    try {
      sessionStorage.removeItem(CHECKOUT_PAYMENT_KEY);
    } catch (error) {
      console.error("결제 정보를 삭제하지 못했습니다.", error);
    }
  }

  document.querySelectorAll(".selfCheckout__end-btn[data-href]").forEach((button) => {
    button.addEventListener("click", (event) => {
      runAfterRipple(event, button, () => {
        location.href = button.dataset.href;
      });
    });
  });

  const barcodeNext = document.querySelector("[data-barcode-next]");
  if (barcodeNext) {
    barcodeNext.addEventListener("click", (event) => {
      runAfterRipple(event, barcodeNext, () => {
        location.href = barcodeNext.dataset.barcodeNext;
      });
    });
  }

  if (getModal()) {
    initPayModal();
  } else if (getList()) {
    initCart();
  }
}

document.addEventListener("DOMContentLoaded", init);