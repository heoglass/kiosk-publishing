document.addEventListener("DOMContentLoaded", () => {
  let mainCategoryMoving = false;

  initMainTabs();

  window.addEventListener("pageshow", () => {
    mainCategoryMoving = false;
  });

  document.querySelectorAll(".main-category-button").forEach((button) => {
    const buttonName = button.textContent.trim();
    const targetUrl = pageRoutes[buttonName];

    if (!targetUrl) return;

    button.addEventListener("click", (event) => {
      moveWithMainCategoryRipple(event, button, targetUrl);
    });
  });

  function initMainTabs() {
    const mainTab = document.querySelector(".main-tab");
    if (!mainTab) return;

    const tabButtons = mainTab.querySelectorAll("button[data-category]");
    const panels = Array.from(
      document.querySelectorAll(".main-category-panel")
    );

    function selectCategory(category) {
      if (!panels.some((panel) => panel.dataset.category === category)) return;

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

    const initialTab =
      mainTab.querySelector('button[aria-pressed="true"]') ?? tabButtons[0];

    if (initialTab) {
      selectCategory(initialTab.dataset.category);
    }
  }

  function moveWithMainCategoryRipple(event, button, targetUrl) {
    if (mainCategoryMoving) return;
    mainCategoryMoving = true;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.location.href = targetUrl;
      return;
    }

    const rect = button.getBoundingClientRect();
    const size = Math.hypot(button.clientWidth, button.clientHeight) * 2;
    const ripple = document.createElement("i");

    // 키보드로 실행하면 버튼 가운데에서 시작합니다.
    const x = event.detail
      ? ((event.clientX - rect.left) / rect.width) * 100
      : 50;
    const y = event.detail
      ? ((event.clientY - rect.top) / rect.height) * 100
      : 50;

    ripple.className = "main-category-ripple";
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
      { duration: 300, easing: "ease-out" }
    );

    animation.onfinish = () => {
      ripple.remove();
      window.location.href = targetUrl;
    };
  }
});
