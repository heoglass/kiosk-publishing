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
});