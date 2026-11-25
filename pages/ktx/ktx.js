// 모든 예매 데이터는 프론트단에서 임시로 구현하기 위해 sessionStorage에 JSON 형태로 저장하여 화면에 뿌립니다. 
// 프론트단에선 sessionStorage, ktxBooking 데이터를 사용하여 예매 정보를 화면에 렌더링합니다.
//

document.addEventListener('DOMContentLoaded', function () {
  var pageType = document.body.getAttribute('page-type');
    if (pageType !== 'ktx-03' && pageType !== 'ktx-04' && pageType !== 'ktx-05' && pageType !== 'ktx-06') ktxModalMsg('기차/KTX');
    if (pageType === 'ktx-02' || pageType === 'ktx-03' || pageType === 'ktx-04' || pageType === 'ktx-05' || pageType === 'ktx-06') {
      initKtxBookingForm();
    }
    if (pageType === 'ktx-03') initKtxPersonModal();
    if (pageType === 'ktx-04') initKtxSeatModal();
    if (pageType === 'ktx-05') initKtxDateModal();
    if (pageType === 'ktx-06') initKtxStationModal();
    if (pageType === 'ktx-07') initKtxTrainList();
    if (pageType === 'ktx-11') initKtxSeatMap();
    if (pageType === 'ktx-12') initKtxReserveConfirm();
    if (pageType === 'kpay-01') initKtxPayMethod();
    if (pageType === 'ktxRe-03') initKtxRefundTicketNo();
    if (pageType === 'ktxRe-04') initKtxRefundInfo();
});


// 전역에서 사용할 예매정보 모음
var KTX_BOOKING_STORAGE_KEY = 'ktxBooking';
var KTX_MAX_PASSENGERS = 9;
// var KTX_SEAT_STORAGE_KEY = 'seatTypeCurrent';

function getKtxBooking() {
    var saved = sessionStorage.getItem(KTX_BOOKING_STORAGE_KEY);
    if (saved === null) {
      return {
        tripType: 'one-way',
        departure: '',
        arrival: '',
        departureDate: '',
        departureTime: '',
        passengers: {},
        seatTypeCurrent: '',
      };
    }

    var booking;
    try {
      booking = JSON.parse(saved);
    } catch (error) {
      throw new Error('저장된 KTX 예매 정보를 읽을 수 없습니다: ' + error.message);
    }
    if (!booking || typeof booking !== 'object' || Array.isArray(booking)) {
      throw new Error('저장된 KTX 예매 정보의 형식이 올바르지 않습니다.');
    }
    return booking;
}

function updateKtxBooking(changes) {
    if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
      throw new TypeError('예매 옵션은 객체로 전달해야 합니다.');
    }
    var booking = Object.assign({}, getKtxBooking(), changes);
    sessionStorage.setItem(KTX_BOOKING_STORAGE_KEY, JSON.stringify(booking));
    return booking;
}

function parseKtxDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    var date = new Date(value + 'T00:00:00');
    if (isNaN(date.getTime()) || date.getFullYear() !== Number(value.slice(0, 4)) ||
        date.getMonth() + 1 !== Number(value.slice(5, 7)) ||
        date.getDate() !== Number(value.slice(8, 10))) return null;
    return date;
}

function isFutureKtxDeparture(dateValue, timeValue, now) {
    var date = parseKtxDate(dateValue);
    if (!date || typeof timeValue !== 'string' || !/^(?:[01]\d|2[0-3]):00$/.test(timeValue)) return false;
    var hour = Number(timeValue.slice(0, 2));
    date.setHours(hour, 0, 0, 0);
    return date.getHours() === hour && date.getTime() > now.getTime();
}

function formatKtxDate(dateValue) {
    var date = parseKtxDate(dateValue);
    return dateValue + ' (' + ['일', '월', '화', '수', '목', '금', '토'][date.getDay()] + ')';
}

function ktxPassengerTotal(passengers) {
    if (!passengers || typeof passengers !== 'object' || Array.isArray(passengers)) return 0;
    var counts = Object.values(passengers);
    if (!counts.length || counts.some(function (count) {
      return !Number.isInteger(count) || count < 0;
    })) return 0;
    return counts.reduce(function (total, count) { return total + count; }, 0);
}

