document.addEventListener("DOMContentLoaded", function () {
  function initMainTabs() {
    const mainTab = document.querySelector(".main-tab");
    if (!mainTab) return;

    const tabButtons = mainTab.querySelectorAll("button[data-category]");
    const panels = document.querySelectorAll(".main-category-panel");

    function selectCategory(category) {
      // 연결된 패널이 있을 때만 전환
      const hasPanel = Array.from(panels).some(
        (panel) => panel.dataset.category === category
      );

      if (!hasPanel) return;

      tabButtons.forEach((button) => {
        const isSelected = button.dataset.category === category;

        button.setAttribute("aria-pressed", String(isSelected));
      });

      panels.forEach((panel) => {
        panel.hidden = panel.dataset.category !== category;
      });
    }

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        selectCategory(button.dataset.category);
      });
    });

    // 초기 화면을 선택된 탭과 일치시킴
    const initialTab =
      mainTab.querySelector('button[aria-pressed="true"]') ?? tabButtons[0];

    if (initialTab) {
      selectCategory(initialTab.dataset.category);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMainTabs);
  } else {
    initMainTabs();
  }
  // 버튼 클릭 이벤트
  document.querySelectorAll("main button").forEach((button) => {
    const buttonName = button.textContent.trim();
    const targetUrl = pageRoutes[buttonName];

    if (!targetUrl) return;

    button.addEventListener("click", () => {
      window.location.href = targetUrl;
    });
  });
});
