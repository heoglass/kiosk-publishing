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

    target.classList.add("hospital-ripple-target");
    if (
      target.matches(
        '.hospital-start-button, .hospital-document-button, .hospital-keypad button[data-key], .hospital-copy-list button, .hospital-month-grid button, .hospital-year-arrow, .hospital-month-actions button[value="cancel"]'
      )
    ) {
      target.classList.add("hospital-ripple-light");
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
    ripple.className = "hospital-button-ripple";
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

  function updateIssueButtons() {
    const fee = document.getElementById("hospital-document-fee");
    if (!fee) return;
    const text = fee.textContent.trim();
    const hasFee =
      text === "무료" ||
      /^(?:[1-9]\d*|[1-9]\d{0,2}(?:,\d{3})+)\s*원$/.test(text);
    const hasStart = Boolean(
      document.getElementById("hospital-start-month")?.value
    );
    const hasEnd = Boolean(
      document.getElementById("hospital-end-month")?.value
    );
    const hasCopies = Boolean(
      document.querySelector('.hospital-copy-list button[aria-pressed="true"]')
    );
    const sameDay = document.querySelector(".hospital-same-day");
    const confirm = document.querySelector(".hospital-issue-confirm");
    if (sameDay) sameDay.disabled = !hasFee;
    if (confirm)
      confirm.disabled = !(hasFee && hasStart && hasEnd && hasCopies);
  }

  document.querySelectorAll("[data-hospital-keypad]").forEach((form) => {
    const field = form.querySelector(".hospital-number-field");
    const keypad = form.querySelector(".hospital-keypad");
    const keys = keypad.querySelectorAll("[data-key]");
    const confirmButton = form.querySelector(".hospital-confirm");
    const requestButton = form.querySelector(".hospital-auth-request");
    const minDigits = Number(form.dataset.minDigits);
    const maxDigits = Number(form.dataset.maxDigits);
    const hyphenAfter = Number(form.dataset.hyphenAfter);
    let digits = "";

    function render() {
      field.value =
        hyphenAfter && digits.length > hyphenAfter
          ? digits.slice(0, hyphenAfter) + "-" + digits.slice(hyphenAfter)
          : digits;
      confirmButton.disabled = field.disabled || digits.length < minDigits;
    }

    function enterKey(key) {
      if (field.disabled) return;

      if (key === "delete") {
        digits = digits.slice(0, -1);
      } else if (digits.length < maxDigits) {
        digits += key;
      }

      render();
    }

    keypad.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-key]");
      if (!button || button.disabled || field.disabled || pendingAction) return;
      playRipple(event, button);
      enterKey(button.dataset.key);
    });

    form.addEventListener("keydown", (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key !== "Backspace" && !/^[0-9]$/.test(event.key)) return;

      event.preventDefault();
      enterKey(event.key === "Backspace" ? "delete" : event.key);
    });

    let submitClickEvent = null;
    confirmButton.addEventListener("click", (event) => {
      submitClickEvent = event;
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (confirmButton.disabled || pendingAction) return;
      const rippleEvent = submitClickEvent ?? event;
      submitClickEvent = null;
      afterRipple(rippleEvent, confirmButton, () => {
        HTMLFormElement.prototype.submit.call(form);
      });
    });

    if (requestButton) {
      const setEntryDisabled = (disabled) => {
        field.disabled = disabled;
        keys.forEach((key) => {
          key.disabled = disabled;
        });
        render();
      };

      requestButton.addEventListener("click", (event) => {
        afterRipple(
          event,
          requestButton,
          () => {
            digits = "";
            setEntryDisabled(true);
            requestButton.textContent = "다시요청";
            requestButton.classList.add("is-resend");
            requestButton.disabled = true;

            window.setTimeout(() => {
              setEntryDisabled(false);
              requestButton.disabled = false;
              field.focus({ preventScroll: true });
            }, 2000);
          },
          250
        );
      });

      setEntryDisabled(true);
    } else {
      render();
    }
  });

  const hospitalCopyButtons = document.querySelectorAll(
    ".hospital-copy-list button"
  );

  hospitalCopyButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      if (button.disabled || pendingAction) return;
      playRipple(event, button);
      hospitalCopyButtons.forEach((option) => {
        option.setAttribute("aria-pressed", String(option === button));
      });
      updateIssueButtons();
    });
  });

  const hospitalMonthDialog = document.querySelector(".hospital-month-dialog");

  if (hospitalMonthDialog) {
    const form = hospitalMonthDialog.querySelector(".hospital-month-form");
    const title = hospitalMonthDialog.querySelector("#hospital-month-title");
    const yearDisplay = hospitalMonthDialog.querySelector(
      ".hospital-month-year"
    );
    const previousYear = hospitalMonthDialog.querySelector(
      ".hospital-year-previous"
    );
    const nextYear = hospitalMonthDialog.querySelector(".hospital-year-next");
    const monthButtons = hospitalMonthDialog.querySelectorAll("[data-month]");
    const confirmButton = hospitalMonthDialog.querySelector(
      ".hospital-month-confirm"
    );
    let targetField;
    let currentYear;
    let selectedYear;
    let selectedMonth;

    function renderMonthDialog() {
      yearDisplay.value = String(selectedYear);
      previousYear.disabled = selectedYear <= 1;
      nextYear.disabled = selectedYear >= currentYear;
      confirmButton.disabled = !selectedMonth;

      monthButtons.forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.month === selectedMonth)
        );
      });
    }

    document.querySelectorAll("[data-month-target]").forEach((button) => {
      button.addEventListener("click", (event) => {
        afterRipple(
          event,
          button,
          () => {
            targetField = document.getElementById(button.dataset.monthTarget);
            const [savedYear, savedMonth] = targetField.value.split("-");
            currentYear = new Date().getFullYear();
            selectedYear = Number(savedYear) || currentYear;
            selectedMonth = savedMonth ? String(Number(savedMonth)) : "";
            title.textContent = button.dataset.monthTitle;
            renderMonthDialog();
            hospitalMonthDialog.showModal();
          },
          250
        );
      });
    });

    previousYear.addEventListener("click", (event) => {
      if (previousYear.disabled || pendingAction) return;
      playRipple(event, previousYear);
      selectedYear -= 1;
      renderMonthDialog();
    });

    nextYear.addEventListener("click", (event) => {
      if (nextYear.disabled || pendingAction) return;
      playRipple(event, nextYear);
      selectedYear += 1;
      renderMonthDialog();
    });

    monthButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        if (button.disabled || pendingAction) return;
        playRipple(event, button);
        selectedMonth = button.dataset.month;
        renderMonthDialog();
      });
    });

    let monthClickEvent = null;
    form
      .querySelectorAll(".hospital-month-actions button")
      .forEach((button) => {
        button.addEventListener("click", (event) => {
          monthClickEvent = event;
        });
      });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const button = event.submitter;
      if (!button || button.disabled || pendingAction) return;
      const rippleEvent = monthClickEvent ?? event;
      monthClickEvent = null;
      afterRipple(
        rippleEvent,
        button,
        () => {
          if (button === confirmButton) {
            const year = String(selectedYear).padStart(4, "0");
            targetField.value = year + "-" + selectedMonth.padStart(2, "0");
            updateIssueButtons();
          }
          hospitalMonthDialog.close(button.value);
        },
        250
      );
    });
  }

  const hospitalIssueButtons = document.querySelectorAll(
    ".hospital-same-day, .hospital-issue-confirm"
  );

  if (hospitalIssueButtons.length) {
    const fee = document.getElementById("hospital-document-fee");
    const paymentAmount = document.getElementById("hospital-payment-amount");
    const cardPayment = document.getElementById("hospital-card-payment");
    const paymentProgress = document.getElementById(
      "hospital-payment-progress"
    );
    const paymentComplete = document.getElementById(
      "hospital-payment-complete"
    );
    const certificateProgress = document.getElementById(
      "hospital-certificate-progress"
    );

    function readFee() {
      const text = fee.textContent.trim();
      return text === "무료" ||
        /^(?:[1-9]\d*|[1-9]\d{0,2}(?:,\d{3})+)\s*원$/.test(text)
        ? text
        : "";
    }

    function showPaymentStage(dialog) {
      dialog.showModal();

      if (dialog === paymentProgress || dialog === certificateProgress) {
        const timer = window.setTimeout(() => {
          if (!dialog.open) return;

          if (dialog === paymentProgress) {
            dialog.close();
            showPaymentStage(paymentComplete);
          } else {
            window.location.assign("./hospital_05.html");
          }
        }, 2000);

        dialog.addEventListener("close", () => window.clearTimeout(timer), {
          once: true,
        });
      }
    }

    function startIssue(event) {
      updateIssueButtons();
      const button = event.currentTarget;
      const amount = readFee();
      if (button.disabled || !amount) return;
      afterRipple(
        event,
        button,
        () => {
          if (amount === "무료") {
            showPaymentStage(certificateProgress);
          } else {
            paymentAmount.textContent = amount;
            showPaymentStage(cardPayment);
          }
        },
        250
      );
    }

    hospitalIssueButtons.forEach((button) => {
      button.addEventListener("click", startIssue);
    });

    document
      .querySelectorAll("[data-hospital-payment-next]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const dialog = button.closest("dialog");
          if (!dialog.open) return;

          const next = document.getElementById(
            button.dataset.hospitalPaymentNext
          );
          dialog.close();
          showPaymentStage(next);
        });
      });

    [paymentProgress, paymentComplete, certificateProgress].forEach(
      (dialog) => {
        dialog.addEventListener("cancel", (event) => event.preventDefault());
      }
    );

    new MutationObserver(updateIssueButtons).observe(fee, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    updateIssueButtons();
  }

  // 표시된 시작·서류 선택·완료 링크도 리플이 끝난 뒤 이동합니다.
  document
    .querySelectorAll(
      "a.hospital-start-button.hospital-action, a.hospital-document-button.hospital-action, a.hospital-complete-button, .complete-actions #experience-retry, .complete-actions .hospital-first-btn"
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
});