function initKtxBookingForm() {
    var form = document.getElementById('ktxMainForm');
    var routeRows = form.querySelectorAll('.ktx-route__row');
    var tripButtons = form.querySelectorAll('.ktx-trip__btn');
    var dateButton = document.getElementById('ktxDate');
    var personButton = document.getElementById('ktxSelectPerson');
    var seatButton = document.getElementById('ktxSelectSeat');
    var submitButton = document.getElementById('ktxSubmit');
    submitButton.disabled = true;
    if (sessionStorage.getItem(KTX_BOOKING_STORAGE_KEY) === null) {
      updateKtxBooking({});
    }

    function render() {
      submitButton.disabled = true;
      submitButton.classList.remove('active');
      var booking = getKtxBooking();
      var total = ktxPassengerTotal(booking.passengers);
      var hasDeparture = typeof booking.departure === 'string' && booking.departure.trim() !== '';
      var hasArrival = typeof booking.arrival === 'string' && booking.arrival.trim() !== '';
      // [변경] booking.seat → booking.seatTypeCurrent
      var hasSeat = typeof booking.seatTypeCurrent === 'string' && booking.seatTypeCurrent.trim() !== '';
      var valid = hasDeparture && hasArrival && booking.departure.trim() !== booking.arrival.trim() &&
        isFutureKtxDeparture(booking.departureDate, booking.departureTime, new Date()) &&
        total > 0 && total <= KTX_MAX_PASSENGERS && hasSeat;

      routeRows[0].querySelector('.ktx-route__value').textContent = hasDeparture ? booking.departure : '선택';
      routeRows[1].querySelector('.ktx-route__value').textContent = hasArrival ? booking.arrival : '선택';
      dateButton.querySelector('.ktx-date__value').textContent = parseKtxDate(booking.departureDate)
        ? formatKtxDate(booking.departureDate) + (booking.departureTime ? ' ' + booking.departureTime : '')
        : '선택';
      personButton.querySelector('span').textContent = total > 0 ? '총 ' + total + '명' : '인원';
      // [변경] booking.seat → booking.seatTypeCurrent
      seatButton.querySelector('span').textContent = hasSeat ? booking.seatTypeCurrent : '좌석';
      tripButtons.forEach(function (button, index) {
        var active = booking.tripType === (index === 0 ? 'one-way' : 'round-trip');
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', String(active));
      });
      submitButton.disabled = !valid;
      submitButton.classList.toggle('active', valid);
    }


    tripButtons.forEach(function (button, index) {
      button.addEventListener('click', function () {
        updateKtxBooking({ tripType: index === 0 ? 'one-way' : 'round-trip' });
        render();
      });
    });

    routeRows.forEach(function (button, index) {
      button.addEventListener('click', function () {
        window.location.href = './ktx-06.html?select=' + (index === 0 ? 'departure' : 'arrival');
      });
    });
    form.querySelector('.ktx-route__swap').addEventListener('click', function () {
      var booking = getKtxBooking();
      updateKtxBooking({ departure: booking.arrival, arrival: booking.departure });
      render();
    });
    dateButton.addEventListener('click', function () { window.location.href = './ktx-05.html'; });
    personButton.addEventListener('click', function () { window.location.href = './ktx-03.html'; });
    seatButton.addEventListener('click', function () { window.location.href = './ktx-04.html'; });
    submitButton.addEventListener('click', function () {
      render();
      if (!submitButton.disabled) window.location.href = './ktx-07.html';
    });
    window.addEventListener('pageshow', render);
    render();
}

function initKtxPersonModal() {
    var saved = getKtxBooking().passengers;
    var rows = document.querySelectorAll('.ktx-person__row');
    var confirmButton = document.getElementById('ktxPersonConfirm');
    var passengers = {};

    rows.forEach(function (row) {
      passengers[row.getAttribute('data-passenger')] = 0;
    });
    if (saved === undefined) saved = {};
    if (!saved || typeof saved !== 'object' || Array.isArray(saved) ||
        Object.keys(saved).some(function (key) {
          return !Object.prototype.hasOwnProperty.call(passengers, key) ||
            !Number.isInteger(saved[key]) || saved[key] < 0;
        }) || ktxPassengerTotal(saved) > KTX_MAX_PASSENGERS) {
      rows.forEach(function (row) { row.querySelector('output').textContent = '–'; });
      console.error('저장된 인원 정보가 올바르지 않습니다.');
      return;
    }
    if (Object.keys(saved).length) {
      Object.assign(passengers, saved);
    } else {
      passengers.adult = 1;
    }

    function render() {
      var total = ktxPassengerTotal(passengers);
      rows.forEach(function (row) {
        var count = passengers[row.getAttribute('data-passenger')];
        row.querySelector('output').textContent = count;
        row.querySelector('[data-action="minus"]').disabled = count === 0;
        row.querySelector('[data-action="plus"]').disabled = total >= KTX_MAX_PASSENGERS;
      });
      confirmButton.disabled = total === 0;
    }

    rows.forEach(function (row) {
      var key = row.getAttribute('data-passenger');
      row.querySelector('[data-action="minus"]').addEventListener('click', function () {
        if (passengers[key] > 0) passengers[key] -= 1;
        render();
      });
      row.querySelector('[data-action="plus"]').addEventListener('click', function () {
        if (ktxPassengerTotal(passengers) < KTX_MAX_PASSENGERS) passengers[key] += 1;
        render();
      });
    });
    confirmButton.addEventListener('click', function () {
      var total = ktxPassengerTotal(passengers);
      if (total < 1 || total > KTX_MAX_PASSENGERS) return;
      updateKtxBooking({ passengers: passengers });
      window.location.href = './ktx-02.html';
    });
    render();
}

