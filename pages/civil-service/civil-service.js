// document.addEventListener("DOMContentLoaded", () => {
//   function civilServiceUrl(path) {
//     const nextPage = new URL(path, window.location.href);
//     nextPage.search = window.location.search;
//     return nextPage.href;
//   }

//   function initCivilServiceLoading(
//     triggers,
//     dialog,
//     nextPath,
//     loadingDuration,
//     canOpen
//   ) {
//     const [trigger] = triggers;
//     const destination = civilServiceUrl(
//       trigger.dataset.loadingNext || nextPath
//     );
//     const delay = Number(trigger.dataset.loadingDelay || loadingDuration);
//     let navigationTimer;

//     dialog.addEventListener("cancel", (event) => event.preventDefault());

//     function openLoading(event) {
//       if (event.currentTarget.disabled || dialog.open) return;
//       if (canOpen && !canOpen()) return;

//       dialog.showModal();
//       navigationTimer = window.setTimeout(() => {
//         window.location.assign(destination);
//       }, delay);
//     }

//     for (const button of triggers) {
//       button.addEventListener("click", openLoading);
//     }

//     window.addEventListener("pagehide", () => {
//       window.clearTimeout(navigationTimer);
//       if (dialog.open) dialog.close();
//     });
//   }

//   function initRegistrationKeypad(
//     keypad,
//     frontInput,
//     backInput,
//     confirmButton
//   ) {
//     const frontLength = 6;
//     const totalLength = 13;
//     let digits = "";

//     function renderNumber() {
//       frontInput.value = digits.slice(0, frontLength);
//       backInput.value = digits.slice(frontLength);
//       confirmButton.disabled = digits.length !== totalLength;
//     }

//     function clearNumber() {
//       digits = "";
//       renderNumber();
//     }

//     keypad.addEventListener("click", (event) => {
//       const keyButton = event.target.closest("button[data-registration-key]");
//       if (!keyButton) return;

//       const key = keyButton.dataset.registrationKey;

//       if (key === "clear") {
//         clearNumber();
//         return;
//       }

//       if (key === "backspace") {
//         digits = digits.slice(0, -1);
//       } else if (/^[0-9]$/.test(key) && digits.length < totalLength) {
//         digits += key;
//       }

//       renderNumber();
//     });

//     window.addEventListener("pagehide", clearNumber);
//     renderNumber();
//   }

//   function initIssuanceOptions(panel, loadingDialog) {
//     const confirm = document.querySelector("#service-issuance-confirm");
//     const warningDialog = document.querySelector("#service-issuance-warning");
//     const warningMessage = document.querySelector(
//       "#service-issuance-warning-message"
//     );
//     if (!confirm || !warningDialog || !warningMessage) return;

//     const rows = [...panel.querySelectorAll(".service-issuance-row")];
//     const bulkChoices = panel.querySelectorAll('input[name="issuance-bulk"]');
//     let missingChoice;

//     function syncBulkChoices() {
//       for (const bulkChoice of bulkChoices) {
//         bulkChoice.checked = rows.every((row) =>
//           row.querySelector(
//             `input[data-issuance-choice="${bulkChoice.value}"]:checked`
//           )
//         );
//       }
//     }

//     for (const bulkChoice of bulkChoices) {
//       bulkChoice.addEventListener("click", () => {
//         for (const row of rows) {
//           row.querySelector(
//             `input[data-issuance-choice="${bulkChoice.value}"]`
//           ).checked = true;
//         }
//         syncBulkChoices();
//       });
//     }

//     panel.addEventListener("change", syncBulkChoices);
//     window.addEventListener("pageshow", syncBulkChoices);
//     syncBulkChoices();

//     warningDialog.addEventListener("close", () => {
//       missingChoice?.focus();
//     });

//     window.addEventListener("pagehide", () => {
//       if (warningDialog.open) warningDialog.close();
//     });

//     function hasAllChoices() {
//       if (warningDialog.open) return false;

//       const missingRow = rows.find(
//         (row) => !row.querySelector("input:checked")
//       );
//       if (!missingRow) return true;

//       missingChoice = missingRow.querySelector("input");
//       const item = missingRow
//         .querySelector(".service-issuance-row-title")
//         .textContent.trim();
//       warningMessage.textContent = `‘${item}’ 항목을 선택해주세요.`;
//       warningDialog.showModal();
//       return false;
//     }

//     initCivilServiceLoading(
//       [confirm],
//       loadingDialog,
//       "./civil-service_06.html",
//       2000,
//       hasAllChoices
//     );
//   }

