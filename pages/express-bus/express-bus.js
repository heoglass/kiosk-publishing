document.addEventListener("DOMContentLoaded", function () {
  let pendingAction = null;
  const activeRipples = new Set();

  // cafe.js와 동일하게 클릭 위치에서 원이 퍼지며 사라지는 리플입니다.
  function playRipple(event, target, duration = 700) {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof target.animate !== "function"
    )
      return null;

    target.classList.add("bus-ripple-target");
    if (
      target.matches(
        ".area-card, .bus-terminal-button, .bus-refund-ticket-button, .bus-time-card, .bus-seat, .bus-passenger-button, .bottom-button.back, .payment-image-button, .bus-card-confirm-button"
      )
    ) {
      target.classList.add("bus-ripple-light");
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
    ripple.className = "bus-button-ripple";
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
    if (
      target.matches(":disabled") ||
      target.getAttribute("aria-disabled") === "true" ||
      pendingAction
    )
      return;
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

  initBusFirstScreen();
  initBusAreaScreen();
  initBusSeatScreen();
  initBusCardInsertScreen();
  initBusRefundScreen();

  const lottieTicketRefund = document.getElementById("lottie-ticket-refund");

  if (lottieTicketRefund && window.lottie && window.lottieTicketRefundData) {
    const cardAnimation = window.lottie.loadAnimation({
      container: lottieTicketRefund,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: window.lottieTicketRefundData,
    });

    cardAnimation.setSpeed(1);
  }

  // 01 화면: URL로 전달된 터미널 표시와 조회 버튼 활성화
  function initBusFirstScreen() {
    const busFirstScreen = document.querySelector(".screen-bus-first");
    if (!busFirstScreen) return;

    const areaContainer = busFirstScreen.querySelector(
      ".departure-arrival-container"
    );
    const areaTexts = busFirstScreen.querySelectorAll(".area-card-area");
    const searchButton = busFirstScreen.querySelector(".bus-search-button");
    if (!areaContainer || areaTexts.length !== 2 || !searchButton) return;

    // 별도 저장 없이 02 화면에서 URL로 넘긴 선택값만 표시합니다.
    const params = new URLSearchParams(window.location.search);
    const departure = params.get("departure")?.trim();
    const arrival = params.get("arrival")?.trim();
    if (departure) areaTexts[0].textContent = departure;
    if (arrival) areaTexts[1].textContent = arrival;

    const updateSearchButton = () => {
      const departureName = areaTexts[0].textContent.trim();
      const arrivalName = areaTexts[1].textContent.trim();
      const hasDeparture =
        departureName !== "" && departureName !== "출발지 선택";
      const hasArrival = arrivalName !== "" && arrivalName !== "도착지 선택";
      const isSelected = hasDeparture && hasArrival;

      searchButton.classList.toggle("is-active", isSelected);
      searchButton.setAttribute("aria-disabled", String(!isSelected));

      // 반대쪽 카드를 고르러 02로 이동해도 앞서 선택한 터미널을 전달합니다.
      areaContainer.querySelectorAll("a.area-card").forEach((card) => {
        const nextUrl = new URL(
          card.getAttribute("href"),
          window.location.href
        );
        params.forEach((value, key) => {
          if (key !== "select") nextUrl.searchParams.set(key, value);
        });
        if (hasDeparture) nextUrl.searchParams.set("departure", departureName);
        else nextUrl.searchParams.delete("departure");
        if (hasArrival) nextUrl.searchParams.set("arrival", arrivalName);
        else nextUrl.searchParams.delete("arrival");
        card.href = nextUrl.href;
      });
    };

    // 출발지와 도착지가 모두 선택되어야 03 화면으로 이동합니다.
    searchButton.addEventListener("click", (event) => {
      if (!searchButton.classList.contains("is-active")) event.preventDefault();
    });

    updateSearchButton();
    new MutationObserver(updateSearchButton).observe(areaContainer, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  // 02 화면: 지역 탭과 터미널 선택 표시
  function initBusAreaScreen() {
    const screen = document.querySelector(".bus-area-screen");
    if (!screen) return;

    // 01 화면의 링크에 ?select=arrival을 붙이면 도착지 화면을 표시합니다.
    const params = new URLSearchParams(window.location.search);
    const isArrival = params.get("select") === "arrival";
    const label = isArrival ? "도착지" : "출발지";
    screen.querySelector(
      "#bus-area-title"
    ).textContent = `${label}를 선택하세요`;
    screen.querySelector(
      "#bus-area-search-text"
    ).textContent = `${label} 터미널명 선택`;
    document.title = `${label} 선택 | 고속/시외버스`;

    // 기존 선택값과 category 등의 쿼리는 유지하고 선택 모드만 제거합니다.
    const createReturnUrl = () => {
      const url = new URL("./express-bus_01.html", window.location.href);
      url.search = params.toString();
      url.searchParams.delete("select");
      return url;
    };
    const previousLink = screen.querySelector(".bus-terminal-back");
    if (previousLink) previousLink.href = createReturnUrl().href;

    const tabs = screen.querySelector(".bus-region-tabs");
    const regionButtons = Array.from(
      tabs.querySelectorAll(".bus-region-button")
    );
    const terminalButtons = Array.from(
      screen.querySelectorAll(".bus-terminal-button")
    );
    const terminalScroll = screen.querySelector(".bus-terminal-scroll");
    const emptyMessage = screen.querySelector(".bus-terminal-empty");

    initRegionTabsMouseDrag(tabs);

    tabs.addEventListener("click", (event) => {
      const button = event.target.closest(".bus-region-button");
      if (!button || !tabs.contains(button)) return;

      const region = button.dataset.region;
      regionButtons.forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });

      let visibleCount = 0;
      terminalButtons.forEach((item) => {
        item.hidden = region !== "전체" && item.dataset.region !== region;
        if (!item.hidden) visibleCount += 1;
      });
      emptyMessage.hidden = visibleCount !== 0;
      terminalScroll.scrollTop = 0;

      // 화면 밖의 탭을 선택한 경우, 탭 영역만 가로로 이동합니다.
      const left = button.offsetLeft - tabs.offsetLeft;
      const right = left + button.offsetWidth;
      if (left < tabs.scrollLeft) {
        tabs.scrollTo({ left, behavior: "smooth" });
      } else if (right > tabs.scrollLeft + tabs.clientWidth) {
        tabs.scrollTo({ left: right - tabs.clientWidth, behavior: "smooth" });
      }
    });

    // PC 마우스 휠도 지역 탭 위에서는 가로 스크롤로 사용합니다.
    tabs.addEventListener(
      "wheel",
      (event) => {
        if (event.ctrlKey || tabs.scrollWidth <= tabs.clientWidth) return;
        const delta =
          Math.abs(event.deltaX) > Math.abs(event.deltaY)
            ? event.deltaX
            : event.deltaY;
        if (!delta) return;
        event.preventDefault();
        tabs.scrollLeft += delta * (event.deltaMode === 1 ? 40 : 1);
      },
      { passive: false }
    );

    // 터미널 선택 리플이 끝나면 선택한 이름을 URL로 전달하고 01로 돌아갑니다.
    terminalScroll.addEventListener("click", (event) => {
      const button = event.target.closest(".bus-terminal-button");
      if (
        !button ||
        button.hidden ||
        button.disabled ||
        pendingAction ||
        !terminalScroll.contains(button)
      )
        return;
      const terminalName = (
        button.dataset.terminal ||
        button.querySelector(".bus-terminal-name")?.textContent ||
        ""
      ).trim();
      if (!terminalName) return;

      event.preventDefault();
      terminalButtons.forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
      const returnUrl = createReturnUrl();
      returnUrl.searchParams.set(
        isArrival ? "arrival" : "departure",
        terminalName
      );
      afterRipple(event, button, () => {
        window.location.href = returnUrl.href;
      });
    });
  }

  // 02 화면 지역 탭: PC 마우스 드래그. 터치는 기존 네이티브 스크롤을 사용합니다.
  function initRegionTabsMouseDrag(tabs) {
    let drag = null;
    let blockDragClick = false;
    let blockClickTimer;
    const dragThreshold = 6;

    const resetClickBlock = () => {
      window.clearTimeout(blockClickTimer);
      blockDragClick = false;
    };

    tabs.addEventListener("pointerdown", (event) => {
      if (event.isPrimary === false) return;
      resetClickBlock();
      if (
        event.pointerType !== "mouse" ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        tabs.scrollWidth <= tabs.clientWidth
      )
        return;

      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScrollLeft: tabs.scrollLeft,
        moved: false,
      };
    });

    tabs.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const distance = event.clientX - drag.startX;
      if (!drag.moved && Math.abs(distance) < dragThreshold) return;

      if (!drag.moved) {
        drag.moved = true;
        tabs.classList.add("is-dragging");
        // 드래그가 시작된 뒤에만 캡처하여 일반 탭 클릭은 그대로 유지합니다.
        tabs.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      tabs.scrollLeft = drag.startScrollLeft - distance;
    });

    const endDrag = (event) => {
      if (
        !drag ||
        (event.pointerId !== undefined && event.pointerId !== drag.pointerId)
      )
        return;
      const finished = drag;
      drag = null;
      tabs.classList.remove("is-dragging");
      if (tabs.hasPointerCapture(finished.pointerId)) {
        tabs.releasePointerCapture(finished.pointerId);
      }
      if (finished.moved) {
        // 마우스를 놓을 때 발생하는 클릭으로 지역이 바뀌지 않게 합니다.
        blockDragClick = true;
        window.clearTimeout(blockClickTimer);
        blockClickTimer = window.setTimeout(resetClickBlock, 300);
      }
    };

    tabs.addEventListener("pointerup", endDrag);
    tabs.addEventListener("pointercancel", endDrag);
    tabs.addEventListener("lostpointercapture", endDrag);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("blur", endDrag);
    window.addEventListener("pagehide", () => {
      endDrag({});
      resetClickBlock();
    });

    tabs.addEventListener(
      "click",
      (event) => {
        if (!blockDragClick || event.detail === 0) return;
        resetClickBlock();
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      { capture: true }
    );

    tabs.addEventListener("dragstart", (event) => event.preventDefault());
  }

  // 04 화면: 좌석 선택, 승객 유형, 선택 목록과 결제 금액
  function initBusSeatScreen() {
    const screen = document.querySelector(".screen-bus-seat-select");
    if (!screen) return;

    // 퍼블리싱용 예시 요금입니다. 이 표의 price를 바꾸면 목록과 합계에 반영됩니다.
    const fares = {
      adult: { label: "일반", price: 20000 },
      child: { label: "초등생", price: 10000 },
      student: { label: "중등생", price: 16000 },
      veteran30: { label: "보훈30", price: 14000 },
      veteran50: { label: "보훈50", price: 10000 },
    };
    const maxSeats = 10;
    const layout = screen.querySelector(".bus-seat-layout");
    const grid = screen.querySelector(".bus-seat-grid");
    const seats = Array.from(grid.querySelectorAll(".bus-seat"));
    const picker = screen.querySelector(".bus-passenger-picker");
    const options = screen.querySelector(".bus-passenger-options");
    const typeButtons = Array.from(
      options.querySelectorAll("[data-passenger]")
    );
    const list = screen.querySelector(".bus-selected-seat-list");
    const prompt = screen.querySelector(".bus-seat-prompt");
    const notice = screen.querySelector(".bus-seat-notice");
    const total = screen.querySelector(".bus-seat-payment-total");
    const status = screen.querySelector(".bus-seat-status");
    const complete = screen.querySelector(".bottom-button.completed");
    const numberFormat = new Intl.NumberFormat("ko-KR");
    const selected = new Map();
    const pending = new Set();
    let isApplyingType = false;

    function render() {
      const count = selected.size + pending.size;

      seats.forEach((seat) => {
        // 판매 좌석은 HTML에 작성된 disabled와 이미지를 그대로 유지합니다.
        if (seat.disabled) return;
        const number = Number(seat.dataset.seat);
        const isSelected = selected.has(number) || pending.has(number);
        seat.classList.toggle("is-selected", isSelected);
        seat.setAttribute("aria-pressed", String(isSelected));
        seat.setAttribute(
          "aria-label",
          `${number}번 좌석 ${isSelected ? "선택 취소" : "선택"}`
        );
        seat
          .querySelector(".bus-seat-image")
          .setAttribute(
            "src",
            isSelected
              ? layout.dataset.selectedSeatSrc
              : layout.dataset.defaultSeatSrc
          );
      });

      const isPicking = pending.size > 0 || isApplyingType;
      picker.hidden = !isPicking;
      prompt.hidden = count > 0;
      notice.hidden = count > 0;
      list.hidden = isPicking || selected.size === 0;
      list.innerHTML = Array.from(selected.entries())
        .sort(([first], [second]) => first - second)
        .map(
          ([number, fare]) => `
          <li class="bus-selected-seat-row">
            <span>${number}번</span>
            <span>${fare.label}</span>
            <span class="bus-selected-seat-price">${numberFormat.format(
              fare.price
            )}원</span>
            <button type="button" class="bus-selected-seat-remove" data-remove-seat="${number}" aria-label="${number}번 좌석 삭제">×</button>
          </li>
        `
        )
        .join("");

      const amount = Array.from(selected.values()).reduce(
        (sum, fare) => sum + fare.price,
        0
      );
      total.textContent = `${numberFormat.format(amount)}원`;
      // 선택한 모든 좌석에 유형을 지정한 뒤에만 완료할 수 있습니다.
      complete.disabled =
        selected.size === 0 || pending.size > 0 || isApplyingType;
    }

    grid.addEventListener("click", (event) => {
      const seat = event.target.closest(".bus-seat");
      if (
        !seat ||
        !grid.contains(seat) ||
        seat.disabled ||
        isApplyingType ||
        pendingAction
      )
        return;
      playRipple(event, seat);
      const number = Number(seat.dataset.seat);

      status.textContent = "";
      if (pending.has(number)) {
        pending.delete(number);
      } else if (selected.has(number)) {
        selected.delete(number);
      } else {
        if (selected.size + pending.size >= maxSeats) {
          status.textContent = "최대 10개 좌석까지 선택할 수 있습니다.";
          return;
        }
        pending.add(number);
      }
      render();
    });

    options.addEventListener("click", (event) => {
      if (isApplyingType || pendingAction) return;

      const cancel = event.target.closest("[data-passenger-cancel]");
      if (cancel && options.contains(cancel)) {
        // 취소는 이번에 고른 좌석만 해제하고, 앞서 확정한 좌석은 유지합니다.
        afterRipple(
          event,
          cancel,
          () => {
            pending.clear();
            status.textContent = "";
            render();
          },
          250
        );
        return;
      }

      const button = event.target.closest("[data-passenger]");
      if (!button || !options.contains(button) || pending.size === 0) return;
      const fare = fares[button.dataset.passenger];
      if (!fare) return;

      afterRipple(
        event,
        button,
        () => {
          pending.forEach((number) => selected.set(number, fare));
          pending.clear();
          isApplyingType = true;
          button.classList.add("is-active");
          button.setAttribute("aria-pressed", "true");
          picker.setAttribute("aria-busy", "true");
          status.textContent = "";
          render();

          // 유형 선택 시 분홍색 효과를 잠깐 보여준 뒤 선택 목록을 표시합니다.
          window.setTimeout(() => {
            isApplyingType = false;
            typeButtons.forEach((item) => {
              item.classList.remove("is-active");
              item.setAttribute("aria-pressed", "false");
            });
            picker.setAttribute("aria-busy", "false");
            render();
          }, 220);
        },
        250
      );
    });

    list.addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove-seat]");
      if (!button || !list.contains(button) || isApplyingType) return;
      selected.delete(Number(button.dataset.removeSeat));
      status.textContent = "";
      render();
    });

    complete.addEventListener("click", (event) => {
      if (
        complete.disabled ||
        selected.size === 0 ||
        pending.size > 0 ||
        isApplyingType
      )
        return;
      afterRipple(event, complete, () => {
        window.location.href = "./express-bus_05.html";
      });
    });

    render();
  }

  // 05 화면: 카드 이미지 클릭 → 카드 제거 안내 → 06 화면
  function initBusCardInsertScreen() {
    const screen = document.querySelector(".screen-bus-card-insert");
    if (!screen) return;

    const imageButton = screen.querySelector(".payment-image-button");
    const dialog = document.getElementById("bus-card-confirm-dialog");
    const confirmButton = dialog?.querySelector(".bus-card-confirm-button");
    if (!imageButton || !dialog || !confirmButton) return;

    imageButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (dialog.open) return;
      afterRipple(event, imageButton, () => dialog.showModal(), 250);
    });

    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
    });

    confirmButton.addEventListener("click", (event) => {
      afterRipple(event, confirmButton, () => {
        window.location.href = "./express-bus_06.html";
      });
    });
  }

  // 09 화면: 승차권 투입 → 금액 확인 → 2초 로딩 → 환불 완료
  function initBusRefundScreen() {
    const screen = document.querySelector(".screen-bus-refund");
    if (!screen) return;
    const ticketButton = screen.querySelector(".bus-refund-ticket-button");
    const insert = screen.querySelector(".bus-refund-insert");
    const review = screen.querySelector(".bus-refund-review");
    const completed = screen.querySelector(".bus-refund-complete");
    const actions = screen.querySelector(".bus-refund-actions");
    const submit = screen.querySelector(".bus-refund-submit");
    const confirm = screen.querySelector(".bus-refund-confirm");
    const loading = document.getElementById("bus-refund-loading");
    if (
      !ticketButton ||
      !insert ||
      !review ||
      !completed ||
      !actions ||
      !submit ||
      !confirm ||
      !loading
    )
      return;
    let state = "insert";

    ticketButton.addEventListener("click", (event) => {
      if (state !== "insert") return;
      afterRipple(
        event,
        ticketButton,
        () => {
          state = "ready";
          insert.hidden = true;
          review.hidden = false;
          submit.disabled = false;
          submit.classList.add("is-active");
        },
        250
      );
    });

    submit.addEventListener("click", (event) => {
      if (submit.disabled || state !== "ready" || loading.open) return;
      afterRipple(
        event,
        submit,
        () => {
          state = "loading";
          submit.disabled = true;
          screen.setAttribute("aria-busy", "true");
          loading.showModal();
          window.setTimeout(() => {
            loading.close();
            state = "complete";
            insert.hidden = true;
            review.hidden = true;
            completed.hidden = false;
            actions.hidden = true;
            confirm.hidden = false;
            screen.setAttribute("aria-busy", "false");
            confirm.focus({ preventScroll: true });
          }, 2000);
        },
        250
      );
    });

    loading.addEventListener("cancel", (event) => event.preventDefault());
  }

  // 표시된 링크는 기존 경로를 유지하고 리플이 끝난 뒤 이동합니다.
  document
    .querySelectorAll(
      "a.ticket-button, a.area-card, a.bottom-button, .complete-actions #experience-retry, .complete-actions .bus-first-btn, .complete-actions .bus-refund-first-btn"
    )
    .forEach((link) => {
      // 목적지가 없는 결제 취소 예시 링크는 기존 동작을 유지합니다.
      if (!link.getAttribute("href")) return;
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

  // 날짜와 온라인 예매 발권 버튼은 기존 상태를 유지하며 리플만 재생합니다.
  document
    .querySelectorAll(
      ".date-prev-button, .date-next-button, button.ticket-button"
    )
    .forEach((button) => {
      button.addEventListener("click", (event) => {
        if (button.disabled || pendingAction) return;
        playRipple(event, button);
      });
    });

  // 03 HTML의 즉시 이동 이벤트보다 먼저 리플을 처리합니다.
  document.querySelectorAll(".bus-time-card").forEach((button) => {
    button.addEventListener(
      "click",
      (event) => {
        event.stopImmediatePropagation();
        afterRipple(event, button, () => {
          window.location.assign("./express-bus_04.html");
        });
      },
      { capture: true }
    );
  });
});
