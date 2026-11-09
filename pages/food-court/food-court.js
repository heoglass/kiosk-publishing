document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('/index-orderlist-payment-step3.html')) {
    window.setTimeout(() => {
      window.location.href = 'index-orderlist-payment-step4.html';
    }, 3000);
  }

  const tabs = document.querySelectorAll('.foodcourt__nav .nav__tab');
  const contents = document.querySelectorAll('.foodcourt__content');
  const swiperInstances = [];

  const currentPageId = document.body.id; // 파일명과 일치하는 body id (예: index-order, index 등)

  // 페이지별 '뒤로 가기' 목적지 매핑 테이블 (현재 파일명 구조에 맞게 설정)
  const backUrlMap = {
    'index-order': 'index.html',
    'index': '/index.html',
    'index-orderlist': 'index-order.html',
  };

  // 상단 뒤로가기 버튼 동작 제어
  const headerBackBtn = document.getElementById('header-back');
  if (headerBackBtn) {
    headerBackBtn.addEventListener('click', () => {
      if (backUrlMap[currentPageId]) {
        window.location.href = backUrlMap[currentPageId];
      } else {
        window.history.back();
      }
    });
  }

  document.querySelectorAll('.btn-dine-in, .btn-takeout').forEach((button) => {
    button.addEventListener('click', () => {
      window.location.href = 'index-orderlist-payment-step1.html';
    });
  });

  document.querySelectorAll('.order__btn--back').forEach((button) => {
    button.addEventListener('click', () => {
      window.location.href = 'index-order.html';
    });
  });

  // 첫화면 이동 버튼 처리 (#foodcourt-start)
  const foodcourtStartBtn = document.getElementById('foodcourt-start');
  if (foodcourtStartBtn) {
    foodcourtStartBtn.addEventListener('click', () => {
      window.location.href = 'index-order.html'; // 주문 화면 파일명으로 이동
    });
  }

  // 1. 각 카테고리 탭 내부 Swiper 독립 초기화
  contents.forEach((content, index) => {
    const swiperEl = content.querySelector('.product-swiper');
    if (swiperEl) {
      const swiper = new Swiper(swiperEl, {
        slidesPerView: 1,
        spaceBetween: 20,
        observer: true,
        observeParents: true,
        pagination: {
          el: content.querySelector('.swiper-pagination'),
          clickable: true,
        },
        navigation: {
          nextEl: content.querySelector('.slider-controls__btn--next'),
          prevEl: content.querySelector('.slider-controls__btn--prev'),
          disabledClass: 'swiper-button-disabled',
        },
      });
      swiperInstances[index] = swiper;
    }
  });

  // 2. 상단 nav 탭 클릭 시 카테고리만 전환
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      // 탭 활성화 상태 변경
      tabs.forEach((t) => t.classList.remove('nav__tab--active'));
      tab.classList.add('nav__tab--active');

      // 컨텐츠 표시 전환
      contents.forEach((c) => c.classList.remove('foodcourt__content--active'));

      if (contents[index]) {
        contents[index].classList.add('foodcourt__content--active');

        // 전환된 탭 내부 슬라이더 첫 페이지로 리셋 및 위치 계산 갱신
        if (swiperInstances[index]) {
          swiperInstances[index].slideTo(0, 0);
          swiperInstances[index].update();
        }
      }
    });
  });

  // ==========================================
  // 3. 장바구니 / 주문 데이터 동적 추가
  // ==========================================
  const STORAGE_KEY = 'kiosk_order_data';

  // 페이지 이동 후에도 주문 데이터를 유지
  let orderData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

  const orderCountEl = document.querySelector('.order-count');
  const orderTotalEl = document.querySelector('.order-total');
  const orderSubmitBtn = document.querySelector('.order-submit.oder__food');
  const cartClearBtn = document.querySelector('.cart-clear');

  // 모달 제어용
  const modal = document.getElementById('option-modal');
  const phoneModal = document.getElementById('modal-points-phone');
  const pointsPrompt = document.getElementById('modal-points-prompt');
  const modalCancelBtn = document.getElementById('modal-cancel');
  const modalConfirmBtn = document.getElementById('modal-confirm');

  if (window.location.pathname.endsWith('/index-orderlist-payment-step2.html')) {
    const cardPaymentModal = document.getElementById('modal-card-payment');
    cardPaymentModal?.querySelector('[data-modal-close]')?.addEventListener('click', () => {
      cardPaymentModal.style.display = 'none';
      document.querySelector('.foodcourt-container')?.classList.remove('foodcourt-dimed');
    });
  }

  if (
    window.location.pathname.endsWith('/index-orderlist-payment-step5.html') ||
    window.location.pathname.endsWith('/index-orderlist-payment-step9.html')
  ) {
    pointsPrompt?.querySelector('[data-modal-close]')?.addEventListener('click', () => {
      pointsPrompt.style.display = 'none';
      document.querySelector('.foodcourt-container')?.classList.remove('foodcourt-dimed');
    });
  }

  const isPhoneEntryStep = window.location.pathname.endsWith('/index-orderlist-payment-step1.html');
  if (isPhoneEntryStep) {
    const phoneInput = document.getElementById('points-phone-number');

    if (phoneInput instanceof HTMLInputElement && modalConfirmBtn instanceof HTMLButtonElement) {
      let phoneDigits = '';
      let isNavigating = false;

      const updatePhoneInput = () => {
        phoneInput.value = phoneDigits;
        modalConfirmBtn.disabled = phoneDigits.length !== 11;
      };

      const goToNextStep = () => {
        if (phoneDigits.length === 11 && !isNavigating) {
          isNavigating = true;
          window.location.href = 'index-orderlist-payment-step2.html';
        }
      };

      phoneInput.addEventListener('input', () => {
        phoneDigits = phoneInput.value.replace(/\D/g, '').slice(0, 11);
        updatePhoneInput();
        goToNextStep();
      });

      document.querySelectorAll('[data-phone-key]').forEach((keyButton) => {
        keyButton.addEventListener('click', () => {
          const key = keyButton.dataset.phoneKey;
          if (key === 'delete') {
            phoneDigits = phoneDigits.slice(0, -1);
          } else if (key && /^\d+$/.test(key)) {
            phoneDigits = `${phoneDigits}${key}`.slice(0, 11);
          }
          updatePhoneInput();
          goToNextStep();
        });
      });

      updatePhoneInput();
    }
  }

  if (phoneModal instanceof HTMLDialogElement) {
    phoneModal.addEventListener('close', () => {
      document.querySelector('.foodcourt-dimed')?.classList.remove('foodcourt-dimed');
    });
  }

  // 화면 갱신 함수
  function updateOrderUI() {
    let totalCount = 0;
    let totalPrice = 0;

    for (const key in orderData) {
      totalCount += orderData[key].count;
      totalPrice += orderData[key].price * orderData[key].count;
    }

    // 총 갯수 및 총 금액 텍스트 반영
    if (orderCountEl) orderCountEl.textContent = `${totalCount}개`;
    if (orderTotalEl) orderTotalEl.textContent = `${totalPrice.toLocaleString()}원`;

    // 데이터가 있으면 활성화, 없으면 비활성화
    if (totalCount > 0) {
      if (orderSubmitBtn) orderSubmitBtn.removeAttribute('disabled');
      if (cartClearBtn) cartClearBtn.removeAttribute('disabled');
    } else {
      if (orderSubmitBtn) orderSubmitBtn.setAttribute('disabled', 'true');
      if (cartClearBtn) cartClearBtn.setAttribute('disabled', 'true');
    }

    // 스토리지 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orderData));
  }

  // 초기 로드 시 UI 동기화
  updateOrderUI();

  // 상품 카드(product-card) 클릭 시 주문 목록에 추가
  const productCards = document.querySelectorAll('.product-card');
  // optionLabels: 옵션 상품 체크를 위한 상수
  const optionLabels = document.querySelectorAll('.option-item');
  const optionRadios = document.querySelectorAll("input[name='food-option']");

  productCards.forEach((card) => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      // dataset 속성이 없을 경우를 대비해 내부 텍스트 요소를 자동 파싱
      const titleEl = card.querySelector('.product-card__title');
      const priceEl = card.querySelector('.product-card__price');

      const name = card.dataset.name || (titleEl ? titleEl.textContent.trim() : '');
      const priceStr = card.dataset.price || (priceEl ? priceEl.textContent.replace(/[^0-9]/g, '') : '0');
      const price = parseInt(priceStr, 10) || 0;

      // hasOption 속성이 없으면 텍스트에 "옵션" 글자가 포함되어 있는지 자동 판별
      let hasOption = card.dataset.hasOption === 'true';
      if (!card.dataset.hasOption && titleEl) {
        hasOption = titleEl.textContent.includes('옵션');
      }

      if (!name) return;

      selectedProduct = { name, price };

      // 1) 옵션이 있는 상품: 모달 노출 및 첫 번째 옵션 기본 세팅
      if (hasOption) {
        optionRadios.forEach((radio) => {
          radio.addEventListener('change', (e) => {
            // 모든 label에서 선택 클래스 제거
            optionLabels.forEach((label) => label.classList.remove('option-item--selected'));

            // 현재 체크된 라디오의 부모 label 찾아서 클래스 부여
            const parentLabel = e.target.closest('.option-item');
            if (parentLabel) {
              parentLabel.classList.add('option-item--selected');
            }
          });
        });

        // 라벨 자체를 클릭했을 때도 확실하게 체크되도록 보조 이벤트 추가 (선택사항이지만 확실함)
        optionLabels.forEach((label) => {
          label.addEventListener('click', () => {
            const radio = label.querySelector("input[name='food-option']");
            if (radio && !radio.checked) {
              radio.checked = true;
              // change 이벤트를 강제로 발생시켜 위쪽 change 리스너가 실행되도록 유도
              radio.dispatchEvent(new Event('change'));
            }
          });
        });

        if (modal) modal.style.display = 'flex';

        modalCancelBtn.addEventListener('click', () => {
          console.log('취소.,');
          if (selectedProduct) {
            for (const key in orderData) {
              if (orderData[key].name === selectedProduct.name) {
                delete orderData[key];
              }
            }
            updateOrderUI();
          }

          if (modal) modal.style.display = 'none';
          selectedProduct = null;
        });

        // [선택 완료 버튼] 선택한 옵션 정보와 함께 장바구니 및 스토리지 저장
        if (modalConfirmBtn) {
          modalConfirmBtn.addEventListener('click', () => {
            if (!selectedProduct) return;

            const checkedRadio = document.querySelector("input[name='food-option']:checked");
            const optionValue = checkedRadio ? checkedRadio.value : '옵션 선택 안함';

            let cartKey = selectedProduct.name;
            if (optionValue && optionValue !== '옵션 선택 안함') {
              cartKey = `${selectedProduct.name} (${optionValue})`;
            }

            if (orderData[cartKey]) {
              orderData[cartKey].count += 1;
            } else {
              orderData[cartKey] = {
                name: selectedProduct.name,
                option: optionValue,
                price: selectedProduct.price,
                count: 1,
              };
            }

            updateOrderUI();

            if (modal) modal.style.display = 'none';
            selectedProduct = null;
          });
        }
      }
      // 2) 일반 상품: 곧바로 장바구니에 담기
      else {
        const cartKey = name;

        if (orderData[cartKey]) {
          orderData[cartKey].count += 1;
        } else {
          orderData[cartKey] = {
            name: name,
            option: '일반',
            price: price,
            count: 1,
          };
        }

        updateOrderUI();
        selectedProduct = null;
      }
    });
  });

  // [취소 버튼] 모달 닫기
  if (modalCancelBtn) {
    modalCancelBtn.addEventListener('click', () => {
      if (modal) {
        modal.style.display = 'none';
      }
      if (phoneModal) {
        phoneModal.style.display = 'none';
        document.querySelector('.foodcourt-dimed')?.classList.remove('foodcourt-dimed');
      }
      selectedProduct = null;
    });
  }

  if (modalConfirmBtn && phoneModal) {
    modalConfirmBtn.addEventListener('click', () => {
      if (isPhoneEntryStep) {
        const phoneInput = document.getElementById('points-phone-number');
        if (!(phoneInput instanceof HTMLInputElement) || phoneInput.value.length !== 11) return;
      }
      window.location.href = 'index-orderlist-payment-step2.html';
    });
  }

  document.querySelector('[data-card-inserted]')?.addEventListener('click', () => {
    window.location.href = 'index-orderlist-payment-step3.html';
  });

  if (window.location.pathname.endsWith('/index-orderlist-payment-step4.html')) {
    document.getElementById('modal-card-loading')?.addEventListener('click', () => {
      window.location.href = 'index-orderlist-payment-step5.html';
    });
  }

  if (window.location.pathname.endsWith('/index-orderlist-payment-step6.html')) {
    const phoneInput = document.getElementById('points-phone-number');
    const savePointsButton = document.querySelector('.points-skip');

    if (phoneInput instanceof HTMLInputElement && savePointsButton instanceof HTMLButtonElement) {
      let phoneDigits = phoneInput.value.replace(/\D/g, '').slice(0, 11);
      let isNavigating = false;

      const updatePhoneInput = () => {
        phoneInput.value = phoneDigits;
        savePointsButton.disabled = false;
      };

      const goToNextStep = () => {
        if (phoneDigits.length === 11 && !isNavigating) {
          isNavigating = true;
          sessionStorage.setItem('foodCourtPointsPhoneNumber', phoneDigits);
          window.location.href = 'index-orderlist-payment-step7.html';
        }
      };

      phoneInput.addEventListener('input', () => {
        phoneDigits = phoneInput.value.replace(/\D/g, '').slice(0, 11);
        updatePhoneInput();
        goToNextStep();
      });

      document.querySelectorAll('[data-phone-key]').forEach((keyButton) => {
        keyButton.addEventListener('click', () => {
          const key = keyButton.dataset.phoneKey;
          if (key === 'delete') {
            phoneDigits = phoneDigits.slice(0, -1);
          } else if (key && /^\d+$/.test(key)) {
            phoneDigits = `${phoneDigits}${key}`.slice(0, 11);
          }
          updatePhoneInput();
          goToNextStep();
        });
      });

      savePointsButton.addEventListener('click', () => {
        if (phoneDigits) {
          sessionStorage.setItem('foodCourtPointsPhoneNumber', phoneDigits);
        } else {
          sessionStorage.removeItem('foodCourtPointsPhoneNumber');
        }
        window.location.href = 'index-orderlist-payment-step7.html';
      });

      updatePhoneInput();
    }
  }

  if (window.location.pathname.endsWith('/index-orderlist-payment-step7.html')) {
    const phoneInput = document.getElementById('points-phone-number');
    const savedPhoneNumber = sessionStorage.getItem('foodCourtPointsPhoneNumber') || '';

    if (phoneInput instanceof HTMLInputElement) {
      let phoneDigits = savedPhoneNumber.replace(/\D/g, '').slice(0, 11);
      let isNavigating = false;

      const updatePhoneInput = () => {
        phoneInput.value = phoneDigits;
      };

      const goToNextStep = () => {
        if (phoneDigits.length === 11 && !isNavigating) {
          isNavigating = true;
          sessionStorage.setItem('foodCourtPointsPhoneNumber', phoneDigits);
          window.location.href = 'index-orderlist-payment-step8.html';
        }
      };

      phoneInput.addEventListener('input', () => {
        phoneDigits = phoneInput.value.replace(/\D/g, '').slice(0, 11);
        updatePhoneInput();
        goToNextStep();
      });

      document.querySelectorAll('[data-phone-key]').forEach((keyButton) => {
        keyButton.addEventListener('click', () => {
          const key = keyButton.dataset.phoneKey;
          if (key === 'delete') {
            phoneDigits = phoneDigits.slice(0, -1);
          } else if (key && /^\d+$/.test(key)) {
            phoneDigits = `${phoneDigits}${key}`.slice(0, 11);
          }
          updatePhoneInput();
          goToNextStep();
        });
      });

      updatePhoneInput();
      goToNextStep();
    }

    document.querySelector('.points-skip')?.addEventListener('click', () => {
      window.location.href = 'index-orderlist-payment-step8.html';
    });
  }

  const pointsNoBtn = pointsPrompt?.querySelector('.points-no');
  const pointsYesBtn = pointsPrompt?.querySelector('.points-yes');

  if (pointsYesBtn || pointsNoBtn) {
    pointsYesBtn.addEventListener('click', (event) => {
      event.preventDefault();
      const nextPage = pointsYesBtn.dataset.nextPage || 'index-orderlist-payment-step6.html';
      const nextUrl = new URL(nextPage, window.location.href);

      if (
        window.location.pathname.endsWith('/index-orderlist-payment-step9.html') &&
        nextUrl.pathname.endsWith('/shared/order-complete.html')
      ) {
        nextUrl.searchParams.set('orderImage', 'red');
      }

      window.location.href = nextUrl.href;
    });

    pointsNoBtn.addEventListener('click', (event) => {
      event.preventDefault();
      const nextPage = pointsNoBtn.dataset.nextPage || pointsYesBtn.dataset.nextPage || 'index-orderlist-payment-step6.html';
      const nextUrl = new URL(nextPage, window.location.href);

      if (
        window.location.pathname.endsWith('/index-orderlist-payment-step9.html') &&
        nextUrl.pathname.endsWith('/shared/order-complete.html')
      ) {
        nextUrl.searchParams.set('orderImage', 'red');
      }

      window.location.href = nextUrl.href;
    });
  }

  document.querySelectorAll('.points-confirm').forEach((button) => {
    button.addEventListener('click', () => {
      window.location.href = 'index-orderlist-payment-step9.html';
    });
  });

  // 전체 취소(전체삭제) 버튼 클릭 시 객체 삭제 및 초기화
  if (cartClearBtn) {
    cartClearBtn.addEventListener('click', () => {
      orderData = {};
      localStorage.removeItem(STORAGE_KEY);
      updateOrderUI();
    });
  }

  // 주문하기 버튼 클릭 시 주문 목록으로 이동
  if (orderSubmitBtn) {
    orderSubmitBtn.addEventListener('click', () => {
      if (orderSubmitBtn.hasAttribute('disabled')) return;
      window.location.href = 'index-orderlist.html';
    });
  }
});