//   const headerTitle = document.querySelector(
//     ".civil-service-header #header-title"
//   );
//   const registrationButton = document.querySelector("#service-registration");
//   const certificateButton = document.querySelector("#service-certificate");
//   const keypad = document.querySelector(".registration-keypad");
//   const frontInput = document.querySelector("#registration-front");
//   const backInput = document.querySelector("#registration-back");
//   const confirmButton = document.querySelector("#registration-confirm");
//   const loadingDialog = document.querySelector("#service-loading");
//   const fingerprintOption = document.querySelector(
//     "#service-fingerprint-option"
//   );
//   const authConfirm = document.querySelector("#service-auth-confirm");
//   const fingerprintReader = document.querySelector(
//     "#service-fingerprint-reader"
//   );
//   const fingerprintConfirm = document.querySelector(
//     "#service-fingerprint-confirm"
//   );

//   if (headerTitle) headerTitle.textContent = "무인민원발급기";

//   if (registrationButton && loadingDialog) {
//     initCivilServiceLoading(
//       [registrationButton],
//       loadingDialog,
//       "./civil-service_01.html",
//       1500
//     );
//   }

//   if (certificateButton) {
//     const nextPath =
//       certificateButton.getAttribute("href") || "./civil-service_02.html";
//     const destination = civilServiceUrl(nextPath);

//     if (certificateButton.tagName === "A") {
//       certificateButton.href = destination;
//     } else {
//       certificateButton.addEventListener("click", () =>
//         window.location.assign(destination)
//       );
//     }
//   }

//   if (keypad && frontInput && backInput && confirmButton) {
//     initRegistrationKeypad(keypad, frontInput, backInput, confirmButton);

//     if (loadingDialog) {
//       initCivilServiceLoading(
//         [confirmButton],
//         loadingDialog,
//         "./civil-service_03.html",
//         2000
//       );
//     }
//   }

//   for (const link of document.querySelectorAll("a[data-service-link]")) {
//     link.href = civilServiceUrl(link.getAttribute("href"));
//   }

//   if (fingerprintOption && authConfirm) {
//     fingerprintOption.addEventListener("click", () => {
//       fingerprintOption.setAttribute("aria-pressed", "true");
//       authConfirm.disabled = false;
//     });

//     authConfirm.addEventListener("click", () => {
//       if (authConfirm.disabled) return;
//       window.location.assign(civilServiceUrl("./civil-service_04.html"));
//     });
//   }

//   if (fingerprintReader && fingerprintConfirm && loadingDialog) {
//     initCivilServiceLoading(
//       [fingerprintReader, fingerprintConfirm],
//       loadingDialog,
//       "./civil-service_05.html",
//       2000
//     );
//   }

//   const issuancePanel = document.querySelector("#service-issuance-options");
//   if (issuancePanel && loadingDialog) {
//     initIssuanceOptions(issuancePanel, loadingDialog);
//   }
// });
document.addEventListener("DOMContentLoaded", () => {
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
      if (event.currentTarget.disabled || dialog.open) return;
      if (canOpen && !canOpen()) return;

      dialog.showModal();
      navigationTimer = window.setTimeout(() => {
        window.location.assign(destination);
      }, delay);
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
      if (!keyButton) return;

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
        key.addEventListener("click", () => {
          selectedCopies = key.dataset.serviceCopy;
          renderCopies();
        });
      }

      copyConfirm.addEventListener("click", () => {
        const nextPage = new URL(civilServiceUrl("./civil-service_07.html"));
        nextPage.searchParams.set("copies", selectedCopies);
        window.location.assign(nextPage.href);
      });

      renderCopies();
    }

    if (printSelected && printConfirm) {
      printSelected.addEventListener("click", () => {
        printSelected.setAttribute("aria-pressed", "true");
        printConfirm.disabled = false;
      });

      printConfirm.addEventListener("click", () => {
        if (printConfirm.disabled) return;
        window.location.assign(civilServiceUrl("./civil-service_08.html"));
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
  const fingerprintConfirm = document.querySelector(
    "#service-fingerprint-confirm"
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
      certificateButton.addEventListener("click", () =>
        window.location.assign(destination)
      );
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
    fingerprintOption.addEventListener("click", () => {
      fingerprintOption.setAttribute("aria-pressed", "true");
      authConfirm.disabled = false;
    });

    authConfirm.addEventListener("click", () => {
      if (authConfirm.disabled) return;
      window.location.assign(civilServiceUrl("./civil-service_04.html"));
    });
  }

  if (fingerprintReader && fingerprintConfirm && loadingDialog) {
    initCivilServiceLoading(
      [fingerprintReader, fingerprintConfirm],
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
});
