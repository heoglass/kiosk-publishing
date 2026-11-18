/* sessionStorage 공통 : catchTablePhone { phone, adult, child, total } */
const CATCH_TABLE_KEY = "catchTablePhone";

function getCatchTableData() {
  try {
    return JSON.parse(sessionStorage.getItem(CATCH_TABLE_KEY)) || {};
  } catch (err) {
    return {};
  }
}

// 기존 값에 병합 저장 (reset: true 면 기존 값을 비우고 새로 저장)
function setCatchTableData(data, reset) {
  try {
    const base = reset ? {} : getCatchTableData();
    sessionStorage.setItem(CATCH_TABLE_KEY, JSON.stringify(Object.assign(base, data)));
  } catch (err) { /* 저장 실패 무시 */ }
}

document.addEventListener("DOMContentLoaded", () => {
  initPeopleCount();
  initPhoneKeypad();
  initAgreeCheck();
  initUserCheck();
  initKakaoMsg();
  initCompleteButtons();
  initHomeReset();
  initBackBtn();
});


// 사용자 폰번호입력을 퍼블단에서 브라우져 로컬스토리지에 임시저장 후 UI전환에 이용한다
// 개발에선 실제 결제시스템을 사용
/* index.html : 휴대폰 번호 키패드 입력 */
function initPhoneKeypad() {
    'use strict';

    // 다른 화면에서도 같은 JS를 불러오므로, 요소가 없으면 바로 종료
    var display = document.getElementById('phoneNumber');
    if (!display) return;

    var PREFIX = '010';
    var MAX_DIGITS = 8;                       // 010 뒤에 입력하는 숫자 (4자리 + 4자리)
    var NEXT_PAGE = './indexAgree.html';      // 웨이팅 시작 후 이동할 화면

    var guide = document.querySelector('.keypad__guide');
    var guideDefault = guide ? guide.textContent : '';
    var digits = '';                          // 010을 제외한 입력값

    // 표시용 포맷: 010-1234-5678
    function format() {
        var head = digits.slice(0, 4);
        var tail = digits.slice(4);
        var text = PREFIX + '-' + head;
        if (tail) text += '-' + tail;
        return text;
    }

    function render() {
        display.textContent = format();
        if (guide) {
            guide.textContent = guideDefault;
            guide.classList.remove('keypad__guide--error');
        }
    }

    function pressNumber(n) {
        if (digits.length >= MAX_DIGITS) return;
        digits += n;
        render();
    }

    function pressBack() {
        digits = digits.slice(0, -1);
        render();
    }

    function pressReset() {
        digits = '';
        render();
    }

    // 키패드 버튼 (이벤트 위임)
    var grid = document.querySelector('.keypad__grid');
    grid.addEventListener('click', function (e) {
        var btn = e.target.closest('.keypad__key');
        if (!btn) return;
        var key = btn.getAttribute('data-key');
        if (key === 'back') pressBack();
        else if (key === 'reset') pressReset();
        else pressNumber(key);
    });

    // PC 키보드 입력 (테스트 편의)
    document.addEventListener('keydown', function (e) {
        if (/^[0-9]$/.test(e.key)) pressNumber(e.key);
        else if (e.key === 'Backspace') pressBack();
        else if (e.key === 'Enter') startWaiting();
    });

    // 웨이팅 시작
    function startWaiting() {
        if (digits.length < MAX_DIGITS) {
            if (guide) {
                guide.textContent = '휴대폰 번호를 끝까지 입력해주세요';
                guide.classList.add('keypad__guide--error');
            }
            return;
        }
        setCatchTableData({ phone: format() }, true); // 새 웨이팅 시작 : 기존 값 초기화
        location.href = NEXT_PAGE;
    }

    var startBtn = document.getElementById('waitingStartBtn');
    if (startBtn) startBtn.addEventListener('click', startWaiting);

    render();
}

