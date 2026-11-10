document.addEventListener("DOMContentLoaded", function () {
  // 시작 화면 → 차량 번호 입력 화면
  const startButton = document.querySelector(".category-start");

  if (startButton) {
    startButton.addEventListener("click", function () {
      window.location.href = "./parking_01.html";
    });
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
    button.addEventListener("click", function () {
      window.location.href = "./" + button.dataset.parkingPage;
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

    if (!button || !keypad.contains(button) || button.disabled || isSearching) {
      return;
    }

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
  searchButton.addEventListener("click", function () {
    if (!/^\d{4}$/.test(carNumberInput.value) || isSearching || !loadingModal) {
      return;
    }

    isSearching = true;
    updateCarNumber(carNumberInput.value);

    loadingModal.showModal();

    window.setTimeout(function () {
      window.location.href = "./parking_02.html";
    }, 1500);
  });

  // 초기 입력 상태 반영
  updateCarNumber(carNumberInput.value);
});

document.addEventListener("DOMContentLoaded", function () {
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

  paymentButton.addEventListener("click", function () {
    openDialog(cardDialog);
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
});
