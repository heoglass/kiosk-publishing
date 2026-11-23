document.addEventListener("DOMContentLoaded", function () {
  let pendingAction = null;
  const activeRipples = new Set();

  function playRipple(event, button, duration = 700) {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof button.animate !== "function"
    )
      return null;

    button.classList.add("parking-ripple-target");
    if (button.matches(".parking-keypad button, .parking-method-card")) {
      button.classList.add("parking-ripple-light-background");
    }
    if (getComputedStyle(button).position === "static") {
      button.style.position = "relative";
    }
    const rect = button.getBoundingClientRect();
    const size = Math.hypot(button.clientWidth, button.clientHeight) * 2;
    const x = event.detail
      ? ((event.clientX - rect.left) / (rect.width || 1)) * 100
      : 50;
    const y = event.detail
      ? ((event.clientY - rect.top) / (rect.height || 1)) * 100
      : 50;
    const ripple = document.createElement("span");
    ripple.className = "parking-button-ripple";
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
    activeRipples.add(animation);
    const cleanUp = () => {
      ripple.remove();
      activeRipples.delete(animation);
    };
    animation.addEventListener("finish", cleanUp);
    animation.addEventListener("cancel", cleanUp);
    return animation;
  }

  function afterRipple(event, button, action, duration = 350) {
    event.preventDefault();
    if (pendingAction) return;
    const animation = playRipple(event, button, duration);
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

  function moveAfterRipple(event, button, path, duration = 350) {
    afterRipple(
      event,
      button,
      () => {
        window.location.href = path;
      },
      duration
    );
  }

  window.addEventListener("pagehide", () => {
    pendingAction?.cancel();
    pendingAction = null;
    Array.from(activeRipples).forEach((animation) => animation.cancel());
  });

  function initParkingPages() {
    // 시작 화면 → 차량 번호 입력 화면
    const startButton = document.querySelector(".category-start");

    if (startButton) {
      startButton.addEventListener(
        "click",
        function (event) {
          event.stopImmediatePropagation();
          moveAfterRipple(event, startButton, "./parking_01.html", 350);
        },
        { capture: true }
      );
    }
    // 주차 정산 페이지 순서대로 뒤로가기
    const backButton = document.getElementById("header-back");
    const currentFile = window.location.pathname.split("/").pop();
    const parkingPage = currentFile.match(/^parking_0([1-5])\.html$/);

    if (backButton && parkingPage) {
      backButton.addEventListener(
        "click",
        function (event) {
          // common.js의 뒤로가기 이벤트와 중복 실행 방지
          event.preventDefault();
          event.stopImmediatePropagation();

          const currentStep = Number(parkingPage[1]);

          if (currentStep === 1) {
            window.location.href = "./index.html";
            return;
          }

          const previousStep = String(currentStep - 1).padStart(2, "0");

          window.location.href = `./parking_${previousStep}.html`;
        },
        { capture: true }
      );
    }

    // 정산하기 / 다시조회하기 버튼 이동
    const pageButtons = document.querySelectorAll("button[data-parking-page]");

    pageButtons.forEach(function (button) {
      button.addEventListener("click", function (event) {
        if (button.disabled) return;
        moveAfterRipple(event, button, "./" + button.dataset.parkingPage, 350);
      });
    });
    // 차량 번호 입력 화면 요소
    const carNumberInput = document.getElementById("parking-car-number");
    const keypad = document.querySelector(".parking-keypad");
    const searchButton = document.querySelector(".parking-search");
    const loadingModal = document.getElementById("parking-loading");

    // 입력 화면이 아닌 페이지에서는 아래 코드 실행 안 함
    if (!carNumberInput || !keypad || !searchButton) return;

    let isSearching = false;
    let searchTimer;

    // 입력값 및 버튼 상태 변경
    function updateCarNumber(value) {
      const number = value.replace(/\D/g, "").slice(0, 4);

      carNumberInput.value = number;

      // 숫자가 1개 이상이면 파란색 테두리
      carNumberInput.classList.toggle("is-filled", number.length > 0);

      // 4자리를 입력하면 조회 버튼 활성화
      searchButton.disabled = number.length !== 4 || isSearching;
    }

    // 숫자 키패드
    keypad.addEventListener("click", function (event) {
      const button = event.target.closest("button[data-parking-key]");

      if (
        !button ||
        !keypad.contains(button) ||
        button.disabled ||
        isSearching
      ) {
        return;
      }

      playRipple(event, button);

      const key = button.dataset.parkingKey;
      const currentNumber = carNumberInput.value;

      if (key === "delete") {
        updateCarNumber(currentNumber.slice(0, -1));
        return;
      }

      if (key === "clear") {
        updateCarNumber("");
        return;
      }

      if (/^\d$/.test(key) && currentNumber.length < 4) {
        updateCarNumber(currentNumber + key);
      }
    });

    // 조회 중 ESC로 로딩 팝업이 닫히지 않도록 처리
    if (loadingModal) {
      loadingModal.addEventListener("cancel", function (event) {
        event.preventDefault();
      });
    }

    // 조회하기 → 로딩 팝업 → 1.5초 후 다음 화면
    searchButton.addEventListener("click", function (event) {
      if (
        searchButton.disabled ||
        !/^\d{4}$/.test(carNumberInput.value) ||
        isSearching ||
        !loadingModal
      ) {
        return;
      }

      isSearching = true;
      afterRipple(
        event,
        searchButton,
        function () {
          updateCarNumber(carNumberInput.value);
          loadingModal.showModal();
          searchTimer = window.setTimeout(function () {
            window.location.href = "./parking_02.html";
          }, 1500);
        },
        250
      );
    });

    window.addEventListener("pagehide", function () {
      window.clearTimeout(searchTimer);
    });
    window.addEventListener("pageshow", function (event) {
      if (!event.persisted) return;
      isSearching = false;
      if (loadingModal?.open) loadingModal.close();
      updateCarNumber(carNumberInput.value);
    });

    // 초기 입력 상태 반영
    updateCarNumber(carNumberInput.value);
  }

  function initParkingPayment() {
    const paymentButton = document.querySelector("[data-parking-payment]");
    const cardDialog = document.getElementById("parking-dialog-card");
    const progressDialog = document.getElementById("parking-dialog-progress");
    const completeDialog = document.getElementById("parking-dialog-complete");
    const receiptDialog = document.getElementById("parking-dialog-receipt");

    if (
      !paymentButton ||
      !cardDialog ||
      !progressDialog ||
      !completeDialog ||
      !receiptDialog
    ) {
      return;
    }

    let progressTimer;

    function openDialog(dialog) {
      dialog.returnValue = "";
      dialog.showModal();
    }

    paymentButton.addEventListener("click", function (event) {
      if (paymentButton.disabled || cardDialog.open) return;
      afterRipple(
        event,
        paymentButton,
        function () {
          openDialog(cardDialog);
        },
        250
      );
    });

    cardDialog.addEventListener("close", function () {
      if (cardDialog.returnValue !== "inserted") return;

      openDialog(progressDialog);

      progressTimer = window.setTimeout(function () {
        if (!progressDialog.open) return;

        progressDialog.close();
        openDialog(completeDialog);
      }, 2000);
    });

    progressDialog.addEventListener("close", function () {
      window.clearTimeout(progressTimer);
    });

    completeDialog.addEventListener("close", function () {
      if (completeDialog.returnValue === "removed") {
        openDialog(receiptDialog);
      }
    });

    receiptDialog.addEventListener("close", function () {
      if (
        receiptDialog.returnValue === "yes" ||
        receiptDialog.returnValue === "no"
      ) {
        window.location.href = "./parking_05.html";
      }
    });
  }

  function initParkingExtras() {
    // 카드결제 라벨 → 라디오로 전달되는 두 번째 클릭은 건너뜁니다.
    const cardInput = document.querySelector(
      '.parking-method-input[value="card"]'
    );
    const cardOption = cardInput?.closest(".parking-method-option");
    const cardSurface = cardOption?.querySelector(".parking-method-card");
    if (cardInput && cardOption && cardSurface) {
      cardOption.addEventListener("click", function (event) {
        if (event.target === cardInput || cardInput.disabled || pendingAction)
          return;
        playRipple(event, cardSurface);
      });
    }

    // 완료 화면의 두 링크: common.js의 즉시 이동보다 먼저 리플을 처리합니다.
    document
      .querySelectorAll(
        ".complete-actions #experience-retry, .complete-actions .parking-first-btn"
      )
      .forEach(function (link) {
        link.addEventListener(
          "click",
          function (event) {
            if (
              event.ctrlKey ||
              event.metaKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            event.stopImmediatePropagation();
            moveAfterRipple(event, link, link.href, 350);
          },
          { capture: true }
        );
      });
  }
  initParkingPages();
  initParkingPayment();
  initParkingExtras();
});
