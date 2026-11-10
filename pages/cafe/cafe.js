document.addEventListener("DOMContentLoaded", () => {
  const PAGES = {
    start: "./index.html",
    menu: "./cafe_01.html",
    options: "./cafe_02.html",
    review: "./cafe_03.html",
    main: "../../index.html",
  };
  const CART_KEY = "kiosk-cafe-cart";
  const formatPrice = (price) => `${price.toLocaleString("ko-KR")}원`;
  const readPrice = (element) =>
    Number(element.textContent.replace(/[^\d]/g, ""));
  const moveTo = (path) => {
    window.location.href = path;
  };
  let pendingNavigation = null;
  const start = document.getElementById("category-start-screen");
  const menu = document.getElementById("screen-menu");
  const options = document.getElementById("screen-options");
  const review = document.getElementById("screen-review");

  [start, menu, options, review].forEach((screen) => {
    if (screen) screen.hidden = false;
  });

  // common.js의 뒤로가기와 중복 이동하지 않도록 현재 페이지 이동을 우선합니다.
  if (start || menu || options || review) {
    document.getElementById("header-back")?.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        moveTo(start ? PAGES.main : menu ? PAGES.start : PAGES.menu);
      },
      { capture: true }
    );
  }
  start
    ?.querySelector(".category-start")
    ?.addEventListener("click", (event) => {
      moveAfterRipple(event, event.currentTarget, PAGES.menu, 350, () => {
        saveCart([]);
      });
    });
  window.addEventListener("pagehide", () => {
    pendingNavigation?.cancel();
    pendingNavigation = null;
  });

  if (menu) {
    initMenuTabs(menu);
    initCart(menu);
  }
  if (options) initOptions(options);
  if (review) initReview(review);

  function playRipple(event, button, duration = 700) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return null;
    }

    if (getComputedStyle(button).position === "static") {
      button.style.position = "relative";
    }
    const rect = button.getBoundingClientRect();
    const size = Math.hypot(button.clientWidth, button.clientHeight) * 2;
    const x = event.detail
      ? ((event.clientX - rect.left) / rect.width) * 100
      : 50;
    const y = event.detail
      ? ((event.clientY - rect.top) / rect.height) * 100
      : 50;
    const ripple = document.createElement("span");
    ripple.className = "cafe-button-ripple";
    ripple.setAttribute("aria-hidden", "true");
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}%`;
    ripple.style.top = `${y}%`;
    button.append(ripple);

    const animation = ripple.animate(
      [
        { transform: "translate(-50%, -50%) scale(0)", opacity: 1 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 0 },
      ],
      { duration, easing: "ease-out" }
    );
    animation.addEventListener("finish", () => ripple.remove());
    animation.addEventListener("cancel", () => ripple.remove());
    return animation;
  }

  function moveAfterRipple(event, button, path, duration, beforeMove) {
    if (pendingNavigation) return;

    const navigate = () => {
      beforeMove?.();
      moveTo(path);
    };
    const animation = playRipple(event, button, duration);
    if (!animation) {
      navigate();
      return;
    }

    pendingNavigation = animation;
    animation.addEventListener("finish", () => {
      if (pendingNavigation === animation) navigate();
    });
  }

  function loadCart() {
    const saved = sessionStorage.getItem(CART_KEY);
    if (!saved) return [];

    try {
      const cart = JSON.parse(saved);
      return Array.isArray(cart) ? cart : [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function addCartItem({ id, name, price, options = "" }) {
    const cart = loadCart();
    const item = cart.find(
      (entry) =>
        entry.id === id && entry.price === price && entry.options === options
    );
    if (item) item.quantity += 1;
    else cart.push({ id, name, price, options, quantity: 1 });
    saveCart(cart);
  }

  function updateTotals(cart, countLabel, priceLabel) {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    countLabel.textContent = `${count}개`;
    priceLabel.textContent = formatPrice(total);
  }

  function showItemOptions(row, options) {
    const label = row.querySelector(".order-item-options");
    label.textContent = options;
    label.hidden = !options;
  }

  function initMenuTabs(screen) {
    const track = screen.querySelector(".menu-track");
    const nav = screen.querySelector(".menu-tab");
    const dots = screen.querySelector(".menu-pagination");
    const prev = screen.querySelector(".menu-prev");
    const next = screen.querySelector(".menu-next");
    if (!track || !nav || !dots || !prev || !next) return;

    const cards = Array.from(track.querySelectorAll(".cafe-menu-card"));
    const PAGE_SIZE = 6;
    let pageIndex = 0;

    function showPage(index) {
      const pages = Array.from(track.children);
      if (index < 0 || index >= pages.length) return;
      pageIndex = index;
      track.style.transform = `translateX(-${pageIndex * 100}%)`;
      prev.disabled = pageIndex === 0;
      next.disabled = pageIndex === pages.length - 1;
      pages.forEach((page, i) => {
        page.inert = i !== pageIndex;
        page.setAttribute("aria-hidden", String(i !== pageIndex));
      });
      dots.querySelectorAll(".menu-dot").forEach((dot, i) => {
        dot.classList.toggle("is-active", i === pageIndex);
        if (i === pageIndex) dot.setAttribute("aria-current", "page");
        else dot.removeAttribute("aria-current");
      });
    }

    function showCategory(category) {
      const visibleCards = cards.filter(
        (card) => category === "all" || card.dataset.category === category
      );
      const oldTransition = track.style.transition;
      track.style.transition = "none";
      track.replaceChildren();
      dots.replaceChildren();
      for (let i = 0; i < visibleCards.length; i += PAGE_SIZE) {
        const page = document.createElement("div");
        page.className = "menu-page";
        page.append(...visibleCards.slice(i, i + PAGE_SIZE));
        track.append(page);
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "menu-dot";
        dot.dataset.page = String(i / PAGE_SIZE);
        dot.setAttribute("aria-label", `${i / PAGE_SIZE + 1}페이지로 이동`);
        dots.append(dot);
      }
      nav.querySelectorAll("[data-category]").forEach((button) => {
        const active = button.dataset.category === category;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      pageIndex = 0;
      track.style.transform = "translateX(0)";
      prev.disabled = true;
      next.disabled = track.children.length <= 1;
      showPage(0);
      void track.offsetWidth;
      track.style.transition = oldTransition;
    }

    nav.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-category]");
      if (button) showCategory(button.dataset.category);
    });
    prev.addEventListener("click", () => showPage(pageIndex - 1));
    next.addEventListener("click", () => showPage(pageIndex + 1));
    dots.addEventListener("click", (event) => {
      const dot = event.target.closest(".menu-dot");
      if (dot) showPage(Number(dot.dataset.page));
    });
    showCategory("all");
  }

  function initCart(screen) {
    const list = screen.querySelector(".cart-list");
    const template = screen.querySelector("#cart-demo-template");
    const clear = screen.querySelector(".cart-clear");
    const submit = screen.querySelector(".order-submit");
    const countLabel = screen.querySelector(".order-count");
    const priceLabel = screen.querySelector(".order-total");
    let cart = [];

    function updateCartSummary() {
      updateTotals(cart, countLabel, priceLabel);
      clear.disabled = submit.disabled = cart.length === 0;
    }

    function updateCartRow(row, item) {
      row.querySelector(".cart-quantity-value").textContent = item.quantity;
      row.querySelector(".cart-item-price").textContent = formatPrice(
        item.price * item.quantity
      );
      const decrease = row.querySelector(".cart-decrease");
      decrease.disabled = item.quantity <= 1;
      decrease.querySelector(
        ".cart-minus-image"
      ).src = `../../shared/images/icon/minus${
        decrease.disabled ? "-disabled" : ""
      }.png`;
    }

    function renderCart() {
      cart = loadCart();
      const rows = cart.map((item) => {
        const row = template.content.firstElementChild.cloneNode(true);
        row.querySelector(".cart-item-label").textContent = item.name;
        row
          .querySelector(".cart-remove")
          .setAttribute("aria-label", `${item.name} 삭제`);
        showItemOptions(row, item.options);
        updateCartRow(row, item);
        return row;
      });
      list.replaceChildren(...rows);
      updateCartSummary();
    }

    list.addEventListener("click", (event) => {
      if (pendingNavigation) return;
      const button = event.target.closest("button");
      const row = button?.closest(".cart-item");
      if (!row || button.disabled) return;
      const index = Array.from(list.children).indexOf(row);
      const item = cart[index];
      if (button.matches(".cart-remove")) {
        cart.splice(index, 1);
        row.remove();
      } else {
        item.quantity += button.matches(".cart-increase") ? 1 : -1;
        updateCartRow(row, item);
      }
      saveCart(cart);
      updateCartSummary();
    });
    clear.addEventListener("click", () => {
      if (pendingNavigation) return;
      saveCart([]);
      renderCart();
    });
    submit.addEventListener("click", (event) => {
      if (submit.disabled) return;
      moveAfterRipple(event, submit, PAGES.review);
    });

    screen.querySelector(".menu-track")?.addEventListener("click", (event) => {
      const card = event.target.closest(".cafe-menu-card");
      if (!card || card.disabled || pendingNavigation) return;
      if (
        ["coffee-01", "coffee-02", "coffee-04", "coffee-07"].includes(
          card.dataset.menuId
        )
      ) {
        moveAfterRipple(
          event,
          card,
          `${PAGES.options}?menu=${encodeURIComponent(card.dataset.menuId)}`
        );
        return;
      }
      playRipple(event, card);
      addCartItem({
        id: card.dataset.menuId,
        name: card.querySelector(".menu-card-name").textContent.trim(),
        price: readPrice(card.querySelector(".menu-card-price")),
      });
      renderCart();
    });
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) renderCart();
    });
    renderCart();
  }

  function initOptions(screen) {
    const form = screen.querySelector("#option-form");
    if (!form) return;
    const products = Array.from(
      screen.querySelectorAll(".option-product[data-menu-id]")
    );
    const requestedId =
      new URLSearchParams(window.location.search).get("menu") || "coffee-01";
    const selected =
      products.find((product) => product.dataset.menuId === requestedId) ||
      products[0];
    if (selected) {
      products.forEach((product) => {
        product.hidden = product !== selected;
        product.style.display = product === selected ? "" : "none";
      });
      form.dataset.price = selected.dataset.price;
      screen.setAttribute(
        "aria-labelledby",
        selected.querySelector(".option-title").id
      );
      screen
        .querySelectorAll(".option-groups[data-option-type]")
        .forEach((group) => {
          const active =
            group.dataset.optionType === selected.dataset.optionType;
          group.hidden = !active;
          group.style.display = active ? "" : "none";
          group.querySelectorAll("fieldset").forEach((fieldset) => {
            fieldset.disabled = !active;
          });
        });
    }
    const optionTotal = screen.querySelector(".option-total");
    const submit = form.querySelector(".option-submit");
    let submitClickEvent = null;

    function selectedOptions() {
      return Array.from(form.querySelectorAll("input:checked:not(:disabled)"));
    }
    function priceWithOptions(inputs) {
      return inputs.reduce(
        (total, input) => total + Number(input.dataset.price || 0),
        Number(form.dataset.price)
      );
    }
    function updatePrice() {
      optionTotal.textContent = formatPrice(
        priceWithOptions(selectedOptions())
      );
    }
    form.addEventListener("change", updatePrice);

    form.addEventListener("click", (event) => {
      const choice = event.target.closest(".option-choice");
      const radio = choice?.querySelector('input[type="radio"]');
      if (!radio || radio.matches(":disabled") || pendingNavigation) return;

      // 라벨에서 라디오로 전달된 클릭은 건너뛰어 리플 중복을 막습니다.
      if (event.target === radio) return;
      playRipple(event, choice);
    });

    form.querySelector(".option-cancel")?.addEventListener("click", () => {
      if (pendingNavigation) return;
      moveTo(PAGES.menu);
    });

    submit.addEventListener("click", (event) => {
      event.preventDefault();
      if (pendingNavigation) return;

      // 터치 좌표를 보존하면서 폼 검증과 submit 이벤트를 실행합니다.
      submitClickEvent = event;
      try {
        form.requestSubmit(submit);
      } finally {
        submitClickEvent = null;
      }
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!selected || submit.disabled || pendingNavigation) return;

      const inputs = selectedOptions();
      const item = {
        id: selected.dataset.menuId,
        name: selected.querySelector(".option-product-name").textContent.trim(),
        price: priceWithOptions(inputs),
        options: inputs
          .map((input) =>
            input
              .closest(".option-choice")
              .querySelector(".option-choice-label")
              .textContent.trim()
          )
          .join(" · "),
      };

      moveAfterRipple(
        submitClickEvent ?? { detail: 0 },
        submit,
        PAGES.menu,
        250,
        () => {
          addCartItem(item);
          submit.disabled = true;
        }
      );
    });
    window.addEventListener("pageshow", (event) => {
      if (!event.persisted) return;
      submit.disabled = false;
      updatePrice();
    });
    updatePrice();
  }

  function initReview(screen) {
    const list = screen.querySelector(".review-list");
    const template = screen.querySelector("#review-item-template");
    const countLabel = screen.querySelector(".review-total-count");
    const priceLabel = screen.querySelector(".review-total-price");

    function renderReview() {
      const cart = loadCart();
      const rows = cart.map((item) => {
        const row = template.content.firstElementChild.cloneNode(true);
        row.querySelector(".review-item-name").textContent = item.name;
        row.querySelector(
          ".review-item-quantity"
        ).textContent = `${item.quantity}개`;
        row.querySelector(".review-item-price").textContent = formatPrice(
          item.price * item.quantity
        );
        showItemOptions(row, item.options);
        return row;
      });
      list.replaceChildren(...rows);
      updateTotals(cart, countLabel, priceLabel);
    }

    screen
      .querySelector(".recommend-list")
      .addEventListener("click", (event) => {
        const button = event.target.closest(".recommend-button");
        if (!button || button.disabled) return;

        playRipple(event, button);
        addCartItem({
          id: button.dataset.menuId,
          name: button.querySelector(".recommend-name").textContent.trim(),
          price: readPrice(button.querySelector(".recommend-price")),
        });
        renderReview();
      });
    screen.querySelector(".review-back")?.addEventListener("click", () => {
      moveTo(PAGES.menu);
    });
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) renderReview();
    });
    renderReview();
    initPaymentFlow(screen);
  }

  function initPaymentFlow(screen) {
    const dialogs = document.getElementById("cafe-payment-dialogs");
    if (!dialogs) return;

    const progress = dialogs.querySelector("#modal-payment-progress");
    const phone = dialogs.querySelector("#modal-points-phone");
    const phoneNumber = phone.querySelector("#points-phone-number");
    const phonePrefix = phone.querySelector('[data-phone-key="010"]');
    let paymentRipple = null;

    function setPhoneNumber(digits) {
      phoneNumber.value = [
        digits.slice(0, 3),
        digits.slice(3, 7),
        digits.slice(7),
      ]
        .filter(Boolean)
        .join("-");
      phoneNumber.classList.toggle("has-value", digits.length > 0);
      phonePrefix.disabled = digits.length > 0;
    }

    function showDialog(id) {
      const next = dialogs.querySelector("#" + id);
      const current = dialogs.querySelector("dialog[open]");
      if (!next || current === next) return;

      current?.close();
      if (next === phone) setPhoneNumber("");
      next.showModal();
    }

    function openPayment() {
      dialogs.querySelector(".card-payment-count").textContent =
        screen.querySelector(".review-total-count").textContent;
      dialogs.querySelector(".card-payment-total").textContent =
        screen.querySelector(".review-total-price").textContent;
      showDialog("modal-payment");
    }

    screen
      .querySelector(".review-bottom")
      .addEventListener("click", (event) => {
        const button = event.target.closest(".review-dine-in, .review-takeout");
        if (!button || button.disabled || paymentRipple) return;

        const animation = playRipple(event, button, 250);
        if (!animation) {
          openPayment();
          return;
        }

        paymentRipple = animation;
        animation.addEventListener("finish", () => {
          if (paymentRipple !== animation) return;
          paymentRipple = null;
          openPayment();
        });
      });
    window.addEventListener("pagehide", () => {
      paymentRipple?.cancel();
      paymentRipple = null;
    });

    dialogs
      .querySelector("#modal-receipt")
      .addEventListener("click", (event) => {
        if (event.target.closest(".receipt-choice")) saveCart([]);
      });

    progress.addEventListener("cancel", (event) => event.preventDefault());

    dialogs.addEventListener(
      "click",
      (event) => {
        const button = event.target.closest("button");
        if (!button || button.disabled || !button.closest("dialog[open]"))
          return;

        // 카페 팝업의 버튼은 공통 페이지 이동보다 먼저 처리합니다.
        event.stopPropagation();

        if (button.hasAttribute("data-modal-close")) {
          button.closest("dialog").close();
          return;
        }

        const next = button.dataset.cafeNext;
        if (next) {
          showDialog(next);
          if (progress.open) {
            window.setTimeout(() => {
              if (progress.open) showDialog("modal-payment-complete");
            }, 2000);
          }
          return;
        }

        const key = button.dataset.phoneKey;
        if (!key) return;

        const digits = phoneNumber.value.replace(/\D/g, "");
        const nextDigits =
          key === "delete" ? digits.slice(0, -1) : digits + key;
        if (nextDigits.length > 11) return;

        setPhoneNumber(nextDigits);
        if (nextDigits.length === 11) showDialog("modal-points-complete");
      },
      { capture: true }
    );
  }
});
