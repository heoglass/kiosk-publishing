document.addEventListener("DOMContentLoaded", () => {
  initAtmAnimations();
  initAtmUi();
});

const initAtmAnimations = () => {
  document.querySelectorAll("lottie-player[data-animation]").forEach((player) => {
    const name = player.dataset.animation;
    const animation = window[name];
    if (!animation || !player.updateComplete || typeof player.load !== "function") {
      console.error("애니메이션을 불러오지 못했습니다:", name);
      return;
    }

    player.addEventListener("error", () => {
      console.error("애니메이션을 불러오지 못했습니다:", name);
    });
    player.updateComplete.then(() => player.load(animation)).catch((error) => {
      console.error("애니메이션을 불러오지 못했습니다:", name, error);
    });
  });
};

/**
 * 자동 화면 이동
 * [data-auto-next] 요소가 있으면 [data-auto-delay](ms, 기본 2000) 후 해당 경로로 이동
 */
const initAutoNext = () => {
  const target = document.querySelector("[data-auto-next]");
  if (!target) return;

  const delay = Number(target.dataset.autoDelay) || 2000;
  setTimeout(() => {
    location.href = target.dataset.autoNext;
  }, delay);
};


const initTradeType = () => {
  document.querySelectorAll("[data-trade-type]").forEach((link) => {
    link.addEventListener("click", (event) => {
      try {
        sessionStorage.setItem("atmTradeType", JSON.stringify({ type: link.dataset.tradeType }));
      } catch (error) {
        event.preventDefault();
        console.error("거래 유형을 저장하지 못했습니다.", error);
        alert("거래 유형을 저장하지 못했습니다. 다시 시도해 주세요.");
      }
    });
  });
};

const initTradeNext = () => {
  const target = document.querySelector("[data-trade-next]");
  if (!target) return;

  let tradeType;
  try {
    tradeType = JSON.parse(sessionStorage.getItem("atmTradeType"));
  } catch (error) {
    console.error("거래 유형을 읽지 못했습니다.", error);
  }
  // 출금, 입금에 따른 분기처리
  const nextPages = {
    deposit: "./atmg-04.html",
    withdrawal: "./atm-09.html",
  };
  const nextPage = tradeType && Object.prototype.hasOwnProperty.call(nextPages, tradeType.type)
    ? nextPages[tradeType.type]
    : null;

  if (!nextPage) {
    alert("거래 유형을 확인할 수 없습니다. 거래를 다시 선택해 주세요.");
    location.href = "./index.html";
    return;
  }

  const delay = Number(target.dataset.autoDelay) || 2000;
  setTimeout(() => {
    location.href = nextPage;
  }, delay);
};

/**
 * 거래 정보 임시 저장 (sessionStorage)
 * key: atmTradeType / value: { amount: (int) 거래금액, ... }
 * 기존에 저장된 값은 유지하고 넘겨준 항목만 덮어씀
 */
const ATM_TRADE_KEY = "atmTradeType";

const getAtmTrade = () => {
  try {
    return JSON.parse(sessionStorage.getItem(ATM_TRADE_KEY)) || {};
  } catch (e) {
    return {};
  }
};

const setAtmTrade = (data) => {
  try {
    sessionStorage.setItem(ATM_TRADE_KEY, JSON.stringify({ ...getAtmTrade(), ...data }));
  } catch (e) {
    // sessionStorage 사용 불가 시 무시
  }
};

/**
 * 금액 선택 (ATM-09)
 * 버튼 터치 시 하나만 선택 상태로 만들고, 거래금액을 atmTradeType.amount 에 저장
 */
const initAmountSelect = () => {
  const buttons = document.querySelectorAll(".atmg__amount");
  if (!buttons.length) return;

  const select = (target) => {
    buttons.forEach((btn) => {
      const isTarget = btn === target;
      btn.classList.toggle("is-selected", isTarget);
      btn.setAttribute("aria-pressed", String(isTarget));
    });
  };

  // 이미 저장된 금액이 있으면 선택 상태 복원
  const saved = getAtmTrade().amount;
  if (saved !== undefined) {
    buttons.forEach((btn) => {
      if (parseInt(btn.dataset.amount, 10) === saved) select(btn);
    });
  }

  let nextTimer;
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      select(btn);
      setAtmTrade({ amount: parseInt(btn.dataset.amount, 10) });

      // 선택 효과를 1초간 보여준 뒤 다음 화면으로 이동
      const next = btn.closest(".atmg__amount-grid").dataset.next;
      if (next) {
        clearTimeout(nextTimer);
        nextTimer = setTimeout(() => {
          location.href = next;
        }, 1000);
      }
    });
  });
};

