document.addEventListener("DOMContentLoaded", () => {
  const lumpSum = document.getElementById("self-gas-lump-sum");
  const installment = document.getElementById("self-gas-installment");
  const cardGuide = document.getElementById("self-gas-card-guide");
  const cardGuideButton = document.getElementById("self-gas-card-guide-button");
  const bonusGuide = document.getElementById("self-gas-bonus-guide");
  const approval = document.getElementById("self-gas-approval");
  const preparing = document.getElementById("self-gas-preparing");

  if (
    !lumpSum ||
    !installment ||
    !cardGuide ||
    !cardGuideButton ||
    !bonusGuide ||
    !approval ||
    !preparing
  ) {
    return;
  }

  const waitTime = 2000;
  // const waitTime = 200000;

  function showStep(
    currentStep,
    nextStep,
    focusTarget = nextStep.querySelector("h1")
  ) {
    currentStep.hidden = true;
    nextStep.hidden = false;
    focusTarget?.focus({ preventScroll: true });
  }

  lumpSum.addEventListener("click", () => {
    showStep(installment, cardGuide, cardGuideButton);
  });

  cardGuideButton.addEventListener("click", () => {
    showStep(cardGuide, bonusGuide);
  });

  bonusGuide.addEventListener("click", (event) => {
    const approveButton = event.target.closest("button[data-self-gas-approve]");
    if (bonusGuide.hidden || !approveButton || approveButton.disabled) return;

    showStep(bonusGuide, approval);

    window.setTimeout(() => {
      showStep(approval, preparing);

      window.setTimeout(() => {
        window.location.href = "./self-gas_05.html";
      }, waitTime);
    }, waitTime);
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("self-gas-fueling-button");
  const fueling = document.getElementById("self-gas-fueling");
  const complete = document.getElementById("self-gas-fueling-complete");
  const completeTitle = document.getElementById(
    "self-gas-fueling-complete-title"
  );

  if (!startButton || !fueling || !complete || !completeTitle) return;

  startButton.addEventListener("click", () => {
    fueling.hidden = true;
    complete.hidden = false;
    completeTitle.focus({ preventScroll: true });
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const removeCard = document.getElementById("self-gas-remove-card");
  const removeCardButton = document.getElementById(
    "self-gas-remove-card-button"
  );
  const receipt = document.getElementById("self-gas-receipt");
  const receiptTitle = document.getElementById("self-gas-receipt-title");

  if (!removeCard || !removeCardButton || !receipt || !receiptTitle) return;

  removeCardButton.addEventListener("click", () => {
    removeCard.hidden = true;
    receipt.hidden = false;
    receiptTitle.focus({ preventScroll: true });
  });
});
