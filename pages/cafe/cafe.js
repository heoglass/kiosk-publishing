document.addEventListener("DOMContentLoaded", () => {
  const PAGES = {
    start: "./index.html",
    menu: "./menu.html",
    options: "./options.html",
    review: "./review.html",
    main: "../main/index.html",
  };
  const formatPrice = (price) => `${price.toLocaleString("ko-KR")}원`;
  const moveTo = (path) => {
    window.location.href = path;
  };
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
  start?.querySelector(".category-start")?.addEventListener("click", () => {
    moveTo(PAGES.menu);
  });

  if (menu) {
    initMenuTabs(menu);
    initCartDemo(menu);
  }
  if (options) initOptionsDemo(options);
  if (review) initReviewDemo(review);

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

  function initCartDemo(screen) {
    const list = screen.querySelector(".cart-list");
    const template = screen.querySelector("#cart-demo-template");
    const clear = screen.querySelector(".cart-clear");
    const submit = screen.querySelector(".order-submit");
    if (!list || !clear || !submit) return;

    // HTML에 작성한 예시 행의 수량·금액 표시만 갱신합니다.
    function updateCart() {
      let count = 0;
      let total = 0;
      list.querySelectorAll(".cart-item").forEach((row) => {
        const quantity = Number(
          row.querySelector(".cart-quantity-value").textContent
        );
        const price = Number(row.dataset.price);
        row.querySelector(".cart-item-price").textContent = formatPrice(
          price * quantity
        );
        row.querySelector(".cart-decrease").disabled = quantity <= 1;
        const image = row.querySelector(".cart-minus-image");
        if (image)
          image.src = `../../shared/images/icon/minus${
            quantity <= 1 ? "-disabled" : ""
          }.png`;
        count += quantity;
        total += price * quantity;
      });
      screen.querySelector(".order-count").textContent = `${count}개`;
      screen.querySelector(".order-total").textContent = formatPrice(total);
      clear.disabled = count === 0;
      submit.disabled = count === 0;
    }

    list.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      const row = button?.closest(".cart-item");
      if (!row || button.disabled) return;
      const output = row.querySelector(".cart-quantity-value");
      const quantity = Number(output.textContent);
      if (button.matches(".cart-increase")) output.textContent = quantity + 1;
      else if (button.matches(".cart-decrease"))
        output.textContent = Math.max(1, quantity - 1);
      else if (button.matches(".cart-remove")) row.remove();
      updateCart();
    });
    clear.addEventListener("click", () => {
      list.replaceChildren();
      updateCart();
    });
    submit.addEventListener("click", () => moveTo(PAGES.review));

    screen.querySelector(".menu-track")?.addEventListener("click", (event) => {
      const card = event.target.closest(".cafe-menu-card");
      if (!card || card.disabled) return;
      // URL로 표시할 하드코딩 상품과 옵션 종류만 구분합니다.
      if (
        ["coffee-01", "coffee-02", "coffee-04", "coffee-07"].includes(
          card.dataset.menuId
        )
      ) {
        moveTo(
          `${PAGES.options}?menu=${encodeURIComponent(card.dataset.menuId)}`
        );
        return;
      }
      // 나머지 상품은 현재 페이지에 예시 행을 추가하는 동작만 보여줍니다.
      if (!template?.content.firstElementChild) return;
      const row = template.content.firstElementChild.cloneNode(true);
      row.querySelector(".cart-item-name").textContent =
        card.querySelector(".menu-card-name").textContent;
      row
        .querySelector(".cart-remove")
        .setAttribute(
          "aria-label",
          `${row.querySelector(".cart-item-name").textContent} 삭제`
        );
      row.dataset.price = card
        .querySelector(".menu-card-price")
        .textContent.replace(/[^\d]/g, "");
      list.append(row);
      updateCart();
    });
    updateCart();
  }

  function initOptionsDemo(screen) {
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
    function updatePrice() {
      // 기본 금액과 추가 금액은 options.html의 data-price에서 수정합니다.
      const basePrice = Number(form.dataset.price || 0);
      const extra = Array.from(
        form.querySelectorAll("input:checked:not(:disabled)")
      ).reduce((sum, input) => sum + Number(input.dataset.price || 0), 0);
      screen.querySelector(".option-total").textContent = formatPrice(
        basePrice + extra
      );
    }
    form.addEventListener("change", updatePrice);
    screen
      .querySelector(".option-cancel")
      ?.addEventListener("click", () => moveTo(PAGES.menu));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      moveTo(PAGES.menu);
    });
    updatePrice();
  }

  function initReviewDemo(screen) {
    // 고정 예시에서 시작하고, 추천 메뉴는 현재 화면의 목록에만 추가합니다.
    const list = screen.querySelector(".review-list");
    const readNumber = (element) =>
      Number(element?.textContent.replace(/[^\d]/g, "") || 0);

    list?.querySelectorAll(".review-item").forEach((row) => {
      const quantity =
        readNumber(row.querySelector(".review-item-quantity")) || 1;
      row.dataset.unitPrice =
        readNumber(row.querySelector(".review-item-price")) / quantity;
    });

    function updateReviewTotal() {
      if (!list) return;
      let quantity = 0;
      let total = 0;
      list.querySelectorAll(".review-item").forEach((row) => {
        const count = readNumber(row.querySelector(".review-item-quantity"));
        const price = Number(row.dataset.unitPrice) * count;
        row.querySelector(".review-item-price").textContent =
          formatPrice(price);
        quantity += count;
        total += price;
      });
      // 주문 확인 합계와 카드 결제 안내 금액을 함께 갱신합니다.
      const countLabel = screen.querySelector(".review-total-count");
      const priceLabel = screen.querySelector(".review-total-price");
      if (countLabel) countLabel.textContent = `${quantity}개`;
      if (priceLabel) priceLabel.textContent = formatPrice(total);
      const cardCount = document.querySelector(
        "#modal-card-payment .card-payment-count"
      );
      const cardTotal = document.querySelector(
        "#modal-card-payment .card-payment-total"
      );
      if (cardCount) cardCount.textContent = `${quantity}개`;
      if (cardTotal) cardTotal.textContent = formatPrice(total);
    }

    screen
      .querySelector(".recommend-list")
      ?.addEventListener("click", (event) => {
        const button = event.target.closest(".recommend-button");
        if (!button || button.disabled || !list) return;
        const name = button
          .querySelector(".recommend-name")
          ?.textContent.trim();
        if (!name) return;
        const existing = Array.from(list.querySelectorAll(".review-item")).find(
          (row) =>
            row.querySelector(".review-item-name")?.textContent.trim() === name
        );

        if (existing) {
          const quantity = existing.querySelector(".review-item-quantity");
          quantity.textContent = `${readNumber(quantity) + 1}개`;
        } else {
          const row = document.createElement("li");
          row.className = "review-item";
          row.dataset.unitPrice = readNumber(
            button.querySelector(".recommend-price")
          );
          row.innerHTML = `
          <div class="review-item-info"><span class="review-item-name"></span></div>
          <span class="review-item-quantity">1개</span>
          <span class="review-item-price"></span>
        `;
          row.querySelector(".review-item-name").textContent = name;
          list.append(row);
        }
        updateReviewTotal();
      });
    updateReviewTotal();

    const open = (id) => {
      if (
        document.getElementById(id) &&
        typeof window.openModal === "function"
      ) {
        window.openModal(id);
      }
    };
    screen
      .querySelector(".review-back")
      ?.addEventListener("click", () => moveTo(PAGES.menu));
    screen
      .querySelector(".review-bottom")
      ?.addEventListener("click", (event) => {
        if (event.target.closest(".review-dine-in, .review-takeout"))
          open("modal-payment");
      });
    document
      .getElementById("modal-payment")
      ?.addEventListener("click", (event) => {
        if (event.target.closest('[data-payment-method="card"]'))
          open("modal-card-payment");
      });
    document
      .querySelector("[data-card-inserted]")
      ?.addEventListener("click", () => {
        open("modal-payment-progress");
        window.setTimeout(() => {
          if (document.getElementById("modal-payment-progress")?.open)
            open("modal-payment-complete");
        }, 1500);
      });
    document
      .getElementById("modal-payment-progress")
      ?.addEventListener("cancel", (event) => event.preventDefault());

    const prompt = document.getElementById("modal-points-prompt");
    const phone = document.getElementById("modal-points-phone");
    const number = document.getElementById("points-phone-number");
    const prefix = phone?.querySelector('[data-phone-key="010"]');
    function clearPhone() {
      if (number) number.value = "";
      if (prefix) prefix.disabled = false;
    }
    document
      .querySelector("[data-card-removed]")
      ?.addEventListener("click", () => {
        if (prompt) prompt.returnValue = "";
        open("modal-points-prompt");
      });
    prompt?.addEventListener("close", () => {
      if (prompt.returnValue === "yes") {
        clearPhone();
        open("modal-points-phone");
      } else if (prompt.returnValue === "no") open("modal-receipt");
    });
    phone
      ?.querySelector(".points-keypad")
      ?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-phone-key]");
        if (!button || button.disabled || !phone.open || !number) return;
        const current = number.value.replace(/\D/g, "");
        const key = button.dataset.phoneKey;
        const next = key === "delete" ? current.slice(0, -1) : current + key;
        if (next.length > 11) return;
        number.value =
          next.length > 7
            ? `${next.slice(0, 3)}-${next.slice(3, 7)}-${next.slice(7)}`
            : next.length > 3
            ? `${next.slice(0, 3)}-${next.slice(3)}`
            : next;
        if (prefix) prefix.disabled = next.length > 0;
        if (next.length === 11) open("modal-points-complete");
      });
    phone?.addEventListener("close", clearPhone);
    document.querySelectorAll("[data-open-receipt]").forEach((button) => {
      button.addEventListener("click", () => open("modal-receipt"));
    });
  }
});
