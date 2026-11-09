document.addEventListener("DOMContentLoaded", () => {
  const PAGES = {
    start: "./index.html",
    menu: "./cafe_01.html",
    options: "./cafe_02.html",
    review: "./cafe_03.html",
    main: "../../index.html",
    payment: "../../shared/component/payment.html",
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
      // 기본 금액과 추가 금액은 cafe_02.html의 data-price에서 수정합니다.
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
    // 고정 예시의 수량과 금액을 기준으로 합계를 계산합니다.
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
      // 주문 확인 화면의 합계를 갱신합니다.
      const countLabel = screen.querySelector(".review-total-count");
      const priceLabel = screen.querySelector(".review-total-price");
      if (countLabel) countLabel.textContent = `${quantity}개`;
      if (priceLabel) priceLabel.textContent = formatPrice(total);
    }

    updateReviewTotal();
    const openPayment = initPaymentFlow();

    screen.querySelector(".review-back")?.addEventListener("click", () => {
      moveTo(PAGES.menu);
    });
    screen
      .querySelector(".review-bottom")
      ?.addEventListener("click", (event) => {
        const button = event.target.closest(".review-dine-in, .review-takeout");
        if (button) openPayment(button);
      });
  }

  function initPaymentFlow() {
    // 파일명을 변경했다면 해당 단계의 경로만 바꿉니다.
    const files = {
      card: "card-payment.html",
      progress: "payment-progress.html",
      complete: "payment-complete.html",
      prompt: "points-prompt.html",
      phone: "points-phone.html",
      pointsComplete: "points-complete.html",
      receipt: "receipt.html",
    };
    const nextSteps = {
      payment: [['[data-payment-method="card"]', "card"]],
      card: [["[data-card-inserted]", "progress"]],
      complete: [["[data-card-removed], .payment-complete-image", "prompt"]],
      prompt: [
        [".points-yes", "phone"],
        [".points-no", "receipt"],
      ],
      phone: [[".points-skip, [data-open-receipt]", "receipt"]],
      pointsComplete: [[".points-confirm, [data-open-receipt]", "receipt"]],
    };
    const paymentUrl = new URL(PAGES.payment, document.baseURI);
    let activeFlow = null;

    const style = document.createElement("style");
    style.textContent =
      "dialog.cafe-payment-dialog::backdrop { background: rgba(0, 0, 0, 0.6); }";
    document.head.append(style);

    function closeFlow(flow) {
      if (activeFlow !== flow) return;
      activeFlow = null;
      window.clearTimeout(flow.timer);
      if (flow.dialog.open) flow.dialog.close();
      flow.dialog.remove();
      flow.trigger.focus();
    }

    async function showStep(flow, step) {
      if (activeFlow !== flow || flow.loading) return;
      flow.loading = true;

      try {
        const url =
          step === "payment" ? paymentUrl : new URL(files[step], paymentUrl);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`${url.pathname} (${response.status})`);
        }

        const page = new DOMParser().parseFromString(
          await response.text(),
          "text/html"
        );
        const source = page.querySelector("dialog");
        if (!source)
          throw new Error(`${url.pathname}: dialog를 찾을 수 없습니다.`);

        const { dialog } = flow;
        if (activeFlow !== flow || (dialog.isConnected && !dialog.open)) return;

        // 이미지와 링크는 원래 팝업 파일 위치를 기준으로 해석합니다.
        const sourceUrl = response.url || url.href;
        source.querySelectorAll("[src], [href]").forEach((element) => {
          for (const attribute of ["src", "href"]) {
            if (!element.hasAttribute(attribute)) continue;
            const path = element.getAttribute(attribute);
            // shared/component로 옮기기 전 팝업 파일의 경로도 지원합니다.
            const relativePath = path.replace(
              /^\.\.\/\.\.\/\.\.\/shared\//,
              "../"
            );
            element.setAttribute(
              attribute,
              new URL(relativePath, sourceUrl).href
            );
          }
        });

        window.clearTimeout(flow.timer);
        flow.step = step;
        dialog.id = source.id;
        dialog.className = source.className;
        dialog.classList.add("cafe-payment-dialog");
        for (const attribute of ["aria-labelledby", "aria-describedby"]) {
          const value = source.getAttribute(attribute);
          if (value === null) dialog.removeAttribute(attribute);
          else dialog.setAttribute(attribute, value);
        }
        dialog.replaceChildren(...source.childNodes);

        if (!dialog.isConnected) {
          document.body.append(dialog);
          dialog.showModal();
        } else {
          const nextFocus = dialog.querySelector(
            "button:not([disabled]), a[href], input"
          );
          (nextFocus ?? dialog).focus();
        }

        if (step === "progress") {
          flow.timer = window.setTimeout(
            () => showStep(flow, "complete"),
            2000
          );
        }
      } catch (error) {
        if (activeFlow !== flow) return;
        console.error("결제 팝업을 열 수 없습니다.", error);
        closeFlow(flow);
        window.alert(
          "결제 팝업을 불러오지 못했어요. 파일 경로를 확인해주세요."
        );
      } finally {
        flow.loading = false;
      }
    }

    function handlePhoneKey(flow, button) {
      if (button.disabled) return;

      const key = button.dataset.phoneKey;
      if (key !== "delete" && !/^\d+$/.test(key)) return;

      const next =
        key === "delete" ? flow.phone.slice(0, -1) : flow.phone + key;
      if (next.length > 11) return;
      flow.phone = next;

      const input = flow.dialog.querySelector("#points-phone-number");
      const prefix = flow.dialog.querySelector('[data-phone-key="010"]');
      if (input) {
        input.value = [next.slice(0, 3), next.slice(3, 7), next.slice(7)]
          .filter(Boolean)
          .join("-");
      }
      if (prefix) prefix.disabled = next.length > 0;

      if (next.length === 11) showStep(flow, "pointsComplete");
    }

    return function openPayment(trigger) {
      if (activeFlow) return;

      const dialog = document.createElement("dialog");
      const flow = {
        dialog,
        trigger,
        step: "payment",
        phone: "",
        loading: false,
      };
      activeFlow = flow;

      dialog.addEventListener("close", () => closeFlow(flow));
      dialog.addEventListener("click", (event) => {
        const target = event.target;
        if (target.closest("[data-modal-close], .modal-close")) {
          event.preventDefault();
          event.stopPropagation();
          closeFlow(flow);
          return;
        }

        const route = (nextSteps[flow.step] ?? []).find(([selector]) =>
          target.closest(selector)
        );
        if (route) {
          event.preventDefault();
          event.stopPropagation();
          showStep(flow, route[1]);
          return;
        }

        const key = target.closest("button[data-phone-key]");
        if (flow.step === "phone" && key) {
          event.preventDefault();
          event.stopPropagation();
          if (!flow.loading) handlePhoneKey(flow, key);
        }
      });

      showStep(flow, "payment");
    };
  }
});
