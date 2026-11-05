document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".foodcourt__nav .nav__tab");
    const contents = document.querySelectorAll(".foodcourt__content");
    const swiperInstances = [];

    // 1. 각 카테고리 탭 내부 Swiper 독립 초기화
    contents.forEach((content, index) => {
        const swiperEl = content.querySelector(".product-swiper");
        if (swiperEl) {
            const swiper = new Swiper(swiperEl, {
                slidesPerView: 1,
                spaceBetween: 20,
                observer: true,
                observeParents: true,
                pagination: {
                    el: content.querySelector(".swiper-pagination"),
                    clickable: true,
                },
                navigation: {
                    nextEl: content.querySelector(".slider-controls__btn--next"),
                    prevEl: content.querySelector(".slider-controls__btn--prev"),
                    disabledClass: 'swiper-button-disabled',
                },
            });
            swiperInstances[index] = swiper;
        }
    });

    // 2. 상단 nav 탭 클릭 시 카테고리만 전환
    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => {
            // 탭 활성화 상태 변경
            tabs.forEach((t) => t.classList.remove("nav__tab--active"));
            tab.classList.add("nav__tab--active");

            // 컨텐츠 표시 전환
            contents.forEach((c) => c.classList.remove("foodcourt__content--active"));

            if (contents[index]) {
                contents[index].classList.add("foodcourt__content--active");

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
    const STORAGE_KEY = "kiosk_order_data";

    // 페이지 이동 시에도 유지되도록 sessionStorage 활용 (객체 형태로 보관)
    let orderData = JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};

    const orderCountEl = document.querySelector(".order-count");
    const orderTotalEl = document.querySelector(".order-total");
    const orderSubmitBtn = document.querySelector(".order-submit.oder__food");
    const cartClearBtn = document.querySelector(".cart-clear");

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
            if (orderSubmitBtn) orderSubmitBtn.removeAttribute("disabled");
            if (cartClearBtn) cartClearBtn.removeAttribute("disabled");
        } else {
            if (orderSubmitBtn) orderSubmitBtn.setAttribute("disabled", "true");
            if (cartClearBtn) cartClearBtn.setAttribute("disabled", "true");
        }

        // 스토리지 저장
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(orderData));
    }

    // 초기 로드 시 UI 동기화
    updateOrderUI();

    // 상품 카드(product-card) 클릭 시 주문 목록에 추가
    const productCards = document.querySelectorAll(".product-card");
    productCards.forEach((card) => {
        card.style.cursor = "pointer"; // 클릭 가능하도록 커서 지정
        card.addEventListener("click", () => {
            const titleEl = card.querySelector(".product-card__title");
            const priceEl = card.querySelector(".product-card__price");

            if (!titleEl || !priceEl) return;

            const name = titleEl.textContent.trim();
            // "10,000원" -> 숫자 10000으로 파싱
            const price = parseInt(priceEl.textContent.replace(/[^0-9]/g, ""), 10) || 0;

            if (orderData[name]) {
                orderData[name].count += 1;
            } else {
                orderData[name] = {
                    name: name,
                    price: price,
                    count: 1
                };
            }

            updateOrderUI();
        });
    });

    // 전체 취소(전체삭제) 버튼 클릭 시 객체 삭제 및 초기화
    if (cartClearBtn) {
        cartClearBtn.addEventListener("click", () => {
            orderData = {};
            sessionStorage.removeItem(STORAGE_KEY);
            updateOrderUI();
        });
    }

    // 주문하기 버튼 클릭 시 이벤트 (필요 시 연동)
    if (orderSubmitBtn) {
        orderSubmitBtn.addEventListener("click", () => {
            if (orderSubmitBtn.hasAttribute("disabled")) return;
            alert("주문이 완료되었습니다!");
            // 주문 완료 후 초기화가 필요하다면 아래 주석 해제
            // orderData = {};
            // sessionStorage.removeItem(STORAGE_KEY);
            // updateOrderUI();
        });
    }
});










