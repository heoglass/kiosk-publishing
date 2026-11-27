'use strict';

document.addEventListener("DOMContentLoaded", () => {
  const rippleTargets = [
    ".air-airline", ".air-btn", ".air-method", ".air-lang__btn",
    ".air-pager__btn", ".air-key", ".air-seat", ".air-cabin__zone",
    ".complete-button"
  ].join(", ");
  let pendingNavigation = null;

  function playRipple(event, target, duration) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;

    const host = target.classList.contains("air-airline") ? target.parentElement : target;
    host.classList.add("air-ripple-host");
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    const rect = host.getBoundingClientRect();
    const size = Math.hypot(host.clientWidth, host.clientHeight) * 2;
    const ripple = document.createElement("span");
    ripple.className = "air-ripple";
    ripple.setAttribute("aria-hidden", "true");
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.detail ? ((event.clientX - rect.left) / rect.width) * 100 : 50}%`;
    ripple.style.top = `${event.detail ? ((event.clientY - rect.top) / rect.height) * 100 : 50}%`;
    host.append(ripple);

    const animation = ripple.animate([
      { transform: "translate(-50%, -50%) scale(0)", opacity: 1 },
      { transform: "translate(-50%, -50%) scale(1)", opacity: 0 }
    ], { duration, easing: "ease-out" });
    animation.addEventListener("finish", () => ripple.remove());
    animation.addEventListener("cancel", () => ripple.remove());
    return animation;
  }

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest(rippleTargets);
    if (!target || target.disabled || target.classList.contains("disabled-color") ||
        target.getAttribute("aria-disabled") === "true") return;
    if (target instanceof HTMLButtonElement) playRipple(event, target, 700);
  }, true);

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest(rippleTargets);
    if (!(link instanceof HTMLAnchorElement) || !link.hasAttribute("href") || link.classList.contains("disabled-color") ||
        link.getAttribute("aria-disabled") === "true" || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
        link.hasAttribute("download") || (link.target && link.target !== "_self")) return;

    if (event.defaultPrevented || link.getAttribute("href").startsWith("#")) {
      playRipple(event, link, 700);
      return;
    }

    if (pendingNavigation) {
      event.preventDefault();
      return;
    }
    const animation = playRipple(event, link, 250);
    if (!animation) return;
    event.preventDefault();
    pendingNavigation = animation;
    animation.addEventListener("finish", () => {
      if (pendingNavigation !== animation) return;
      pendingNavigation = null;
      window.location.href = link.href;
    });
  });

  window.addEventListener("pagehide", () => {
    if (pendingNavigation) pendingNavigation.cancel();
    pendingNavigation = null;
  });

  const pager = document.querySelector(".air-pager");
  const pages = Array.from(
    document.querySelectorAll("[data-air-hazard-page]")
  );

  if (pager && pages.length > 0) {
    const previousButton = pager.querySelector('[data-hazard-page="previous"]');
    const nextButton = pager.querySelector('[data-hazard-page="next"]');
    const pageCount = pager.querySelector(".air-pager__count");
    const nextScreenButton = document.querySelector("[data-hazard-next]");
    let activePage = 0;

    function showPage(index) {
      activePage = Math.max(0, Math.min(index, pages.length - 1));

      pages.forEach((page, pageIndex) => {
        const isActive = pageIndex === activePage;
        page.hidden = !isActive;
        page.setAttribute("aria-hidden", String(!isActive));
      });

      previousButton.disabled = activePage === 0;
      nextButton.disabled = activePage === pages.length - 1;
      previousButton.classList.toggle("disabled-color", previousButton.disabled);
      nextButton.classList.toggle("disabled-color", nextButton.disabled);
      pageCount.textContent = `${activePage + 1}/${pages.length}`;
    }

    previousButton.addEventListener("click", () => showPage(activePage - 1));
    nextButton.addEventListener("click", () => showPage(activePage + 1));
    if (nextScreenButton) {
      nextScreenButton.addEventListener("click", (event) => {
        if (activePage < pages.length - 1) {
          event.preventDefault();
          showPage(activePage + 1);
        }
      });
    }
    showPage(activePage);
  }

  const keyboard = document.querySelector("#airKeyboard");
  const input = document.querySelector("#airReserveNo");

  if (keyboard && input) {
    input.addEventListener("input", () => {
      const reservationNumber = input.value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, input.maxLength);

      if (input.value !== reservationNumber) {
        input.value = reservationNumber;
      }

      if (input.value.length === input.maxLength) {
        window.location.href = "./air-07.html";
      }
    });

    keyboard.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;

      const keyButton = event.target.closest("button[data-key]");
      if (!keyButton || !keyboard.contains(keyButton)) return;

      const key = keyButton.dataset.key;
      if (key === "back") {
        input.value = input.value.slice(0, -1);
      } else if (/^[a-z0-9]$/i.test(key) && input.value.length < input.maxLength) {
        input.value += key.toUpperCase();
      } else {
        return;
      }

      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  const seatMap = document.querySelector(".air-seatmap");
  const seatSubmit = document.querySelector("#airSeatSubmit");

  if (seatMap && seatSubmit) {
    const seats = Array.from(
      seatMap.querySelectorAll(".air-seat[data-seat]:not(:disabled)")
    );
    let selectedSeat = null;

    function updateSeatSelection(seat) {
      selectedSeat = seat;
      seats.forEach((button) => {
        const isSelected = button.dataset.seat === selectedSeat;
        button.classList.toggle("air-seat--selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
      });

      seatSubmit.disabled = !selectedSeat;
      seatSubmit.classList.toggle("disabled-color", !selectedSeat);
    }

    updateSeatSelection(null);

    seatMap.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;

      const seatButton = event.target.closest(".air-seat[data-seat]");
      if (!seatButton || !seatMap.contains(seatButton) || seatButton.disabled) return;

      updateSeatSelection(
        selectedSeat === seatButton.dataset.seat ? null : seatButton.dataset.seat
      );
    });

    seatSubmit.addEventListener("click", () => {
      if (!selectedSeat) return;

      const loadingOverlay = document.querySelector("#airSeatLoading");
      if (!loadingOverlay) {
        console.error("Seat loading overlay not found.");
        return;
      }

      const seatToIssue = selectedSeat;
      seatSubmit.disabled = true;
      loadingOverlay.hidden = false;

      window.setTimeout(() => {
        window.location.href = `./air-10.html?seat=${encodeURIComponent(seatToIssue)}`;
      }, 1200);
    });
  }

  const loadingSpinner = document.querySelector(".air-loading__spinner");
  const loadingSeat = new URLSearchParams(window.location.search).get("seat");

  if (loadingSpinner && loadingSeat && /^\d{2}[A-G]$/.test(loadingSeat)) {
    window.setTimeout(() => {
      window.location.href = `./air-10.html?seat=${encodeURIComponent(loadingSeat)}`;
    }, 1200);
  }

  const boardingPassSeat = document.querySelector("#airPassSeat");
  const boardingSeat = new URLSearchParams(window.location.search).get("seat");

  if (boardingPassSeat && boardingSeat && /^\d{2}[A-G]$/.test(boardingSeat)) {
    boardingPassSeat.textContent = boardingSeat;
  }
});