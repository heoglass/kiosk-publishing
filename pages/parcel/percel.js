document.addEventListener("DOMContentLoaded", () => {
    // 여기에 각 화면에 필요한 코드 함수형으로 init
  initCompleteButtons();
  initHomeReset();
  initBackBtn();
  initWeightGauge();
  initCostKeypad();
  initParcelForm("from");
  initParcelForm("to");
  initAgreeCheck();
});





// URL라우팅 이동에 따른 페이지 초기화
function initHomeReset() {
  const header = document.getElementById("category-header-horizontal");
  if (!header) return;

  const homeLink = header.querySelector('a[aria-label="처음으로"]');
  if (!homeLink) return;

  homeLink.addEventListener("click", () => {
    // 사용자 폰번호 데이터 임시저장 초기화
    sessionStorage.removeItem(CATCH_TABLE_KEY);
    console.log("sessionStorage 완료");
  });
}

const backBtnRoute = {
  catchTableUser: "./indexAgree.html",
  catchTableUserCheck: "./indexUser.html",
  catchTableKakaoMsg: "./indexUserCheck.html",
  catchTableCompleteExp: "./indexKakaoMsg.html",
};

function initBackBtn() {
  const backBtn = document.getElementById("backBtn");
  if (!backBtn) return;

  const route = backBtnRoute[document.body.dataset.page];
  if (!route) return;

  backBtn.addEventListener("click", () => {
    location.href = route;
  });
}