function initKtxDateModal() {
    var booking = getKtxBooking();
    var nextHour = new Date();
    nextHour.setMinutes(0, 0, 0);
    nextHour.setHours(nextHour.getHours() + 1);

    function dateValue(date) {
      return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');
    }

    function timeValue(hour) {
      return String(hour).padStart(2, '0') + ':00';
    }

    var savedIsFuture = isFutureKtxDeparture(booking.departureDate, booking.departureTime, new Date());
    var selectedDate = savedIsFuture ? booking.departureDate : dateValue(nextHour);
    var selectedTime = savedIsFuture ? booking.departureTime : timeValue(nextHour.getHours());
    var selectedDateObject = parseKtxDate(selectedDate);
    var shownMonth = new Date(selectedDateObject.getFullYear(), selectedDateObject.getMonth(), 1);
    var selectionLabel = document.getElementById('ktxDateSelection');
    var monthLabel = document.getElementById('ktxDateMonth');
    var days = document.getElementById('ktxDateDays');
    var hours = document.getElementById('ktxDateHours');
    var prevButton = document.getElementById('ktxDatePrev');
    var nextButton = document.getElementById('ktxDateNext');
    var confirmButton = document.getElementById('ktxDateConfirm');
    var status = document.getElementById('ktxDateStatus');

    function render() {
      var now = new Date();
      var currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      var firstWeekday = shownMonth.getDay();
      var daysInMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth() + 1, 0).getDate();
      selectionLabel.textContent = formatKtxDate(selectedDate) + ' ' + selectedTime;
      monthLabel.textContent = shownMonth.getFullYear() + '년 ' + (shownMonth.getMonth() + 1) + '월';
      prevButton.disabled = shownMonth <= currentMonth;
      days.replaceChildren();
      for (var empty = 0; empty < firstWeekday; empty += 1) {
        days.appendChild(document.createElement('span'));
      }
      for (var day = 1; day <= daysInMonth; day += 1) {
        var date = new Date(shownMonth.getFullYear(), shownMonth.getMonth(), day);
        var value = dateValue(date);
        var dayButton = document.createElement('button');
        dayButton.type = 'button';
        dayButton.textContent = day;
        dayButton.dataset.date = value;
        dayButton.setAttribute('aria-label', shownMonth.getFullYear() + '년 ' + (shownMonth.getMonth() + 1) + '월 ' + day + '일');
        dayButton.setAttribute('aria-pressed', String(value === selectedDate));
        dayButton.classList.toggle('is-selected', value === selectedDate);
        dayButton.disabled = !isFutureKtxDeparture(value, '23:00', now);
        dayButton.addEventListener('click', function () {
          selectedDate = this.dataset.date;
          status.textContent = '';
          if (!isFutureKtxDeparture(selectedDate, selectedTime, new Date())) {
            for (var hour = 0; hour < 24; hour += 1) {
              if (isFutureKtxDeparture(selectedDate, timeValue(hour), new Date())) {
                selectedTime = timeValue(hour);
                break;
              }
            }
          }
          render();
          days.querySelector('[data-date="' + selectedDate + '"]').focus();
          scrollToSelectedHour();
        });
        days.appendChild(dayButton);
      }
      hours.replaceChildren();
      for (var hour = 0; hour < 24; hour += 1) {
        var hourButton = document.createElement('button');
        var time = timeValue(hour);
        hourButton.type = 'button';
        hourButton.textContent = hour + '시';
        hourButton.dataset.time = time;
        hourButton.setAttribute('aria-pressed', String(time === selectedTime));
        hourButton.classList.toggle('is-selected', time === selectedTime);
        hourButton.disabled = !isFutureKtxDeparture(selectedDate, time, now);
        hourButton.addEventListener('click', function () {
          selectedTime = this.dataset.time;
          status.textContent = '';
          render();
          hours.querySelector('[data-time="' + selectedTime + '"]').focus();
          scrollToSelectedHour();
        });
        hours.appendChild(hourButton);
      }
      confirmButton.disabled = !isFutureKtxDeparture(selectedDate, selectedTime, now);
    }

    function scrollToSelectedHour() {
      var selected = hours.querySelector('[data-time="' + selectedTime + '"]');
      hours.scrollLeft += selected.getBoundingClientRect().left - hours.getBoundingClientRect().left -
        (hours.clientWidth - selected.clientWidth) / 2;
    }

    var mouseDrag = null;
    var dragged = false;
    hours.addEventListener('pointerdown', function (event) {
      dragged = false;
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      mouseDrag = { pointerId: event.pointerId, startX: event.clientX, scrollLeft: hours.scrollLeft };
    });
    window.addEventListener('pointermove', function (event) {
      if (!mouseDrag || event.pointerId !== mouseDrag.pointerId) return;
      var distance = event.clientX - mouseDrag.startX;
      if (!dragged && Math.abs(distance) > 6) {
        dragged = true;
        hours.classList.add('is-dragging');
        hours.setPointerCapture(event.pointerId);
      }
      if (dragged) {
        hours.scrollLeft = mouseDrag.scrollLeft - distance;
        event.preventDefault();
      }
    });
    window.addEventListener('pointerup', function (event) {
      if (!mouseDrag || event.pointerId !== mouseDrag.pointerId) return;
      mouseDrag = null;
      hours.classList.remove('is-dragging');
    });
    window.addEventListener('pointercancel', function (event) {
      if (!mouseDrag || event.pointerId !== mouseDrag.pointerId) return;
      mouseDrag = null;
      dragged = false;
      hours.classList.remove('is-dragging');
    });
    hours.addEventListener('click', function (event) {
      if (!dragged || event.detail === 0) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      dragged = false;
    }, true);

    prevButton.addEventListener('click', function () {
      shownMonth.setMonth(shownMonth.getMonth() - 1);
      render();
    });
    nextButton.addEventListener('click', function () {
      shownMonth.setMonth(shownMonth.getMonth() + 1);
      render();
    });
    confirmButton.addEventListener('click', function () {
      if (!isFutureKtxDeparture(selectedDate, selectedTime, new Date())) {
        status.textContent = '현재 시각 이후의 날짜와 시간을 선택해주세요.';
        render();
        return;
      }
      updateKtxBooking({ departureDate: selectedDate, departureTime: selectedTime });
      window.location.href = './ktx-02.html';
    });
    render();
    scrollToSelectedHour();
}

