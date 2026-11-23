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

    target.classList.add("cinema-ripple-target");
    if (target.matches(".cinema-people-row button")) {
      target.classList.add("cinema-ripple-light");
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
    ripple.className = "cinema-button-ripple";
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

  const ageDialog = document.querySelector("#cinema-age-dialog");

  if (ageDialog) {
    const agree = ageDialog.querySelector("[data-age-agree]");

    document.querySelectorAll("[data-age-next]").forEach((button) => {
      button.addEventListener("click", (event) => {
        if (ageDialog.open) return;
        afterRipple(
          event,
          button,
          () => {
            agree.href = button.dataset.ageNext;
            ageDialog.showModal();
          },
          250
        );
      });
    });
  }

  const peopleOptions = document.querySelector(".cinema-people-options");

  if (peopleOptions) {
    peopleOptions.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button || button.disabled || pendingAction) return;
      playRipple(event, button);

      const row = button.closest(".cinema-people-row");
      row
        .querySelector('[aria-pressed="true"]')
        .setAttribute("aria-pressed", "false");
      button.setAttribute("aria-pressed", "true");
    });

    const seniorDialog = document.querySelector("#cinema-senior-dialog");
    document
      .querySelector(".cinema-seat-button")
      .addEventListener("click", (event) => {
        if (seniorDialog.open) return;
        afterRipple(
          event,
          event.currentTarget,
          () => {
            seniorDialog.showModal();
          },
          250
        );
      });
  }

  const seatGrid = document.querySelector(".cinema-seat-grid");

  seatGrid?.addEventListener("click", (event) => {
    const seat = event.target.closest(
      ".cinema-seat:not(.cinema-seat-unavailable)"
    );

    if (!seat || pendingAction) return;
    playRipple(event, seat);
    seat.classList.toggle("cinema-seat-selected");
  });

  const paymentStart = document.querySelector("[data-cinema-payment-start]");

  if (paymentStart) {
    let paymentTimer;

    function showCinemaPayment(id) {
      window.clearTimeout(paymentTimer);
      document.querySelector(".cinema-payment-modal[open]")?.close();

      const dialog = document.getElementById(id);
      dialog.showModal();

      const next = dialog.dataset.cinemaPaymentAuto;
      if (next) {
        paymentTimer = window.setTimeout(() => {
          if (dialog.open) showCinemaPayment(next);
        }, 2000);
      }
    }

    paymentStart.addEventListener("click", (event) => {
      if (document.querySelector(".cinema-payment-modal[open]")) return;
      afterRipple(
        event,
        paymentStart,
        () => {
          showCinemaPayment("cinema-card-payment");
        },
        250
      );
    });

    document
      .querySelectorAll("[data-cinema-payment-next]")
      .forEach((button) => {
        button.addEventListener("click", () =>
          showCinemaPayment(button.dataset.cinemaPaymentNext)
        );
      });
  }

  // 표시된 링크만 처리하고, 리플이 끝난 뒤 기존 경로로 이동합니다.
  document
    .querySelectorAll(
      "a.cinema-buy, a.cinema-film, a.cinema-dialog-agree, a.cinema-seat-button, .complete-actions #experience-retry, .complete-actions .cinema-first-btn"
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
