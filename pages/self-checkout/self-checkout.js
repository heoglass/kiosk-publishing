document.addEventListener("DOMContentLoaded", () => {
  "use strict";

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

      minusButton.addEventListener("click", () => {
        if (quantity > 1) changeQuantity(-1);
      });

      plusButton.addEventListener("click", () => changeQuantity(1));

      removeButton.addEventListener("click", () => {
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
      });

      renderQuantity();
      return row;
    }

    scanButton.addEventListener("click", () => {
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

    paymentButton.addEventListener("click", () => {
      window.location.assign("./self-checkout_02.html");
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

      if (digits.length === 11) {
        window.location.assign(skipLink.href);
      }
    }

    for (const button of keypad.querySelectorAll(
      "button[data-self-checkout-phone-key], button[data-phone-key]"
    )) {
      button.addEventListener("click", () => {
        const digits = phoneInput.value.replace(/\D/g, "");
        const key =
          button.dataset.selfCheckoutPhoneKey ?? button.dataset.phoneKey;
        const nextDigits =
          key === "delete" ? digits.slice(0, -1) : digits + key;
        updatePhoneNumber(nextDigits);
      });
    }

    phoneInput.addEventListener("input", () => {
      updatePhoneNumber(phoneInput.value);
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

    insertCard.addEventListener("click", () => {
      if (progress.open || complete.open || receipt.open) return;

      progress.showModal();
      window.setTimeout(() => {
        if (progress.open) switchDialog(progress, complete);
      }, 2000);
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

  initScanPage();
  initPhonePage();
  initPaymentPage();
});
