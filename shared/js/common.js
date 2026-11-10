const pageRoutes = {
  카페: "./pages/cafe/index.html",
  "패스트 푸드": "./pages/fast-food/index.html",
  "푸드 코트": "./pages/food-court/index.html",
  "테이블 오더": "./pages/table-order/index.html",
  "테이블 결제": "./pages/table-pay/index.html",
  캐치테이블: "./pages/catch-table/index.html",

  민원서류발급: "./pages/civil-service/index.html",
  진료발급기: "./pages/hospital/index.html",
  "은행 ATM": "./pages/atm/index.html",

  "고속/시외버스": "./pages/express-bus/index.html",
  "기차/KTX": "./pages/ktx/index.html",
  "공항 체크인": "./pages/airport-checkin/index.html",

  영화관: "./pages/cinema/index.html",
  "마트 셀프계산": "./pages/self-checkout/index.html",
  "셀프 주유": "./pages/self-gas/index.html",
  주차정산: "./pages/parking/index.html",
  "편의점 택배": "./pages/parcel/index.html",
  "무인 매장": "./pages/unmanned-store/index.html",
};

document.addEventListener("DOMContentLoaded", function () {
  // ------------------ category-header -----------------//

  // 카테고리 내 화면 메인인 경우 뒤로가기 눌렀을 때 키오스크 메인 화면으로 이동
  const headerBack = document.getElementById("header-back");

  if (headerBack && headerBack.dataset.backManaged !== "true") {
    headerBack.addEventListener("click", () => {
      const startScreen = document.getElementById("category-start-screen");

      if (!startScreen || startScreen.hidden) return;

      window.location.href = "../../index.html";
    });
  }

  // 메인 화면에서 카테고리 클릭시 헤더에 해당 카테고리명 노출
  const headerTitle = document.getElementById("header-title");

  if (headerTitle) {
    const currentFolder = window.location.pathname.split("/").at(-2);
    const category = new URLSearchParams(window.location.search).get(
      "category"
    );

    const routes = Object.entries(pageRoutes);

    const currentRoute = routes.find(([, path]) => {
      return path.split("/").at(-2) === currentFolder;
    });

    const sharedRoute = routes.find(([, path]) => {
      return path.split("/").at(-2) === category;
    });

    headerTitle.textContent = currentRoute?.[0] ?? sharedRoute?.[0] ?? "";
  }

  // 주문 완료 화면, 체험 완료 화면 이동시 이전 체험 했던 카테고리명 헤더에 노출
  function goToCompletePage(path) {
    const currentUrl = new URL(window.location.href);
    const currentFolder = currentUrl.pathname.split("/").at(-2);

    // 공통 화면에서는 이미 전달받은 값을 사용하고,
    // 카테고리 화면에서는 현재 폴더명을 사용해요.
    const category = currentUrl.searchParams.get("category") || currentFolder;

    const nextUrl = new URL(path, currentUrl);
    nextUrl.searchParams.set("category", category);

    window.location.href = nextUrl.href;
  }

  // 헤더에 sound-icon 토글
  const soundButton = document.querySelector(
    ":is(#main-header, #category-header) .header-sound-toggle"
  );
  const soundIcon = soundButton?.querySelector(".header-sound");

  if (!soundIcon) return;

  const soundOnSrc = soundIcon.getAttribute("src");
  const soundOffSrc = soundButton.dataset.soundOffSrc;

  soundButton.addEventListener("click", () => {
    const isSoundOn = soundButton.getAttribute("aria-pressed") === "true";
    const nextSoundOn = !isSoundOn;

    soundButton.setAttribute("aria-pressed", String(nextSoundOn));
    soundIcon.src = nextSoundOn ? soundOnSrc : soundOffSrc;
  });

  const completeConfirm = document.getElementById("complete-confirm");

  if (completeConfirm) {
    completeConfirm.addEventListener("click", (event) => {
      event.preventDefault();

      goToCompletePage(completeConfirm.href);
    });
  }

  const pathParts = window.location.pathname.split("/");
  const params = new URLSearchParams(window.location.search);

  const currentCategory = Object.values(pageRoutes)
    .map((path) => path.split("/").at(-2))
    .find((folder) => pathParts.includes(folder));

  const category = currentCategory ?? params.get("category");

  if (!category) return;

  // document
  //   .querySelectorAll(".receipt-choice, [data-keep-category]")
  //   .forEach((link) => {
  //     const nextUrl = new URL(link.href);
  //     nextUrl.searchParams.set("category", category);
  //     link.href = nextUrl.href;
  //   });

  document
    .querySelectorAll("a.receipt-choice[href], a[data-keep-category][href]")
    .forEach((link) => {
      const nextUrl = new URL(link.href);
      nextUrl.searchParams.set("category", category);
      link.href = nextUrl.href;
    });
  //
  // 체험 완료 화면에서 다시하기 버튼 누른 경우 카테고리 명 감지해서 해당 카테고리 index.html로 이동
  //

  const experienceRetry = document.getElementById("experience-retry");

  if (experienceRetry) {
    experienceRetry.addEventListener("click", () => {
      const category = new URLSearchParams(window.location.search).get(
        "category"
      );

      const categoryRoute = Object.values(pageRoutes).find((path) => {
        return path.split("/").at(-2) === category;
      });

      if (!categoryRoute) return;

      window.location.href = `../pages/${category}/index.html`;
    });
  }

  // ----------------------------------------------------//
  // ------------------- modal --------------------------//
  // ----------------------------------------------------//

  window.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (!(modal instanceof HTMLDialogElement)) return;

    document.querySelectorAll("dialog.modal[open]").forEach((openedModal) => {
      if (openedModal !== modal) {
        openedModal.close();
      }
    });

    if (!modal.open) {
      modal.showModal();
    }

    document.body.classList.add("modal-open");
  };

  // 공통 닫기 버튼
  document.addEventListener("click", (event) => {
    const closeButton = event.target.closest("[data-modal-close]");
    if (!closeButton) return;

    closeButton.closest("dialog.modal")?.close();
  });

  // 닫기 버튼 또는 Esc로 닫혔을 때 스크롤 상태 갱신
  document.addEventListener(
    "close",
    (event) => {
      if (!event.target.matches("dialog.modal")) return;

      document.body.classList.toggle(
        "modal-open",
        Boolean(document.querySelector("dialog.modal[open]"))
      );
    },
    true
  );
});