function initKtxStationModal() {
    var booking = getKtxBooking();
    var selection = { departure: booking.departure || '', arrival: booking.arrival || '' };
    var requestedField = new URLSearchParams(window.location.search).get('select');
    var activeField = requestedField === 'arrival' ? 'arrival' : 'departure';
    var activeList = 'majorStations';
    var page = 0;
    var pageSize = 15;
    var stations = {
      majorStations: [
        '서울', '용산', '광명', '수서', '영등포', '수원', '평택', '천안아산', '천안',
        '오송', '조치원', '대전', '서대전', '김천구미', '구미', '동대구', '부산'
      ],
      ktxStations: [
        '강릉', '광주송정', '대전', '동대구', '목포', '부산', '서울',
        '순천', '오송', '여수엑스포', '익산', '전주', '청량리'
      ]
    };
    var modal = document.getElementById('ktxModal');
    var routeButtons = modal.querySelectorAll('[data-station-field]');
    var filterButtons = modal.querySelectorAll('[data-station-list]');
    var searchLabel = modal.querySelector('.ktx-station__search');
    var searchInput = document.getElementById('ktxStationSearch');
    var list = document.getElementById('ktxStationList');
    var status = document.getElementById('ktxStationStatus');
    var pageLabel = document.getElementById('ktxStationPage');
    var prevButton = document.getElementById('ktxStationPrev');
    var nextButton = document.getElementById('ktxStationNext');
    var confirmButton = document.getElementById('ktxStationConfirm');

    function render() {
      routeButtons.forEach(function (button) {
        var field = button.getAttribute('data-station-field');
        button.querySelector('strong').textContent = selection[field] || '선택';
        button.classList.toggle('is-active', field === activeField);
        button.setAttribute('aria-pressed', String(field === activeField));
      });
      filterButtons.forEach(function (button) {
        var active = button.getAttribute('data-station-list') === activeList;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      searchLabel.hidden = activeList !== 'search';

      var names = activeList === 'search'
        ? Array.from(new Set(stations.majorStations.concat(stations.ktxStations))).filter(function (name) {
            return name.includes(searchInput.value.trim());
          })
        : stations[activeList];
      var pageCount = Math.ceil(names.length / pageSize);
      page = Math.min(page, Math.max(0, pageCount - 1));
      list.replaceChildren();
      names.slice(page * pageSize, (page + 1) * pageSize).forEach(function (name) {
        var button = document.createElement('button');
        button.type = 'button';
        button.textContent = name;
        button.className = 'ktx-station__item';
        button.classList.toggle('is-selected', selection[activeField] === name);
        button.setAttribute('aria-pressed', String(selection[activeField] === name));
        button.addEventListener('click', function () {
          selection[activeField] = name;
          if (activeField === 'departure') activeField = 'arrival';
          render();
        });
        list.appendChild(button);
      });
      pageLabel.textContent = pageCount ? (page + 1) + '/' + pageCount : '0/0';
      prevButton.disabled = page === 0;
      nextButton.disabled = page + 1 >= pageCount;
      var sameStation = selection.departure && selection.departure === selection.arrival;
      confirmButton.disabled = (!selection.departure && !selection.arrival) || Boolean(sameStation);
      status.textContent = sameStation ? '출발역과 도착역을 다르게 선택해주세요.' :
        (names.length ? '' : '검색 결과가 없습니다.');
    }

    routeButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        activeField = button.getAttribute('data-station-field');
        render();
      });
    });
    filterButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        activeList = button.getAttribute('data-station-list');
        page = 0;
        render();
        if (activeList === 'search') searchInput.focus();
      });
    });
    searchInput.addEventListener('input', function () { page = 0; render(); });
    prevButton.addEventListener('click', function () { page -= 1; render(); });
    nextButton.addEventListener('click', function () { page += 1; render(); });
    modal.querySelector('.ktx-station__swap').addEventListener('click', function () {
      var departure = selection.departure;
      selection.departure = selection.arrival;
      selection.arrival = departure;
      render();
    });
    confirmButton.addEventListener('click', function () {
      if (confirmButton.disabled) return;
      updateKtxBooking(selection);
      window.location.href = './ktx-02.html';
    });

    render();
    routeButtons[activeField === 'departure' ? 0 : 1].focus();
}