/**
 * 비밀번호 입력 (ATM-14)
 * - 화면 숫자 키패드 터치 + 키보드(숫자만) 입력 모두 가능, 기본 4자리
 * - 지정한 자리수가 채워지면 완료 버튼을 표시한 뒤 [data-pin-next] 경로로 자동 이동
 * - 입력값은 저장하지 않고 화면에는 ● 로만 표시
 * - 재배열: 숫자 키 10개의 위치(숫자)를 무작위로 섞음 / ←: 한 글자 지움
 */
const initPinInput = () => {
  const wrap = document.querySelector("[data-pin-next]");
  if (!wrap) return;

  const display = wrap.querySelector(".atmg__pin-display");
  const completeButton = wrap.closest(".atm__section").querySelector("[data-pin-complete]");
  const keys = Array.from(wrap.querySelectorAll(".atmg__key"));
  const digitKeys = keys.filter((key) => /^[0-9]$/.test(key.dataset.key || ""));
  const maxLength = Number(wrap.dataset.pinLength) || 4;
  let pin = "";
  let isDone = false;

  const render = () => {
    display.textContent = "●".repeat(pin.length);
  };

  const addDigit = (digit) => {
    if (isDone || pin.length >= maxLength) return;
    pin += digit;
    render();

    if (pin.length === maxLength) {
      isDone = true;
      completeButton.textContent = "완료";
      completeButton.href = wrap.dataset.pinNext;
      completeButton.classList.add("btn--primary");
      setTimeout(() => {
        location.href = wrap.dataset.pinNext;
      }, 1200);
    }
  };

  const removeDigit = () => {
    if (isDone) return;
    pin = pin.slice(0, -1);
    render();
  };

  // 화면 키패드 터치/클릭
  keys.forEach((key) => {
    key.addEventListener("click", () => {
      const action = key.dataset.action;
      if (action === "back") removeDigit();
      else addDigit(key.dataset.key);
      key.blur();
    });
  });

  // 키보드 입력 (숫자, Backspace 만 허용)
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (/^[0-9]$/.test(e.key)) {
      addDigit(e.key);
      const pressed = digitKeys.find((key) => key.dataset.key === e.key);
      if (pressed) {
        pressed.classList.add("is-pressed");
        setTimeout(() => pressed.classList.remove("is-pressed"), 120);
      }
    } else if (e.key === "Backspace") {
      e.preventDefault();
      removeDigit();
    }
  });
};

/**
 * 거래금액 표시 (UI 전환 임시)
 * sessionStorage(atmTradeType).amount 값을 [data-trade-amount] 요소에 "500,000원" 형식으로 출력
 * 저장된 값이 없으면 0원
 */
const initTradeAmount = () => {
  const targets = document.querySelectorAll("[data-trade-amount]");
  if (!targets.length) return;

  const amount = Number(getAtmTrade().amount) || 0;
  const text = `${amount.toLocaleString("ko-KR")}원`;
  targets.forEach((el) => {
    el.textContent = text;
  });
};

/**
 * 거래 정보 초기화
 * [data-clear-trade] 가 있는 화면(atm-end)에 진입하면 sessionStorage 의 atmTradeType 삭제
 */
const initClearTrade = () => {
  if (!document.querySelector("[data-clear-trade]")) return;

  try {
    sessionStorage.removeItem(ATM_TRADE_KEY);
  } catch (e) {
    // sessionStorage 사용 불가 시 무시
  }
};

// ATM UI초기화 캡슐
const initAtmUi = () => {
  initAutoNext();
  initTradeType();
  initTradeNext();
  initAmountSelect();
  initPinInput();
  initTradeAmount();
  initClearTrade();
};

