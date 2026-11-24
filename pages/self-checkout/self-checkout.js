document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  let pendingAction = null;
  const activeRipples = new Set();

  // cafe.js와 동일하게 클릭 위치에서 원이 퍼지며 사라지는 리플입니다.
  function playRipple(event, target, duration = 700) {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof target.animate !== "function"
    )
      return null;

    target.classList.add("self-checkout-ripple-target");
    if (
      target.matches(
        ".self-checkout-quantity-minus, .self-checkout-quantity-plus, .self-checkout-product-remove, .self-checkout-scan-button, .self-checkout-method, .self-checkout-phone-keypad button, .self-checkout-flow-back, .self-checkout-payment-image-button"
      )
    ) {
      target.classList.add("self-checkout-ripple-light");
    }
    if (getComputedStyle(target).position === "static") {
      target.style.position = "relative";
    }
    const rect = target.getBoundingClientRect();
    const size = Math.hypot(target.clientWidth, target.clientHeight) * 2;
    const x = event.detail
      ? ((event.clientX - rect.left) / (rect.width || 1)) * 100
      : 50;
    const y = event.detail
      ? ((event.clientY - rect.top) / (rect.height || 1)) * 100
      : 50;
    const ripple = document.createElement("span");
    ripple.className = "self-checkout-button-ripple";
    ripple.setAttribute("aria-hidden", "true");
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}%`;
    ripple.style.top = `${y}%`;
    target.append(ripple);

    const animation = ripple.animate(
      [
        { transform: "translate(-50%, -50%) scale(0)", opacity: 1 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 0 },
      ],
      { duration, easing: "ease-out" }
    );
    activeRipples.add(animation);
    function cleanUp() {
      ripple.remove();
      activeRipples.delete(animation);
    }
    animation.addEventListener("finish", cleanUp);
    animation.addEventListener("cancel", cleanUp);
    return animation;
  }

  function afterRipple(event, target, action, duration = 350) {
    event.preventDefault();
    if (target.matches(":disabled") || pendingAction) return;
    const animation = playRipple(event, target, duration);
    if (!animation) {
      action();
      return;
    }
    pendingAction = animation;
    animation.addEventListener("finish", () => {
      if (pendingAction !== animation) return;
      pendingAction = null;
      action();
    });
    animation.addEventListener("cancel", () => {
      if (pendingAction === animation) pendingAction = null;
    });
  }

  window.addEventListener("pagehide", () => {
    pendingAction?.cancel();
    pendingAction = null;
    Array.from(activeRipples).forEach((animation) => animation.cancel());
  });

  function initScanPage() {
    const scanButton = document.getElementById("self-checkout-scan-button");
    if (!scanButton) return;

    const selfCheckoutCatalog = [
      { name: "서울우유", price: 3500, quantity: 1 },
      { name: "감자", price: 1000, quantity: 1 },
      { name: "계란 30개", price: 10000, quantity: 1 },
      { name: "애호박", price: 1000, quantity: 1 },
      { name: "오이맛고추", price: 3500, quantity: 1 },
    ];

    const productList = document.getElementById("self-checkout-products");
    const rowTemplate = document.getElementById(
      "self-checkout-product-template"
    )?.content?.firstElementChild;
    const emptyMessage = document.getElementById("self-checkout-empty");
    const itemCount = document.getElementById("self-checkout-item-count");
    const subtotal = document.getElementById("self-checkout-subtotal");
    const paymentTotal = document.getElementById("self-checkout-total");
    const scanStatus = document.getElementById("self-checkout-scan-status");
    const paymentButton = document.querySelector(".self-checkout-pay-button");
    if (
      !productList ||
      !rowTemplate ||
      !emptyMessage ||
      !itemCount ||
      !subtotal ||
      !paymentTotal ||
      !scanStatus ||
      !paymentButton
    )
      return;

    const numberFormat = new Intl.NumberFormat("ko-KR");

    let availableProducts = [...selfCheckoutCatalog];
    let totalQuantity = 0;
    let totalPrice = 0;

    function updateSummary(quantityChange, priceChange) {
      totalQuantity += quantityChange;
      totalPrice += priceChange;

      const isEmpty = totalQuantity === 0;
      if (isEmpty) availableProducts = [...selfCheckoutCatalog];

      emptyMessage.hidden = !isEmpty;
      productList.hidden = isEmpty;
      itemCount.textContent = totalQuantity;

      const formattedTotal = `${numberFormat.format(totalPrice)}원`;
      subtotal.textContent = formattedTotal;
      paymentTotal.textContent = formattedTotal;
    }

    function createProductRow(product) {
      const row = rowTemplate.cloneNode(true);
      const quantityValue = row.querySelector(".self-checkout-quantity-value");
      const lineTotal = row.querySelector(".self-checkout-product-total");
      const minusButton = row.querySelector(".self-checkout-quantity-minus");
      const minusIcon = minusButton.querySelector("img");
      const disabledMinusSrc = "../../shared/images/icon/minus-disabled.png";
      const enabledMinusSrc = "../../shared/images/icon/minus.png";
      const plusButton = row.querySelector(".self-checkout-quantity-plus");
      const removeButton = row.querySelector(".self-checkout-product-remove");
      let quantity = product.quantity;

      row.querySelector(".self-checkout-product-name").textContent =
        product.name;
      row.querySelector(".self-checkout-product-price").textContent =
        numberFormat.format(product.price);
      minusButton.setAttribute("aria-label", `${product.name} 수량 줄이기`);
      plusButton.setAttribute("aria-label", `${product.name} 수량 늘리기`);
      removeButton.setAttribute("aria-label", `${product.name} 삭제`);

      function renderQuantity() {
        quantityValue.textContent = quantity;
        lineTotal.textContent = `${numberFormat.format(
          product.price * quantity
        )}원`;
        const isMinimum = quantity === 1;
        minusButton.disabled = isMinimum;
        minusIcon.src = isMinimum ? disabledMinusSrc : enabledMinusSrc;
      }

      function changeQuantity(amount) {
        quantity += amount;
        renderQuantity();
        updateSummary(amount, product.price * amount);
        scanStatus.textContent = `${product.name} 수량 ${quantity}개`;
      }

      minusButton.addEventListener("click", (event) => {
        if (minusButton.disabled || pendingAction || quantity <= 1) return;
        playRipple(event, minusButton);
        changeQuantity(-1);
      });

      plusButton.addEventListener("click", (event) => {
        if (plusButton.disabled || pendingAction) return;
        playRipple(event, plusButton);
        changeQuantity(1);
      });

      removeButton.addEventListener("click", (event) => {
        afterRipple(
          event,
          removeButton,
          () => {
            const adjacentRow =
              row.nextElementSibling ?? row.previousElementSibling;
            row.remove();
            availableProducts.push(product);
            updateSummary(-quantity, -product.price * quantity);
            scanStatus.textContent = `${product.name} 삭제. 총 ${totalQuantity}개`;

            const nextFocus = adjacentRow?.querySelector(
              ".self-checkout-product-remove"
            );
            (nextFocus ?? scanButton).focus();
          },
          250
        );
      });

      renderQuantity();
      return row;
    }

    scanButton.addEventListener("click", (event) => {
      if (scanButton.disabled || pendingAction) return;
      playRipple(event, scanButton);
      const [product] = availableProducts;
      if (!product) return;

      const row = createProductRow(product);
      productList.lastElementChild?.classList.remove("is-new");
      row.classList.add("is-new");
      productList.append(row);

      availableProducts.shift();
      updateSummary(product.quantity, product.price * product.quantity);
      scanStatus.textContent = `${product.name} 등록. 총 ${totalQuantity}개`;
    });

    paymentButton.addEventListener("click", (event) => {
      afterRipple(event, paymentButton, () => {
        window.location.assign("./self-checkout_02.html");
      });
    });
  }

  function initPhonePage() {
    const phoneInput = document.getElementById("self-checkout-phone-number");
    const keypad = document.getElementById("self-checkout-phone-keypad");
    const skipLink = document.getElementById("self-checkout-points-skip");
    if (!phoneInput || !keypad || !skipLink) return;

    function updatePhoneNumber(value) {
      const digits = value.replace(/\D/g, "").slice(0, 11);

      phoneInput.value = [
        digits.slice(0, 3),
        digits.slice(3, 7),
        digits.slice(7),
      ]
        .filter(Boolean)
        .join("-");

      return digits.length === 11;
    }

    for (const button of keypad.querySelectorAll(
      "button[data-self-checkout-phone-key], button[data-phone-key]"
    )) {
      button.addEventListener("click", (event) => {
        if (button.disabled || pendingAction) return;
        const digits = phoneInput.value.replace(/\D/g, "");
        const key =
          button.dataset.selfCheckoutPhoneKey ?? button.dataset.phoneKey;
        const nextDigits =
          key === "delete" ? digits.slice(0, -1) : digits + key;
        if (updatePhoneNumber(nextDigits)) {
          afterRipple(
            event,
            button,
            () => {
              window.location.assign(skipLink.href);
            },
            250
          );
        } else {
          playRipple(event, button);
        }
      });
    }

    phoneInput.addEventListener("input", () => {
      if (pendingAction) return;
      if (updatePhoneNumber(phoneInput.value)) {
        window.location.assign(skipLink.href);
      }
    });
  }

  function initPaymentPage() {
    const insertCard = document.getElementById("self-checkout-card-insert");
    const removeCard = document.getElementById("self-checkout-card-remove");
    const progress = document.getElementById("self-checkout-payment-progress");
    const complete = document.getElementById("self-checkout-payment-complete");
    const receipt = document.getElementById("self-checkout-receipt");
    const closeReceipt = document.getElementById("self-checkout-receipt-close");

    if (
      !insertCard ||
      !removeCard ||
      !progress ||
      !complete ||
      !receipt ||
      !closeReceipt
    )
      return;

    function switchDialog(current, next) {
      current.close();
      next.showModal();
    }

    insertCard.addEventListener("click", (event) => {
      if (progress.open || complete.open || receipt.open) return;
      afterRipple(
        event,
        insertCard,
        () => {
          progress.showModal();
          window.setTimeout(() => {
            if (progress.open) switchDialog(progress, complete);
          }, 2000);
        },
        250
      );
    });

    removeCard.addEventListener("click", () => {
      if (complete.open) switchDialog(complete, receipt);
    });

    closeReceipt.addEventListener("click", () => receipt.close());

    progress.addEventListener("cancel", (event) => event.preventDefault());
    complete.addEventListener("cancel", (event) => event.preventDefault());
    receipt.addEventListener("cancel", (event) => {
      event.preventDefault();
      switchDialog(receipt, complete);
    });
  }
  const martCardInsert = document.getElementById("mart-card-insert");

  if (martCardInsert && window.lottie && window.martCardInsertData) {
    const cardAnimation = window.lottie.loadAnimation({
      container: martCardInsert,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: window.martCardInsertData,
    });

    cardAnimation.setSpeed(1);
  }
  initScanPage();
  initPhonePage();
  initPaymentPage();

  // 표시된 시작·조회 방법·이전/다음·완료 링크에 리플을 적용합니다.
  document
    .querySelectorAll(
      "a.move-01, a.self-checkout-method-active, a.self-checkout-flow-button, .complete-actions #experience-retry, .complete-actions .self-checkout-first-btn"
    )
    .forEach((link) => {
      link.addEventListener(
        "click",
        (event) => {
          if (
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey ||
            (event.button != null && event.button !== 0)
          )
            return;
          event.stopImmediatePropagation();
          afterRipple(event, link, () => window.location.assign(link.href));
        },
        { capture: true }
      );
    });
});