/* indexAgree.html : 약관 동의 */
function initAgreeCheck() {
    var allCheck = document.getElementById('agreeAll');
    var nextBtn = document.getElementById('agreeNextBtn');
    if (!allCheck || !nextBtn) return;

    var NEXT_PAGE = './indexUser.html';
    var items = Array.prototype.slice.call(document.querySelectorAll('.agree__list .agree__check'));
    var requiredItems = items.filter(function (el) { return !el.hasAttribute('data-optional'); });

    function update() {
        // 필수 항목이 모두 체크되면 전체동의 체크 + 다음 버튼 활성화 (선택 항목은 무관)
        var ok = requiredItems.every(function (el) { return el.checked; });
        allCheck.checked = ok;
        nextBtn.disabled = !ok;
        nextBtn.classList.toggle('footer-btn--primary', ok);
        nextBtn.classList.toggle('footer-btn--gray', !ok);
    }

    allCheck.addEventListener('change', function () {
    // 체크 시: 필수 항목만 체크 (선택 항목은 그대로) / 해제 시: 전체 해제
    var targets = allCheck.checked ? requiredItems : items;
    targets.forEach(function (el) { el.checked = allCheck.checked; });
    update();
    });
    items.forEach(function (el) { el.addEventListener('change', update); });

    nextBtn.addEventListener('click', function () {
        if (nextBtn.disabled) return;
        location.href = NEXT_PAGE;
    });

    update();
}
/* indexUser.html : 성인 / 유아 인원수 */
function initPeopleCount() {
  const boxes = document.querySelectorAll(".count__box");
  const nextCount = document.getElementById("nextCount");
  const nextBtn = document.getElementById("userNextBtn");
  if (!boxes.length || !nextCount) return;

  const NEXT_PAGE = "./indexUserCheck.html";
  const MAX_COUNT = 10; // 성인 / 유아 각각 최대 인원
  const MIN_COUNT = { adult: 1, child: 0 }; // 성인은 최소 1명

  const count = { adult: 1, child: 0 };

  function render() {
    boxes.forEach((box) => {
      const type = box.dataset.type;
      box.querySelector(".count__num").textContent = count[type];
      box.querySelector('[data-action="minus"]').disabled = count[type] <= MIN_COUNT[type];
      box.querySelector('[data-action="plus"]').disabled = count[type] >= MAX_COUNT;
    });
    nextCount.textContent = count.adult + count.child;
  }

  boxes.forEach((box) => {
    box.addEventListener("click", (e) => {
      const btn = e.target.closest(".count__btn");
      if (!btn || btn.disabled) return;
      const type = box.dataset.type;
      count[type] += btn.dataset.action === "plus" ? 1 : -1;
      render();
    });
  });

  nextBtn.addEventListener("click", () => {
    setCatchTableData({
      adult: count.adult,
      child: count.child,
      total: count.adult + count.child,
    });
    location.href = NEXT_PAGE;
  });

  render();
}
// * indexUserCheck.html : 저장된 catchTablePhone 데이터 렌더링 + 웨이팅 등록 *
function initUserCheck() {
  const phoneEl = document.getElementById("infoPhone");
  const peopleEl = document.getElementById("infoPeople");
  if (!phoneEl || !peopleEl) return;

  const NEXT_PAGE = "./indexKakaoMsg.html";
  const WAITING_NO = 3; // 퍼블 임시 웨이팅 번호 (시안 기준). 개발에서는 실제 발급 번호 사용

  const data = getCatchTableData();

  phoneEl.textContent = data.phone || "-";
  peopleEl.textContent = data.total ? `${data.total}명` : "-";
  // 매장 이용방식은 저장된 값이 있을 때만 교체 (없으면 마크업 기본값 유지)
  const visitTypeEl = document.getElementById("infoVisitType");
  if (visitTypeEl && data.visitType) visitTypeEl.textContent = data.visitType;

  // 웨이팅 등록 : 웨이팅 번호 저장 후 카카오 알림 화면으로 이동
  const registerBtn = document.getElementById("waitingRegisterBtn");
  if (registerBtn) {
    registerBtn.addEventListener("click", () => {
      setCatchTableData({ waitingNo: WAITING_NO });
      location.href = NEXT_PAGE;
    });
  }
}

/* indexKakaoMsg.html : 웨이팅 번호 표시 + 5초 카운트 후 체험완료 화면 이동 */
function initKakaoMsg() {
  const secEl = document.getElementById("redirectSec");
  if (!secEl) return;

  const NEXT_PAGE = "./indexCompleteExp.html";
  const REDIRECT_SEC = 5;

  const noEl = document.getElementById("waitingNo");
  if (noEl) noEl.textContent = getCatchTableData().waitingNo || "-";

  let sec = REDIRECT_SEC;
  secEl.textContent = sec;

  const timer = setInterval(() => {
    sec -= 1;
    if (sec <= 0) {
      clearInterval(timer);
      location.href = NEXT_PAGE;
      return;
    }
    secEl.textContent = sec;
  }, 1000);

  // 화면을 떠날 때 타이머 정리
  window.addEventListener("pagehide", () => clearInterval(timer));
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