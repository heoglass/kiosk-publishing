document.addEventListener("DOMContentLoaded", function () {
  const ageDialog = document.querySelector("#cinema-age-dialog");

  if (ageDialog) {
    const agree = ageDialog.querySelector("[data-age-agree]");

    document.querySelectorAll("[data-age-next]").forEach((button) => {
      button.addEventListener("click", () => {
        agree.href = button.dataset.ageNext;
        ageDialog.showModal();
      });
    });
  }

  const peopleOptions = document.querySelector(".cinema-people-options");

  if (peopleOptions) {
    peopleOptions.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;

      const row = button.closest(".cinema-people-row");
      row
        .querySelector('[aria-pressed="true"]')
        .setAttribute("aria-pressed", "false");
      button.setAttribute("aria-pressed", "true");
    });

    const seniorDialog = document.querySelector("#cinema-senior-dialog");
    document
      .querySelector(".cinema-seat-button")
      .addEventListener("click", () => {
        seniorDialog.showModal();
      });
  }

  const seatGrid = document.querySelector(".cinema-seat-grid");

  seatGrid?.addEventListener("click", (event) => {
    const seat = event.target.closest(
      ".cinema-seat:not(.cinema-seat-unavailable)"
    );

    seat?.classList.toggle("cinema-seat-selected");
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

    paymentStart.addEventListener("click", () =>
      showCinemaPayment("cinema-card-payment")
    );

    document
      .querySelectorAll("[data-cinema-payment-next]")
      .forEach((button) => {
        button.addEventListener("click", () =>
          showCinemaPayment(button.dataset.cinemaPaymentNext)
        );
      });
  }
});