function ktxModalMsg(msg) {
    var modal = document.getElementById('ktxModal');
    var titleEl = document.getElementById('ktxModalTitle');
    var countEl = document.getElementById('ktxModalCount');
    var confirmBtn = document.getElementById('ktxModalConfirm');
    if (!modal || !titleEl || !countEl || !confirmBtn) return;

    // page-type이 ktxRe-01(환불 안내)일 때만 안내모달 표시
    if (document.body.getAttribute('page-type') === 'ktxRe-01') {
      titleEl.textContent = msg;
      countEl.textContent = 30;
      modal.classList.remove('d-none');

      var remain = 30;
      var timer = setInterval(function () {
        remain -= 1;
        countEl.textContent = remain;
        if (remain <= 0) closeModal();
      }, 1000);

      // [신규] 모달 닫기 + 뒤 화면 inert 해제 (버튼 클릭 가능하게)
      function closeModal() {
        clearInterval(timer);
        modal.classList.add('d-none');
        document.querySelectorAll('#category-header, #ktx-start-screen').forEach(function (el) {
          el.removeAttribute('inert');
        });
      }

      confirmBtn.addEventListener('click', function () {
        clearInterval(timer);
        window.location.href = './ktxRe-02.html';
      });

      // [신규] 뒤로가기(bfcache)로 돌아오면 새로고침해서 모달/타이머를 처음 상태로 초기화
      window.addEventListener('pageshow', function (event) {
        if (event.persisted) window.location.reload();
      });
    } else {
      modal.classList.add('d-none');
    }
}

// [신규] ktx-04 좌석 선택 유형 모달 (initKtxPersonModal 아래에 추가)
function initKtxSeatModal() {
    var items = document.querySelectorAll('.ktx-seat__item');
    var confirmButton = document.getElementById('ktxSeatConfirm');
    var selected = getKtxBooking().seatTypeCurrent || '';   // 저장된 좌석이 있으면 미리 선택

    function render() {
      items.forEach(function (item) {
        var on = item.getAttribute('data-seat') === selected;
        item.classList.toggle('active', on);                 // 선택된 버튼에 active
        item.setAttribute('aria-pressed', String(on));
      });
      confirmButton.disabled = selected === '';              // 선택해야 확인 버튼 활성화
    }

    items.forEach(function (item) {
      item.addEventListener('click', function () {
        selected = item.getAttribute('data-seat');
        render();
      });
    });
    confirmButton.addEventListener('click', function () {
      if (!selected) return;
      updateKtxBooking({ seatTypeCurrent: selected });       // ktxBooking JSON에 저장
      window.location.href = './ktx-02.html';
    });
    render();
}


function initKtxTrainList() {
    var classButtons = document.querySelectorAll('.ktx-train-card__class');
    var submitButton = document.getElementById('ktxTrainSubmit');
    var selected = null;

    function render() {
      classButtons.forEach(function (button) {
        var on = button === selected;
        button.classList.toggle('active', on);
        button.setAttribute('aria-pressed', String(on));
      });
      submitButton.disabled = !selected;                     // 열차(좌석등급) 선택해야 활성화
      submitButton.classList.toggle('active', Boolean(selected));
    }

    classButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        selected = selected === button ? null : button;      // 다시 누르면 해제
        render();
      });
    });

    submitButton.addEventListener('click', function () {
      if (!selected) return;
      var trainCard = selected.closest('.ktx-train-card');
      var trainTimes = trainCard.querySelector('.ktx-train-card__time').textContent.trim().match(/^(\d{2}:\d{2})\s*→\s*(\d{2}:\d{2})$/);
      if (!trainTimes) throw new Error('선택한 열차의 출발 및 도착 시간을 읽을 수 없습니다.');
      updateKtxBooking({
        selectedTrain: {
          trainId: trainCard.getAttribute('data-train-id'),
          seatClass: selected.getAttribute('data-seat-class'),
          departureTime: trainTimes[1],
          arrivalTime: trainTimes[2]
        }
      });
      window.location.href = './ktx-08.html';                // 열차정보 (가정)
    });
    render();
}

