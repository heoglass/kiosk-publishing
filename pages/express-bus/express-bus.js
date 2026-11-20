document.addEventListener("DOMContentLoaded", () => {
  // 화면별 초기화를 분리해 다른 화면의 return이 04 초기화를 막지 않게 합니다.
  initBusFirstScreen();
  initBusAreaScreen();
  initBusSeatScreen();
  initBusCardInsertScreen();
  initBusRefundScreen();

  // 01 화면: 출발지/도착지 선택 여부에 따른 조회 버튼 색상
  function initBusFirstScreen() {
    const busFirstScreen = document.querySelector(".screen-bus-first");
    if (!busFirstScreen) return;

    const areaContainer = busFirstScreen.querySelector(
      ".departure-arrival-container"
    );
    const areaTexts = busFirstScreen.querySelectorAll(".area-card-area");
    const searchButton = busFirstScreen.querySelector(".bottom-button");
    if (!areaContainer || areaTexts.length !== 2 || !searchButton) return;

    const updateSearchButton = () => {
      const departure = areaTexts[0].textContent.trim();
      const arrival = areaTexts[1].textContent.trim();
      const isSelected =
        departure !== "" &&
        departure !== "출발지 선택" &&
        arrival !== "" &&
        arrival !== "도착지 선택";

      searchButton.classList.toggle("is-active", isSelected);
    };

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

    const tabs = screen.querySelector(".bus-region-tabs");
    const regionButtons = Array.from(
      tabs.querySelectorAll(".bus-region-button")
    );
    const terminalButtons = Array.from(
      screen.querySelectorAll(".bus-terminal-button")
    );
    const terminalScroll = screen.querySelector(".bus-terminal-scroll");
    const emptyMessage = screen.querySelector(".bus-terminal-empty");

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

    // 터미널 버튼을 누르면 선택 표시를 변경합니다.
    terminalScroll.addEventListener("click", (event) => {
      const button = event.target.closest(".bus-terminal-button");
      if (!button || button.hidden || !terminalScroll.contains(button)) return;
      terminalButtons.forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
    });
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
      if (!seat || !grid.contains(seat) || seat.disabled || isApplyingType)
        return;
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
      if (isApplyingType) return;

      const cancel = event.target.closest("[data-passenger-cancel]");
      if (cancel && options.contains(cancel)) {
        // 취소는 이번에 고른 좌석만 해제하고, 앞서 확정한 좌석은 유지합니다.
        pending.clear();
        status.textContent = "";
        render();
        return;
      }

      const button = event.target.closest("[data-passenger]");
      if (!button || !options.contains(button) || pending.size === 0) return;
      const fare = fares[button.dataset.passenger];
      if (!fare) return;

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
    });

    list.addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove-seat]");
      if (!button || !list.contains(button) || isApplyingType) return;
      selected.delete(Number(button.dataset.removeSeat));
      status.textContent = "";
      render();
    });

    complete.addEventListener("click", () => {
      if (
        complete.disabled ||
        selected.size === 0 ||
        pending.size > 0 ||
        isApplyingType
      )
        return;
      window.location.href = "./express-bus_05.html";
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
      if (!dialog.open) dialog.showModal();
    });

    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
    });

    confirmButton.addEventListener("click", () => {
      window.location.href = "./express-bus_06.html";
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

    ticketButton.addEventListener("click", () => {
      if (state !== "insert") return;
      state = "ready";
      insert.hidden = true;
      review.hidden = false;
      submit.disabled = false;
      submit.classList.add("is-active");
    });

    submit.addEventListener("click", () => {
      if (submit.disabled || state !== "ready" || loading.open) return;
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
    });

    loading.addEventListener("cancel", (event) => event.preventDefault());
  }
});