/* indexWeight.html : 저울 클릭 시 다음 버튼 활성화 및 중량 카운트업 애니메이션 */
function initWeightGauge() {
  const gauge = document.querySelector(".weight-gauge");
  if (!gauge) return;

  const valueEl = document.getElementById("weightValue");
  const nextBtn = document.querySelector(".btn-area--row a.btn");
  let rafId = 0;

  gauge.addEventListener("click", () => {
    if (!valueEl) return;
    
    const target = 100;
    const duration = 600;
    const start = performance.now();
    cancelAnimationFrame(rafId);
    
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      valueEl.textContent = `${Math.round(target * eased)}g`;
      if (progress < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    setInterval(() => {
      nextBtn?.classList.add("btn-active");
    }, 500);

  });
}

/* indexCost.html : 입력 금액이 50만원 이하일 때만 다음 버튼 활성화 */
function initCostKeypad() {
  const input = document.getElementById("costInput");
  const keypad = document.querySelector(".keypad");
  const nextBtn = document.querySelector(".btn-area .btn");
  if (!input || !keypad || !nextBtn) return;

  const MAX_AMOUNT = 50;

  const updateNextBtn = () => {
    const amount = Number(input.value);
    const enabled = input.value !== "" && amount > 0 && amount <= MAX_AMOUNT;
    nextBtn.classList.toggle("btn-active", enabled);
    nextBtn.classList.toggle("disabled-color", !enabled);
  };

  keypad.addEventListener("click", (e) => {
    const key = e.target.closest(".keypad__key");
    if (!key) return;

    const value = key.dataset.key;
    if (value === "clear") {
      input.value = "";
    } else {
      const current = input.value === "0" ? "" : input.value;
      input.value = current + value;
    }
    updateNextBtn();
  });

  nextBtn.addEventListener("click", (e) => {
    if (!nextBtn.classList.contains("btn-active")) e.preventDefault();
  });

  updateNextBtn();
}

/* indexFrom.html / indexTo.html : 화상 키보드 입력, 휴대폰 번호 숫자 포맷, 전체 입력 시 다음 버튼 활성화 */
function initParcelForm(prefix) {
  const nameInput = document.getElementById(`${prefix}Name`);
  const phoneInput = document.getElementById(`${prefix}Phone`);
  const addrInput = document.getElementById(`${prefix}Addr`);
  const detailInput = document.getElementById(`${prefix}AddrDetail`);
  const keyboard = document.querySelector(".keyboard");
  const nextBtn = document.querySelector(".btn-area .btn");
  if (!nameInput || !phoneInput || !addrInput || !detailInput || !keyboard || !nextBtn) return;

  const PHONE_LENGTH = 11;
  const inputs = [nameInput, phoneInput, addrInput, detailInput];
  let activeInput = null;

  const formatPhone = (digits) => {
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const sanitizePhone = () => {
    const digits = phoneInput.value.replace(/\D/g, "").slice(0, PHONE_LENGTH);
    phoneInput.value = formatPhone(digits);
  };

  const isComplete = () =>
    nameInput.value.trim() !== "" &&
    phoneInput.value.replace(/\D/g, "").length === PHONE_LENGTH &&
    addrInput.value.trim() !== "" &&
    detailInput.value.trim() !== "";

  const updateNextBtn = () => {
    const enabled = isComplete();
    nextBtn.classList.toggle("btn-active", enabled);
    nextBtn.classList.toggle("disabled-color", !enabled);
  };

  inputs.forEach((input) => {
    input.addEventListener("focus", () => {
      if (!input.readOnly) activeInput = input;
    });
    input.addEventListener("input", () => {
      if (input === phoneInput) sanitizePhone();
      updateNextBtn();
    });
  });

  keyboard.addEventListener("mousedown", (e) => e.preventDefault());
  keyboard.addEventListener("click", (e) => {
    const key = e.target.closest(".keyboard__key");
    if (!key || !activeInput) return;

    const value = key.dataset.key;
    if (value === "shift" || value === "lang") return;

    if (value === "backspace") {
      if (activeInput === phoneInput) {
        activeInput.value = activeInput.value.replace(/\D/g, "").slice(0, -1);
        sanitizePhone();
      } else {
        activeInput.value = activeInput.value.slice(0, -1);
      }
    } else if (value === "space") {
      if (activeInput === phoneInput) return;
      activeInput.value += " ";
    } else if (activeInput === phoneInput) {
      if (!/^\d$/.test(value)) return;
      const digits = activeInput.value.replace(/\D/g, "");
      activeInput.value = digits + value;
      sanitizePhone();
    } else {
      activeInput.value += value;
    }
    updateNextBtn();
  });

  nextBtn.addEventListener("click", (e) => {
    if (!nextBtn.classList.contains("btn-active")) e.preventDefault();
  });

  updateNextBtn();
}

/* indexParcelChk.html : 약관 동의 체크 시 운송장 출력 버튼 활성화 + 출력 모달 3초 후 이동 */
const PRINT_MODAL_DELAY = 3000;

function initAgreeCheck() {
  const agreeCheck = document.getElementById("agreeTerms");
  const printBtn = document.getElementById("printBtn");
  const printModal = document.getElementById("printModal");
  if (!agreeCheck || !printBtn) return;

  let isPrinting = false; // 연타 방지

  const updatePrintBtn = () => {
    const enabled = agreeCheck.checked;
    printBtn.classList.toggle("btn-active", enabled);
    printBtn.classList.toggle("disabled-color", !enabled);
  };

  agreeCheck.addEventListener("change", updatePrintBtn);

  printBtn.addEventListener("click", (e) => {
    e.preventDefault(); // a 링크 즉시 이동 막기
    if (!printBtn.classList.contains("btn-active")) return;
    if (isPrinting) return;
    isPrinting = true;

    const nextUrl = printBtn.getAttribute("href");
    if (printModal) printModal.hidden = false;

    setTimeout(() => {
      location.href = nextUrl;
    }, PRINT_MODAL_DELAY);
  });

  // 이전 버튼으로 돌아왔을 때(뒤로가기 캐시) 모달이 열린 채 남지 않도록 초기화
  window.addEventListener("pageshow", () => {
    isPrinting = false;
    if (printModal) printModal.hidden = true;
  });

  updatePrintBtn();
}

/* indexCompleteExp.html : 저장된 데이터를 삭제하고 이동 */
function initCompleteButtons() {
  const routes = {
    completeRetryBtn: "./index.html",
    completeHomeBtn: "../../index.html",
  };

  Object.keys(routes).forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;

    btn.addEventListener("click", () => {
      sessionStorage.removeItem(CATCH_TABLE_KEY);
      location.href = routes[id];
    });
  });
}