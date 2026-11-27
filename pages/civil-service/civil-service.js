document.addEventListener("DOMContentLoaded", function () {
  let pendingAction = null;
  const activeRipples = new Set();

  // cafe.js와 동일하게 클릭 위치에서 원이 퍼지며 사라지는 리플입니다.
  function playRipple(event, target, duration = 700) {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof target.animate !== "function"
    )
      return null;

    target.classList.add("civil-service-ripple-target");
    if (
      target.matches(
        ".registration-keypad button, .service-copy-keypad button, .service-issuance-choice"
      )
    ) {
      target.classList.add("civil-service-ripple-light");
    }
    if (
      target.matches(
        ".registration-confirm, .service-auth-confirm, .service-issuance-alert-button, .civil-service-first-btn"
      )
    ) {
      target.classList.add("civil-service-ripple-yellow");
    }
    if (getComputedStyle(target).position === "static") {
      target.style.position = "relative";
    }
    const rect = target.getBoundingClientRect();
    const size = Math.hypot(target.clientWidth, target.clientHeight) * 2;
    const x = event.detail
      ? ((event.clientX - rect.left) / (rect.width || 1)) * 100
      : 50;
    const y = event.detail
      ? ((event.clientY - rect.top) / (rect.height || 1)) * 100
      : 50;
    const ripple = document.createElement("span");
    ripple.className = "civil-service-button-ripple";
    ripple.setAttribute("aria-hidden", "true");
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}%`;
    ripple.style.top = `${y}%`;
    target.append(ripple);

    const animation = ripple.animate(
      [
        { transform: "translate(-50%, -50%) scale(0)", opacity: 1 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 0 },
      ],
      { duration, easing: "ease-out" }
    );
    activeRipples.add(animation);
    function cleanUp() {
      ripple.remove();
      activeRipples.delete(animation);
    }
    animation.addEventListener("finish", cleanUp);
    animation.addEventListener("cancel", cleanUp);
    return animation;
  }

  function afterRipple(event, target, action, duration = 350) {
    event.preventDefault();
    if (target.matches(":disabled") || pendingAction) return;
    const animation = playRipple(event, target, duration);
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

  window.addEventListener("pagehide", () => {
    pendingAction?.cancel();
    pendingAction = null;
    Array.from(activeRipples).forEach((animation) => animation.cancel());
  });

  function civilServiceUrl(path) {
    const nextPage = new URL(path, window.location.href);
    nextPage.search = window.location.search;
    return nextPage.href;
  }

  function initCivilServiceLoading(
    triggers,
    dialog,
    nextPath,
    loadingDuration,
    canOpen
  ) {
    const [trigger] = triggers;
    const destination = civilServiceUrl(
      trigger.dataset.loadingNext || nextPath
    );
    const delay = Number(trigger.dataset.loadingDelay || loadingDuration);
    let navigationTimer;

    dialog.addEventListener("cancel", (event) => event.preventDefault());

    function openLoading(event) {
      const button = event.currentTarget;
      if (button.disabled || dialog.open || pendingAction) return;
      afterRipple(
        event,
        button,
        () => {
          if (canOpen && !canOpen()) return;
          dialog.showModal();
          navigationTimer = window.setTimeout(() => {
            window.location.assign(destination);
          }, delay);
        },
        250
      );
    }

    for (const button of triggers) {
      button.addEventListener("click", openLoading);
    }

    window.addEventListener("pagehide", () => {
      window.clearTimeout(navigationTimer);
      if (dialog.open) dialog.close();
    });
  }

  function initRegistrationKeypad(
    keypad,
    frontInput,
    backInput,
    confirmButton
  ) {
    const frontLength = 6;
    const totalLength = 13;
    let digits = "";

    function renderNumber() {
      frontInput.value = digits.slice(0, frontLength);
      backInput.value = digits.slice(frontLength);
      confirmButton.disabled = digits.length !== totalLength;
    }

    function clearNumber() {
      digits = "";
      renderNumber();
    }

    keypad.addEventListener("click", (event) => {
      const keyButton = event.target.closest("button[data-registration-key]");
      if (!keyButton || keyButton.disabled || pendingAction) return;
      playRipple(event, keyButton);

      const key = keyButton.dataset.registrationKey;

      if (key === "clear") {
        clearNumber();
        return;
      }

      if (key === "backspace") {
        digits = digits.slice(0, -1);
      } else if (/^[0-9]$/.test(key) && digits.length < totalLength) {
        digits += key;
      }

      renderNumber();
    });

    window.addEventListener("pagehide", clearNumber);
    renderNumber();
  }

  function initIssuanceOptions(panel, loadingDialog) {
    const confirm = document.querySelector("#service-issuance-confirm");
    const warningDialog = document.querySelector("#service-issuance-warning");
    const warningMessage = document.querySelector(
      "#service-issuance-warning-message"
    );
    if (!confirm || !warningDialog || !warningMessage) return;

    const rows = [...panel.querySelectorAll(".service-issuance-row")];
    const bulkChoices = panel.querySelectorAll('input[name="issuance-bulk"]');
    let missingChoice;

    function syncBulkChoices() {
      for (const bulkChoice of bulkChoices) {
        bulkChoice.checked = rows.every((row) =>
          row.querySelector(
            `input[data-issuance-choice="${bulkChoice.value}"]:checked`
          )
        );
      }
    }

    for (const bulkChoice of bulkChoices) {
      bulkChoice.addEventListener("click", () => {
        for (const row of rows) {
          row.querySelector(
            `input[data-issuance-choice="${bulkChoice.value}"]`
          ).checked = true;
        }
        syncBulkChoices();
      });
    }

    panel.addEventListener("change", syncBulkChoices);
    window.addEventListener("pageshow", syncBulkChoices);
    syncBulkChoices();

    warningDialog.addEventListener("close", () => {
      missingChoice?.focus();
    });

    window.addEventListener("pagehide", () => {
      if (warningDialog.open) warningDialog.close();
    });

    function hasAllChoices() {
      if (warningDialog.open) return false;

      const missingRow = rows.find(
        (row) => !row.querySelector("input:checked")
      );
      if (!missingRow) return true;

      missingChoice = missingRow.querySelector("input");
      const item = missingRow
        .querySelector(".service-issuance-row-title")
        .textContent.trim();
      warningMessage.textContent = `‘${item}’ 항목을 선택해주세요.`;
      warningDialog.showModal();
      return false;
    }

    initCivilServiceLoading(
      [confirm],
      loadingDialog,
      "./civil-service_06.html",
      2000,
      hasAllChoices
    );
  }

  function initCertificatePrinting() {
    const copyKeypad = document.querySelector("#service-copy-keypad");
    const copyDisplay = document.querySelector("#service-copy-display");
    const copyConfirm = document.querySelector("#service-copy-confirm");
    const printSelected = document.querySelector("#service-print-selected");
    const printConfirm = document.querySelector("#service-print-confirm");
    const printProgress = document.querySelector("#service-print-progress");
    const printCopies = document.querySelector("#service-print-copies");
    const finishLink = document.querySelector("#service-print-finish");
    const query = new URLSearchParams(window.location.search);
    const copyCount = query.get("copies");
    const initialCopies = /^[1-9]$/.test(copyCount ?? "") ? copyCount : "1";

    if (copyKeypad && copyDisplay && copyConfirm) {
      const keys = [
        ...copyKeypad.querySelectorAll("button[data-service-copy]"),
      ];
      let selectedCopies = initialCopies;

      function renderCopies() {
        copyDisplay.value = selectedCopies;
        for (const key of keys) {
          key.setAttribute(
            "aria-pressed",
            String(key.dataset.serviceCopy === selectedCopies)
          );
        }
      }

      for (const key of keys) {
        key.addEventListener("click", (event) => {
          if (key.disabled || pendingAction) return;
          playRipple(event, key);
          selectedCopies = key.dataset.serviceCopy;
          renderCopies();
        });
      }

      copyConfirm.addEventListener("click", (event) => {
        afterRipple(event, copyConfirm, () => {
          const nextPage = new URL(civilServiceUrl("./civil-service_07.html"));
          nextPage.searchParams.set("copies", selectedCopies);
          window.location.assign(nextPage.href);
        });
      });

      renderCopies();
    }

    if (printSelected && printConfirm) {
      printSelected.addEventListener("click", (event) => {
        if (printSelected.disabled || pendingAction) return;
        playRipple(event, printSelected);
        printSelected.setAttribute("aria-pressed", "true");
        printConfirm.disabled = false;
      });

      printConfirm.addEventListener("click", (event) => {
        afterRipple(event, printConfirm, () => {
          window.location.assign(civilServiceUrl("./civil-service_08.html"));
        });
      });
    }

    if (printProgress && printCopies) {
      printCopies.textContent = initialCopies;
      let printTimer;

      window.addEventListener("pageshow", () => {
        window.clearTimeout(printTimer);
        printTimer = window.setTimeout(() => {
          window.location.replace(civilServiceUrl("./civil-service_09.html"));
        }, 2000);
      });
      window.addEventListener("pagehide", () =>
        window.clearTimeout(printTimer)
      );
    }

    if (finishLink) {
      const completion = new URL(
        finishLink.getAttribute("href"),
        window.location.href
      );
      query.delete("copies");
      query.set("category", "civil-service");
      completion.search = query.toString();
      finishLink.href = completion.href;
    }
  }

  const headerTitle = document.querySelector(
    ".civil-service-header #header-title"
  );
  const registrationButton = document.querySelector("#service-registration");
  const certificateButton = document.querySelector("#service-certificate");
  const keypad = document.querySelector(".registration-keypad");
  const frontInput = document.querySelector("#registration-front");
  const backInput = document.querySelector("#registration-back");
  const confirmButton = document.querySelector("#registration-confirm");
  const loadingDialog = document.querySelector("#service-loading");
  const fingerprintOption = document.querySelector(
    "#service-fingerprint-option"
  );
  const authConfirm = document.querySelector("#service-auth-confirm");
  const fingerprintReader = document.querySelector(
    "#service-fingerprint-reader"
  );

  if (headerTitle) headerTitle.textContent = "무인민원발급기";

  if (registrationButton && loadingDialog) {
    initCivilServiceLoading(
      [registrationButton],
      loadingDialog,
      "./civil-service_01.html",
      1500
    );
  }

  if (certificateButton) {
    const nextPath =
      certificateButton.getAttribute("href") || "./civil-service_02.html";
    const destination = civilServiceUrl(nextPath);

    if (certificateButton.tagName === "A") {
      certificateButton.href = destination;
    } else {
      certificateButton.addEventListener("click", (event) => {
        afterRipple(event, certificateButton, () =>
          window.location.assign(destination)
        );
      });
    }
  }

  if (keypad && frontInput && backInput && confirmButton) {
    initRegistrationKeypad(keypad, frontInput, backInput, confirmButton);

    if (loadingDialog) {
      initCivilServiceLoading(
        [confirmButton],
        loadingDialog,
        "./civil-service_03.html",
        2000
      );
    }
  }

  for (const link of document.querySelectorAll("a[data-service-link]")) {
    link.href = civilServiceUrl(link.getAttribute("href"));
  }

  if (fingerprintOption && authConfirm) {
    fingerprintOption.addEventListener("click", (event) => {
      if (fingerprintOption.disabled || pendingAction) return;
      playRipple(event, fingerprintOption);
      fingerprintOption.setAttribute("aria-pressed", "true");
      authConfirm.disabled = false;
    });

    authConfirm.addEventListener("click", (event) => {
      afterRipple(event, authConfirm, () => {
        window.location.assign(civilServiceUrl("./civil-service_04.html"));
      });
    });
  }

  // 지문인식기 버튼을 누르면 인식 팝업을 띄운 뒤 다음 화면으로 이동
  // [수정] 2026-11-27 | 하단 확인 버튼 제거에 맞춰 지문인식기 클릭 시 인식 팝업이 열리도록 수정
  if (fingerprintReader && loadingDialog) {
    initCivilServiceLoading(
      [fingerprintReader],
      loadingDialog,
      "./civil-service_05.html",
      2000
    );
  }

  const issuancePanel = document.querySelector("#service-issuance-options");
  if (issuancePanel && loadingDialog) {
    initIssuanceOptions(issuancePanel, loadingDialog);
  }
  initCertificatePrinting();

  // 표시된 선택 영역만 처리하고, 라벨에서 라디오로 전달된 클릭은 중복 재생하지 않습니다.
  if (issuancePanel) {
    let forwardedInput = null;
    issuancePanel.addEventListener("click", (event) => {
      const choice = event.target.closest(".service-issuance-choice");
      const input = choice?.querySelector("input");
      if (!input || input.matches(":disabled") || pendingAction) return;
      if (event.target === input && forwardedInput === input) {
        forwardedInput = null;
        return;
      }
      forwardedInput = event.target === input ? null : input;
      playRipple(event, choice);
    });
  }

  const warningButton = document.querySelector(
    ".service-issuance-alert-button"
  );
  if (warningButton) {
    warningButton.addEventListener("click", (event) => {
      afterRipple(
        event,
        warningButton,
        () => {
          warningButton.closest("dialog").close(warningButton.value);
        },
        250
      );
    });
    // Enter로 폼을 제출해도 닫기 전에 같은 리플을 재생합니다.
    warningButton.form?.addEventListener("submit", (event) => {
      event.preventDefault();
      warningButton.click();
    });
  }

  // 일반 링크와 체험 완료 링크도 리플이 끝난 뒤 이동합니다.
  document
    .querySelectorAll(
      "a#service-certificate, a[data-service-link], #service-print-finish, .complete-actions #experience-retry, .complete-actions .civil-service-first-btn"
    )
    .forEach((link) => {
      link.addEventListener(
        "click",
        (event) => {
          if (
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey ||
            (event.button != null && event.button !== 0)
          )
            return;
          event.stopImmediatePropagation();
          afterRipple(event, link, () => window.location.assign(link.href));
        },
        { capture: true }
      );
    });

  const lottieFingerPrint = document.getElementById("lottie-fingerprint");
  const lottieFingerPrintThumb = document.getElementById("fingerprint-thumb");

  if (lottieFingerPrint && window.lottie && window.lottieFingerPrintData) {
    const cardAnimation = window.lottie.loadAnimation({
      container: lottieFingerPrint,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: window.lottieFingerPrintData,
    });

    cardAnimation.setSpeed(0.7);
  }
  if (lottieFingerPrintThumb && window.lottie && window.fingerPrintThumbData) {
    const cardAnimation = window.lottie.loadAnimation({
      container: lottieFingerPrintThumb,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: window.fingerPrintThumbData,
    });

    cardAnimation.setSpeed(0.8);
  }
});