// ktx-11 시트선택 화면
function initKtxSeatMap() {
    var seats = document.querySelectorAll('.ktx-seatmap__seat');
    var doneButton = document.getElementById('ktxSeatDone');
    var carLabel = document.getElementById('ktxCarNumber');
    var booking = getKtxBooking();
    var max = ktxPassengerTotal(booking.passengers) || 1;   // 예매 인원 수 = 선택해야 하는 좌석 수
    var selected = Array.isArray(booking.selectedSeats) ? booking.selectedSeats.slice(0, max) : [];

    function render() {
      seats.forEach(function (seat) {
        var on = selected.indexOf(seat.getAttribute('data-seat')) > -1;
        seat.classList.toggle('active', on);
        seat.setAttribute('aria-pressed', String(on));
      });
      var complete = selected.length === max;
      doneButton.textContent = selected.length + '/' + max + '석 선택완료';
      doneButton.disabled = !complete;
      doneButton.classList.toggle('active', complete);
    }

    // [신규] 선택 좌석을 sessionStorage(ktxBooking.selectedSeats)에 저장 -> 추후 승차권 표시용
    function readCarNumber() {
      var car = carLabel.getAttribute('data-car');
      if (!/^[1-9]\d*$/.test(car || '')) throw new Error('호차 정보를 읽을 수 없습니다.');
      carLabel.textContent = car + '호차';
      return car;
    }

    function saveSeats() {
      updateKtxBooking({
        selectedSeats: selected,
        selectedCar: readCarNumber()
      });
    }

    readCarNumber();
    seats.forEach(function (seat) {
      seat.addEventListener('click', function () {
        var id = seat.getAttribute('data-seat');
        var index = selected.indexOf(id);
        if (index > -1) {
          selected.splice(index, 1);                     
        } else if (max === 1) {
          selected = [id];
        } else if (selected.length < max) {
          selected.push(id);
        }
        saveSeats(); // [변경] 선택/해제할 때마다 저장
        render();
      });
    });

    doneButton.addEventListener('click', function () {
      if (selected.length !== max) return;
      saveSeats(); // [변경] 확인 시 한 번 더 저장
      window.location.href = './ktx-12.html';
    });
    render();
}


/* ==========================================================
   ktx-12 예약 내역 확인  ※ ktx.js에 추가
   ========================================================== */

// [변경] DOMContentLoaded 안에 한 줄 추가
//   if (pageType === 'ktx-12') initKtxReserveConfirm();

var KTX_RESERVE_LIMIT_MS = 10 * 60 * 1000;   // 진입 후 10분

// [신규]
function initKtxReserveConfirm() {
    var booking = getKtxBooking();
    var seats = Array.isArray(booking.selectedSeats) ? booking.selectedSeats : [];
    var train = booking.selectedTrain || {};
    var list = document.getElementById('ktxReserveList');
    var prevButton = document.getElementById('ktxReservePrev');
    var nextButton = document.getElementById('ktxReserveNext');
    var pageSize = 2;
    var page = 0;

    // 상단 정보 (저장된 값이 있을 때만 교체, 없으면 마크업의 샘플 문구 유지)
    if (parseKtxDate(booking.departureDate)) {
      document.getElementById('ktxReserveDate').textContent =
        formatKtxDate(booking.departureDate).replace(' (', '(') + ' ' + (booking.departureTime || '');
    }
    if (booking.departure && booking.arrival) {
      document.getElementById('ktxReserveRoute').textContent = booking.departure + ' → ' + booking.arrival;
    }
    if (seats.length) {
      document.getElementById('ktxReserveCount').textContent = seats.length + '매';
    }

    function render() {
      if (!seats.length) return;                              // 저장된 좌석이 없으면 샘플 마크업 유지
      var pageCount = Math.ceil(seats.length / pageSize);
      list.replaceChildren();
      seats.slice(page * pageSize, (page + 1) * pageSize).forEach(function (seat) {
        var item = document.createElement('li');
        item.className = 'ktx-reserve__item';
        item.innerHTML =
          '<div class="ktx-reserve__train">' +
            '<p class="ktx-reserve__name"><span class="ktx-badge">KTX</span><span>' + (train.trainId || '') + '</span></p>' +
            '<p class="ktx-reserve__class">' + (train.seatClass || '') + '</p>' +
          '</div>' +
          '<div class="ktx-reserve__seat"><p></p><p>' + seat + '</p></div>';
        item.querySelector('.ktx-reserve__seat p').textContent = booking.selectedCar ? booking.selectedCar + '호차' : '—';
        list.appendChild(item);
      });
      prevButton.disabled = page === 0;
      nextButton.disabled = page + 1 >= pageCount;
    }

    prevButton.addEventListener('click', function () { page -= 1; render(); });
    nextButton.addEventListener('click', function () { page += 1; render(); });
    render();

    // 진입 후 10분 카운트: 10분이 지나도 예약 취소/화면 이동 없이 현재 페이지를 유지하고 결제 가능
    var startedAt = Date.now();
    updateKtxBooking({ reserveStartedAt: startedAt });
    setTimeout(function () {
      updateKtxBooking({ reserveTimeoutPassed: true });       // 기록만 남김 (화면 변화 없음)
    }, KTX_RESERVE_LIMIT_MS);
}

