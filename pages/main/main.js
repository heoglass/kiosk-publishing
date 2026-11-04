document.addEventListener("DOMContentLoaded", function () {
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
