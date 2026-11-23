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

    target.classList.add("self-gas-ripple-target");
    if (
      target.matches(
        ".self-gas-amount-option, #self-gas-lump-sum, .self-gas-ripple-image, .self-gas-card-guide-box, .self-gas-fueling-button"
      )
    ) {
      target.classList.add("self-gas-ripple-light");
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
    ripple.className = "self-gas-button-ripple";
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
    const visualTarget =
      target.querySelector(".self-gas-ripple-image") || target;
    const animation = playRipple(event, visualTarget, duration);
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

  // 이미지가 표시된 영역에 리플을 겹치기 위한 컨테이너입니다.
  document
    .querySelectorAll(
      ".self-gas-bonus-image img, .self-gas-remove-card-image, .self-gas-receipt-image"
    )
    .forEach((image) => {
      const wrapper = document.createElement("span");
      wrapper.className = "self-gas-ripple-image";
      image.replaceWith(wrapper);
      wrapper.append(image);
    });

  const flowTimers = new Set();
  function waitForStep(action, duration) {
    const timer = window.setTimeout(() => {
      flowTimers.delete(timer);
      action();
    }, duration);
    flowTimers.add(timer);
  }
  window.addEventListener("pagehide", () => {
    flowTimers.forEach((timer) => window.clearTimeout(timer));
    flowTimers.clear();
  });

  function initCardSteps() {
    const lumpSum = document.getElementById("self-gas-lump-sum");
    const installment = document.getElementById("self-gas-installment");
    const cardGuide = document.getElementById("self-gas-card-guide");
    const cardGuideButton = document.getElementById(
      "self-gas-card-guide-button"
    );
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
    )
      return;

    const waitTime = 2000;
    function showStep(
      currentStep,
      nextStep,
      focusTarget = nextStep.querySelector("h1")
    ) {
      currentStep.hidden = true;
      nextStep.hidden = false;
      focusTarget?.focus({ preventScroll: true });
    }

    lumpSum.addEventListener("click", (event) => {
      if (installment.hidden) return;
      afterRipple(
        event,
        lumpSum,
        () => {
          showStep(installment, cardGuide, cardGuideButton);
        },
        250
      );
    });
    cardGuideButton.addEventListener("click", (event) => {
      if (cardGuide.hidden) return;
      afterRipple(
        event,
        cardGuideButton,
        () => {
          showStep(cardGuide, bonusGuide);
        },
        250
      );
    });
    bonusGuide.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-self-gas-approve]");
      if (bonusGuide.hidden || !button || button.disabled) return;
      afterRipple(
        event,
        button,
        () => {
          showStep(bonusGuide, approval);
          waitForStep(() => {
            showStep(approval, preparing);
            waitForStep(() => {
              window.location.assign("./self-gas_05.html");
            }, waitTime);
          }, waitTime);
        },
        250
      );
    });
  }

  function initFuelingSteps() {
    const startButton = document.getElementById("self-gas-fueling-button");
    const fueling = document.getElementById("self-gas-fueling");
    const complete = document.getElementById("self-gas-fueling-complete");
    const title = document.getElementById("self-gas-fueling-complete-title");
    if (!startButton || !fueling || !complete || !title) return;

    startButton.addEventListener("click", (event) => {
      if (fueling.hidden) return;
      afterRipple(
        event,
        startButton,
        () => {
          fueling.hidden = true;
          complete.hidden = false;
          title.focus({ preventScroll: true });
        },
        250
      );
    });
  }

  function initFinishSteps() {
    const removeCard = document.getElementById("self-gas-remove-card");
    const button = document.getElementById("self-gas-remove-card-button");
    const receipt = document.getElementById("self-gas-receipt");
    const title = document.getElementById("self-gas-receipt-title");
    if (!removeCard || !button || !receipt || !title) return;

    button.addEventListener("click", (event) => {
      if (removeCard.hidden) return;
      afterRipple(
        event,
        button,
        () => {
          removeCard.hidden = true;
          receipt.hidden = false;
          title.focus({ preventScroll: true });
        },
        250
      );
    });
  }

  document
    .querySelectorAll(
      "a.self-gas-start, a.self-gas-payment-credit, a.self-gas-fuel-option, a.self-gas-amount-option, a.self-gas-fueling-cap, #self-gas-receipt-link, .complete-actions-horizontal a"
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

  initCardSteps();
  initFuelingSteps();
  initFinishSteps();
});