function initKtxPayMethod() {
    var buttons = document.querySelectorAll('.ktx-pay-method');
    var total = document.getElementById('ktxPayTotal');
    var savedMethod = getKtxBooking().payMethod;
    var savedButton = Array.from(buttons).find(function (button) {
      return button.getAttribute('data-pay-method') === savedMethod;
    });

    function readPaymentAmount() {
      var value = total.getAttribute('data-amount');
      if (!/^(0|[1-9]\d*)$/.test(value || '') || !Number.isSafeInteger(Number(value))) {
        throw new Error('총 결제금액을 읽을 수 없습니다.');
      }
      var amount = Number(value);
      total.textContent = amount.toLocaleString('ko-KR') + '원';
      return amount;
    }

    updateKtxBooking({ paymentAmount: readPaymentAmount() });

    function selectButton(selectedButton) {
      buttons.forEach(function (button) {
        var selected = button === selectedButton;
        button.classList.toggle('active', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
    }

    if (savedButton) {
      selectButton(savedButton);
    } else {
      buttons.forEach(function (button) {
        button.setAttribute('aria-pressed', String(button.classList.contains('active')));
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        // 선택한 결제수단 저장: simple / domestic / overseas / unionpay / mileage
        updateKtxBooking({
          payMethod: button.getAttribute('data-pay-method'),
          paymentAmount: readPaymentAmount()
        });
        selectButton(button);
        var next = button.getAttribute('data-next');         // 연결된 다음 화면이 있는 수단만 이동
        if (next) window.location.href = next;
      });
    });
}

window.addEventListener('pageshow', function () {
    var pageType = document.body.getAttribute('page-type');
    if (pageType === 'kpay-02') initKtxCardPayment();
    if (pageType === 'kpay-03') initKtxPaymentStatus();
});

function initKtxCardPayment() {
    var count = document.getElementById('ktxCardCount');
    var insertButton = document.getElementById('ktxCardInsert');
    var deadline = Date.now() + 30000;
    var timer;

    function proceed() {
      clearInterval(timer);
      sessionStorage.setItem('ktxCardRemaining', String(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))));
      window.location.href = './kpay-03.html';
    }

    function updateCount() {
      var remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      count.textContent = remaining;
      if (remaining === 0) proceed();
    }

    insertButton.onclick = proceed;
    updateCount();
    timer = setInterval(updateCount, 1000);
    window.addEventListener('pagehide', function () {
      clearInterval(timer);
    }, { once: true });
}

function initKtxPaymentStatus() {
    var modal = document.getElementById('ktxModal');
    var progress = document.getElementById('ktxPaymentProgress');
    var complete = document.getElementById('ktxPaymentComplete');
    var remaining = sessionStorage.getItem('ktxCardRemaining');
    if (remaining !== null) document.getElementById('ktxCardCount').textContent = remaining;
    progress.hidden = false;
    complete.hidden = true;
    modal.setAttribute('aria-labelledby', 'ktxPaymentProgressTitle');
    modal.setAttribute('aria-describedby', 'ktxPaymentProgressDescription');
    modal.focus();
    var timer = setTimeout(function () {
      progress.hidden = true;
      complete.hidden = false;
      modal.setAttribute('aria-labelledby', 'ktxPaymentCompleteTitle');
      modal.setAttribute('aria-describedby', 'ktxPaymentCompleteDescription');
    }, 2000);
    window.addEventListener('pagehide', function () {
      clearTimeout(timer);
    }, { once: true });
}

window.addEventListener('pageshow', function () {
    var pageType = document.body.getAttribute('page-type');
    if (pageType === 'ktx-13') {
      var timer = setTimeout(function () {
        window.location.href = './ktx-14.html';
      }, 3000);
      window.addEventListener('pagehide', function () {
        clearTimeout(timer);
      }, { once: true });
    }
    if (pageType === 'ktx-14') renderKtxTicket();
    if (pageType === 'ktx-09') {
      var booking = getKtxBooking();
      var train = booking.selectedTrain || {};
      var arrival = typeof booking.arrival === 'string' ? booking.arrival.trim() : '';
      document.getElementById('ktxPathTrain').textContent =
        (train.trainId || '—') + ' (' + (arrival ? arrival + '행' : '도착지 미선택') + ')';
    }
    if (pageType === 'ktx-10') {
      var fareBooking = getKtxBooking();
      document.getElementById('ktxFareRoute').textContent =
        (fareBooking.departure || '—') + ' → ' + (fareBooking.arrival || '—');
    }
});

