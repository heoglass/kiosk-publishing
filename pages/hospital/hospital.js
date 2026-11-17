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
    if (button) enterKey(button.dataset.key);
  });

  form.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key !== "Backspace" && !/^[0-9]$/.test(event.key)) return;

    event.preventDefault();
    enterKey(event.key === "Backspace" ? "delete" : event.key);
  });

  form.addEventListener("submit", (event) => {
    if (confirmButton.disabled) event.preventDefault();
  });

  if (requestButton) {
    const setEntryDisabled = (disabled) => {
      field.disabled = disabled;
      keys.forEach((key) => {
        key.disabled = disabled;
      });
      render();
    };

    requestButton.addEventListener("click", () => {
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
  button.addEventListener("click", () => {
    hospitalCopyButtons.forEach((option) => {
      option.setAttribute("aria-pressed", String(option === button));
    });
  });
});

const hospitalMonthDialog = document.querySelector(".hospital-month-dialog");

if (hospitalMonthDialog) {
  const form = hospitalMonthDialog.querySelector(".hospital-month-form");
  const title = hospitalMonthDialog.querySelector("#hospital-month-title");
  const yearDisplay = hospitalMonthDialog.querySelector(".hospital-month-year");
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
    button.addEventListener("click", () => {
      targetField = document.getElementById(button.dataset.monthTarget);
      const [savedYear, savedMonth] = targetField.value.split("-");
      currentYear = new Date().getFullYear();
      selectedYear = Number(savedYear) || currentYear;
      selectedMonth = savedMonth ? String(Number(savedMonth)) : "";
      title.textContent = button.dataset.monthTitle;
      renderMonthDialog();
      hospitalMonthDialog.showModal();
    });
  });

  previousYear.addEventListener("click", () => {
    if (previousYear.disabled) return;
    selectedYear -= 1;
    renderMonthDialog();
  });

  nextYear.addEventListener("click", () => {
    if (nextYear.disabled) return;
    selectedYear += 1;
    renderMonthDialog();
  });

  monthButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedMonth = button.dataset.month;
      renderMonthDialog();
    });
  });

  form.addEventListener("submit", (event) => {
    if (event.submitter !== confirmButton) return;
    if (confirmButton.disabled) {
      event.preventDefault();
      return;
    }

    const year = String(selectedYear).padStart(4, "0");
    targetField.value = year + "-" + selectedMonth.padStart(2, "0");
  });
}

const hospitalIssueButtons = document.querySelectorAll(
  ".hospital-same-day, .hospital-issue-confirm"
);

if (hospitalIssueButtons.length) {
  const fee = document.getElementById("hospital-document-fee");
  const paymentAmount = document.getElementById("hospital-payment-amount");
  const cardPayment = document.getElementById("hospital-card-payment");
  const paymentProgress = document.getElementById("hospital-payment-progress");
  const paymentComplete = document.getElementById("hospital-payment-complete");
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

  function updateIssueButtons() {
    const disabled = !readFee();
    hospitalIssueButtons.forEach((button) => {
      button.disabled = disabled;
    });
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

  function startIssue() {
    const amount = readFee();
    if (!amount) return;

    if (amount === "무료") {
      showPaymentStage(certificateProgress);
    } else {
      paymentAmount.textContent = amount;
      showPaymentStage(cardPayment);
    }
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

  [paymentProgress, paymentComplete, certificateProgress].forEach((dialog) => {
    dialog.addEventListener("cancel", (event) => event.preventDefault());
  });

  new MutationObserver(updateIssueButtons).observe(fee, {
    childList: true,
    characterData: true,
    subtree: true,
  });
  updateIssueButtons();
}