function renderKtxTicket() {
    var booking = getKtxBooking();
    var train = booking.selectedTrain || {};
    var seats = Array.isArray(booking.selectedSeats) ? booking.selectedSeats : [];
    var date = parseKtxDate(booking.departureDate);
    var page = 0;
    var prev = document.getElementById('ktxTicketPrev');
    var next = document.getElementById('ktxTicketNext');

    if (date) {
      var parts = booking.departureDate.split('-');
      document.getElementById('ktxTicketDate').textContent =
        parts[0] + '년' + parts[1] + '월' + parts[2] + '일 (' + ['일', '월', '화', '수', '목', '금', '토'][date.getDay()] + ')';
    }
    document.getElementById('ktxTicketDeparture').textContent = booking.departure || '—';
    document.getElementById('ktxTicketArrival').textContent = booking.arrival || '—';
    document.getElementById('ktxTicketDepartureTime').textContent = train.departureTime || '—';
    document.getElementById('ktxTicketArrivalTime').textContent = train.arrivalTime || '—';
    document.getElementById('ktxTicketCar').textContent = booking.selectedCar ? booking.selectedCar + '호차' : '—';
    if (Number.isFinite(booking.paymentAmount)) {
      document.getElementById('ktxTicketAmount').textContent = booking.paymentAmount.toLocaleString('ko-KR');
    }

    function renderSeat() {
      document.getElementById('ktxTicketSeat').textContent = seats[page] || '—';
      document.getElementById('ktxTicketPage').textContent = (page + 1) + '/' + seats.length;
      prev.disabled = page === 0;
      next.disabled = page + 1 >= seats.length;
    }

    document.getElementById('ktxTicketPagination').hidden = seats.length <= 1;
    prev.onclick = function () { if (page > 0) { page -= 1; renderSeat(); } };
    next.onclick = function () { if (page + 1 < seats.length) { page += 1; renderSeat(); } };
    renderSeat();
}

document.querySelectorAll('[data-ktx-reset], #category-header .header-left a[href="../../index.html"]').forEach(function (link) {
    link.addEventListener('click', function () {
      sessionStorage.removeItem(KTX_BOOKING_STORAGE_KEY);
      sessionStorage.removeItem('ktxCardRemaining');
    });
});

/* ==========================================================
   ktxRe-03 승차권 번호 입력 
   ========================================================== */

function initKtxRefundTicketNo() {
    var MAX = 16;                                             // 승차권 번호 16자리 (4-4-4-4)
    var display = document.getElementById('ktxTicketNoDisplay');
    var confirmButton = document.getElementById('ktxTicketNoConfirm');
    var keys = document.querySelectorAll('.ktx-keypad button');
    var digits = '';

    function format(value) {
      return value.match(/.{1,4}/g).join('-');
    }

    function render() {
      var padded = digits + '_'.repeat(MAX - digits.length);   // 비어있는 자리는 _
      display.textContent = format(padded);                    // ____-____-____-____
      confirmButton.disabled = digits.length !== MAX;          // 16자리 입력해야 확인 활성화
    }

    // 입력/삭제 공통 처리 (화면 키패드, 키보드가 같이 사용)
    function press(value) {
      if (value === 'all') {
        digits = '';                                           // 전체지우기
      } else if (value === 'back') {
        digits = digits.slice(0, -1);                          // 지우기
      } else if (digits.length < MAX) {
        digits += value;                                       // 숫자 입력
      }
      render();
    }

    // 화면 키패드
    keys.forEach(function (key) {
      key.addEventListener('click', function () {
        press(key.getAttribute('data-key'));
      });
    });

    // [신규] 키보드 입력
    document.addEventListener('keydown', function (event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;   // 단축키(복사·붙여넣기 등)는 그대로
      if (/^[0-9]$/.test(event.key)) {                               // 숫자키, 숫자패드
        press(event.key);
      } else if (event.key === 'Backspace') {
        press('back');                                               // 지우기
      } else if (event.key === 'Delete') {
        press('all');                                                // 전체지우기
      } else if (event.key === 'Enter') {
        if (!confirmButton.disabled) confirmButton.click();          // 확인
        return;
      } else {
        return;
      }
      event.preventDefault();
    });

    // [신규] 붙여넣기 (숫자만 추출해서 16자리까지)
    document.addEventListener('paste', function (event) {
      var text = (event.clipboardData || window.clipboardData).getData('text');
      digits = text.replace(/\D/g, '').slice(0, MAX);
      render();
      event.preventDefault();
    });

    confirmButton.addEventListener('click', function () {
      if (digits.length !== MAX) return;
      updateKtxBooking({ refundTicketNo: format(digits) });    // ktxRe-04 에서 표시용
      window.location.href = './ktxRe-04.html';
    });
    render();
}

/* ==========================================================
   ktxRe-04 승차권 번호 표시 (선택)  ※ DOMContentLoaded 안에 추가
   ========================================================== */
//   if (pageType === 'ktxRe-04') initKtxRefundInfo();

// [신규] 입력한 승차권 번호가 있으면 화면의 샘플 번호를 교체
function initKtxRefundInfo() {
    var ticketNo = getKtxBooking().refundTicketNo;
    var el = document.getElementById('ktxReTicketNo');
    if (ticketNo && el) el.textContent = ticketNo;
}
