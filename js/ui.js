/* 
   UI — RENDERING ED INTERAZIONE DASHBOARD
   ESPONE window.WeatherUI
    */

(function () {
  "use strict";

  /* STATO INTERNO */

  const state = {
    current: null,
    days: [],
    currentDayIndex: 0,
    unit: localStorage.getItem("tl-unit") || "celsius",
  };

  /* UNICI RIFERIMENTI AL DOM */
  const el = {
    // HEADER
    liveTime: document.getElementById("liveTime"),
    liveDate: document.getElementById("liveDate"),
    year: document.getElementById("year"),

    // HERO
    currentTemp: document.getElementById("currentTemp"),
    currentNarrative: document.getElementById("currentNarrative"),
    feelsLike: document.getElementById("feelsLike"),
    humidity: document.getElementById("humidity"),
    wind: document.getElementById("wind"),
    pressure: document.getElementById("pressure"),

    // GIORNI
    daysList: document.getElementById("daysList"),
    mobileDayPicker: document.getElementById("mobileDayPicker"),
    mobileDayTrigger: document.getElementById("mobileDayTrigger"),
    mobileDayLabel: document.getElementById("mobileDayLabel"),
    mobileDayOptions: document.getElementById("mobileDayOptions"),

    // DETTAGLI MOBILE
    mDesc: document.getElementById("mDesc"),
    mHum: document.getElementById("mHum"),
    mWind: document.getElementById("mWind"),
    mSunrise: document.getElementById("mSunrise"),
    mSunset: document.getElementById("mSunset"),

    // ORE
    hoursTitle: document.getElementById("hoursTitle"),
    hoursTimeline: document.getElementById("hoursTimeline"),

    // ERRORE
    errorMessage: document.getElementById("errorMessage"),
  };

  function iconUrl(code) {
    const dayCode = code.replace("n", "d");
    // SFRUTTO I PNG OPENWEATHER COME ICONE
    return `https://openweathermap.org/img/wn/${code}@2x.png`;
  }

  /* FUNZIONE CONVERSIONE GRADI */
  function convertTemp(celsius) {
    return state.unit === "celsius" ? celsius : (celsius * 9) / 5 + 32;
  }

  function formatTemp(celsius) {
    if (typeof celsius !== "number" || Number.isNaN(celsius)) return "—°";
    const value = Math.round(convertTemp(celsius));
    const symbol = state.unit === "celsius" ? "°C" : "°F";
    return `${value}${symbol}`;
  }

  function formatTempShort(celsius) {
    // GRADO SENZA LETTERA PER MIGLIORE VISUALIZZAZIONE

    if (typeof celsius !== "number" || Number.isNaN(celsius)) return "—°";
    return `${Math.round(convertTemp(celsius))}°`;
  }

  function getHoursTitle(dayIndex) {
    const d = state.days[dayIndex];
    if (!d) return "Ora per ora";
    return `${d.fullWeekday}, ora per ora`;
  }

  /* OROLOGIO NELL'HEADER */

  const WEEKDAYS_FULL = [
    "Domenica",
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
  ];
  const MONTHS_FULL = [
    "gennaio",
    "febbraio",
    "marzo",
    "aprile",
    "maggio",
    "giugno",
    "luglio",
    "agosto",
    "settembre",
    "ottobre",
    "novembre",
    "dicembre",
  ];

  function tickClock() {
    if (!el.liveTime || !el.liveDate) return;
    const now = new Date();

    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    el.liveTime.textContent = `${hh}:${mm}`;

    const dayName = WEEKDAYS_FULL[now.getDay()];
    const day = now.getDate();
    const month = MONTHS_FULL[now.getMonth()];
    const year = now.getFullYear();
    el.liveDate.textContent = `${dayName} ${day} ${month} ${year}`;

    if (el.year) el.year.textContent = year;
  }

  function startClock() {
    tickClock();
    // REFRESH 30S

    setInterval(tickClock, 30000);
  }

  /* SEZIONE HERO */

  function renderHero() {
    const c = state.current;
    if (!c) return;

    const tempC = c.main.temp;

    if (el.currentTemp) {
      el.currentTemp.textContent = formatTempShort(tempC);
    }

    if (el.currentNarrative) {
      el.currentNarrative.textContent = window.WeatherAPI.narrativeFor(
        c.weather[0].id,
        tempC,
      );
    }

    if (el.feelsLike) el.feelsLike.textContent = formatTemp(c.main.feels_like);
    if (el.humidity) el.humidity.textContent = `${c.main.humidity}%`;
    if (el.wind) el.wind.textContent = `${Math.round(c.wind.speed * 3.6)} km/h`;
    if (el.pressure) el.pressure.textContent = `${c.main.pressure} hPa`;
  }

  /* GIORNI — ACCORDION DESKTOP */

  function renderDaysList() {
    if (!el.daysList) return;

    el.daysList.innerHTML = state.days
      .map(
        (d, i) => `
      <article class="day-card${i === state.currentDayIndex ? " is-open" : ""}" data-day="${i}">
        <div class="day-header" role="button" tabindex="0" aria-expanded="${i === state.currentDayIndex}">          <span class="day-name">
            <span class="day-week">${d.weekday}</span>
            <span class="day-date">${d.date}</span>
          </span>
            <span class="day-icon"><img src="${iconUrl(d.icon)}" alt="" width="40" height="40"></span>
          <span class="day-temps">
            ${formatTempShort(d.max)}
            <span class="min">${formatTempShort(d.min)}</span>
          </span>
          <span class="day-arrow" aria-hidden="true">▼</span>
        </div>
        <div class="collapsible">
          <div class="collapsible-inner">
            <div class="day-body-content">
              <div class="item"><span class="label">Descrizione</span><span class="value">${d.desc}</span></div>
              <div class="item"><span class="label">Umidità</span><span class="value">${d.hum}</span></div>
              <div class="item"><span class="label">Vento</span><span class="value">${d.wind}</span></div>
              ${d.sunrise ? `<div class="item"><span class="label">Alba</span><span class="value">${d.sunrise}</span></div>` : ""}
              ${d.sunset ? `<div class="item"><span class="label">Tramonto</span><span class="value">${d.sunset}</span></div>` : ""}            </div>
          </div>
        </div>
      </article>
    `,
      )
      .join("");
  }

  /* ORE — TIMELINE ORIZZONTALE */

  function renderHours(dayIndex) {
    const day = state.days[dayIndex];
    if (!day || !el.hoursTimeline) return;

    el.hoursTimeline.innerHTML = day.hours
      .map(
        (h, i) => `
      <li class="hour-card${i === 0 ? " is-open" : ""}" role="button" tabindex="0" aria-expanded="${i === 0}">
      <div class="time">${h.time}</div>
        <img class="weather-icon-img" src="${iconUrl(h.icon)}" alt="" width="50" height="50">
        <div class="temp">${formatTempShort(h.temp)}</div>
        <div class="desc">${h.desc}</div>
        <div class="collapsible">
          <div class="collapsible-inner">
            <div class="hour-details-content">
              <div class="item"><span class="label">Percepita</span><span>${formatTempShort(h.feels)}</span></div>
              <div class="item"><span class="label">Umidità</span><span>${h.hum}</span></div>
              <div class="item"><span class="label">Vento</span><span>${h.wind}</span></div>
              <div class="item"><span class="label">Pioggia</span><span>${h.rain}</span></div>
            </div>
          </div>
        </div>
      </li>
    `,
      )
      .join("");
  }

  /* MOBILE — DROPDOWN GIORNI */

  function renderMobileOptions() {
    if (!el.mobileDayOptions) return;

    el.mobileDayOptions.innerHTML = state.days
      .map(
        (d, i) => `
      <div class="mobile-day-option${i === state.currentDayIndex ? " is-selected" : ""}"
           data-day="${i}" role="option">
        <span class="opt-label">
          <span>${d.weekday} ${d.date}</span>
          <img src="${iconUrl(d.icon)}" alt="" width="24" height="24">
        </span>
        <span class="opt-temps">${formatTempShort(d.max)} / ${formatTempShort(d.min)}</span>
      </div>
    `,
      )
      .join("");

    updateMobileLabel();
  }

  function updateMobileLabel() {
    if (!el.mobileDayLabel) return;
    const d = state.days[state.currentDayIndex];
    if (!d) return;
    el.mobileDayLabel.textContent = `${d.weekday} ${d.date} — ${formatTempShort(d.max)}/${formatTempShort(d.min)}`;
  }

  function updateMobileDetails() {
    const d = state.days[state.currentDayIndex];
    if (!d) return;

    if (el.mDesc) el.mDesc.textContent = d.desc;
    if (el.mHum) el.mHum.textContent = d.hum;
    if (el.mWind) el.mWind.textContent = d.wind;
    if (el.mSunrise) {
      el.mSunrise.textContent = d.sunrise || "—";

      // NASCONDE GLI ITEM SE IL DATO MANCA
      el.mSunrise.closest(".item").hidden = !d.sunrise;
    }
    if (el.mSunset) {
      el.mSunset.textContent = d.sunset || "—";
      el.mSunset.closest(".item").hidden = !d.sunset;
    }

    if (el.mobileDayOptions) {
      el.mobileDayOptions
        .querySelectorAll(".mobile-day-option")
        .forEach((opt, i) => {
          opt.classList.toggle("is-selected", i === state.currentDayIndex);
        });
    }
  }

  function openPicker() {
    if (!el.mobileDayPicker) return;
    el.mobileDayPicker.classList.add("is-open");
    el.mobileDayTrigger.setAttribute("aria-expanded", "true");
  }

  function closePicker() {
    if (!el.mobileDayPicker) return;
    el.mobileDayPicker.classList.remove("is-open");
    el.mobileDayTrigger.setAttribute("aria-expanded", "false");
  }

  /* SELEZIONE GIORNO */

  function selectDay(index) {
    if (index === state.currentDayIndex) {
      closePicker();
      return;
    }
    state.currentDayIndex = index;

    // ACCORDION DESKTOP
    if (el.daysList) {
      el.daysList.querySelectorAll(".day-card").forEach((c, i) => {
        const isOpen = i === index;
        c.classList.toggle("is-open", isOpen);
        const header = c.querySelector(".day-header");
        if (header) header.setAttribute("aria-expanded", isOpen);
      });
    }

    // TRANSIZIONE TITOLO + TIMELINE
    if (el.hoursTitle) el.hoursTitle.classList.add("is-changing");
    if (el.hoursTimeline) el.hoursTimeline.classList.add("is-changing");

    setTimeout(() => {
      if (el.hoursTitle) el.hoursTitle.textContent = getHoursTitle(index);
      renderHours(index);
      if (el.hoursTitle) el.hoursTitle.classList.remove("is-changing");
      if (el.hoursTimeline) el.hoursTimeline.classList.remove("is-changing");
    }, 180);

    // MOBILE

    // NOTIFICA DEL CAMBIO GIORNO
    const dayCategory = state.days[index] ? state.days[index].category : null;
    if (dayCategory) {
      document.dispatchEvent(
        new CustomEvent("weather:day-change", {
          detail: { category: dayCategory, dayIndex: index },
        }),
      );
    }
    updateMobileDetails();
    updateMobileLabel();
    closePicker();
  }

  /* EVENTI - VARIAZIONE CONTENUTO */

  function toggleHourCard(card) {
    const wasOpen = card.classList.contains("is-open");

    el.hoursTimeline.querySelectorAll(".hour-card").forEach((c) => {
      c.classList.remove("is-open");
      c.setAttribute("aria-expanded", "false");
    });

    if (!wasOpen) {
      card.classList.add("is-open");
      card.setAttribute("aria-expanded", "true");
    }
  }

  function bindEvents() {
    // CLICK SU UN GIORNO - ACCORDION DESKTOP
    if (el.daysList) {
      el.daysList.addEventListener("click", (e) => {
        const header = e.target.closest(".day-header");
        if (!header) return;
        const card = header.closest(".day-card");
        if (!card) return;
        selectDay(Number(card.dataset.day));
      });
    }

    if (el.daysList) {
      el.daysList.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const header = e.target.closest(".day-header");
        if (!header) return;
        e.preventDefault();
        const card = header.closest(".day-card");
        if (!card) return;
        selectDay(Number(card.dataset.day));
      });
    }

    // CLICK SU UN ORARIO

    if (el.hoursTimeline) {
      el.hoursTimeline.addEventListener("click", (e) => {
        const card = e.target.closest(".hour-card");
        if (!card) return;
        toggleHourCard(card);
      });

      // ACCESSIBILITÀ PER UTILIZZO ANCHE DA TASTIERA
      el.hoursTimeline.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const card = e.target.closest(".hour-card");
        if (!card) return;
        e.preventDefault();
        toggleHourCard(card);
      });
    }

    // DROPDOWN MOBILE
    if (el.mobileDayTrigger) {
      el.mobileDayTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        if (el.mobileDayPicker.classList.contains("is-open")) {
          closePicker();
        } else {
          openPicker();
        }
      });
    }

    if (el.mobileDayOptions) {
      el.mobileDayOptions.addEventListener("click", (e) => {
        const opt = e.target.closest(".mobile-day-option");
        if (!opt) return;
        selectDay(Number(opt.dataset.day));
      });
    }

    // CHIUSURA DROPDOWN SU CLICK ESTERNO
    document.addEventListener("click", (e) => {
      if (!el.mobileDayPicker) return;
      if (!el.mobileDayPicker.contains(e.target)) closePicker();
    });
  }

  /* STATI DI ERRORE / RETRY */

  function showRetrying(attempt, maxAttempts) {
    if (el.errorMessage) {
      el.errorMessage.hidden = true;
    }
    if (el.currentNarrative) {
      el.currentNarrative.textContent = `Sto riprovando a leggere il cielo sopra Lodi… (${attempt}/${maxAttempts})`;
    }
  }

  function showError(message) {
    if (el.errorMessage) {
      el.errorMessage.hidden = false;
      el.errorMessage.textContent =
        message || "Non riesco a leggere il meteo. Riprova più tardi.";
    }
    if (el.currentNarrative) {
      el.currentNarrative.textContent = "Il cielo oggi non collabora.";
    }
  }

  function clearError() {
    if (el.errorMessage) {
      el.errorMessage.hidden = true;
      el.errorMessage.textContent = "";
    }
  }

  /* RENDER PRINCIPALE */

  /* MOSTRA DEGLI SCHELETRI NELLE SEZIONI VUOTE DURANTE LA FETCH.
    VIENE CHIAMATO SOLO AL BOOT, POI RENDER() SOSTITUISCE TUTTO  */
  function showSkeleton() {
    if (el.daysList) {
      el.daysList.innerHTML = Array.from(
        { length: 5 },
        () => `
        <article class="skeleton-card skeleton-day">
          <span class="skeleton-shape sk-week"></span>
          <span class="skeleton-shape sk-icon"></span>
          <span class="skeleton-shape sk-temp"></span>
        </article>
      `,
      ).join("");
    }

    if (el.hoursTimeline) {
      el.hoursTimeline.innerHTML = Array.from(
        { length: 8 },
        () => `
        <li class="skeleton-card skeleton-hour">
          <span class="skeleton-shape sk-time"></span>
          <span class="skeleton-shape sk-icon"></span>
          <span class="skeleton-shape sk-temp"></span>
        </li>
      `,
      ).join("");
    }
  }
  function render(data) {
    clearError();

    state.current = data.current;
    state.days = data.days || [];

    // Preserva il giorno selezionato se esiste ancora.
    // Se non esiste più (o è la prima volta), torna a 0 = Oggi.
    if (state.currentDayIndex >= state.days.length) {
      state.currentDayIndex = 0;
    }

    const idx = state.currentDayIndex;

    renderHero();
    renderDaysList();
    if (el.hoursTitle) el.hoursTitle.textContent = getHoursTitle(idx);
    renderHours(idx);
    renderMobileOptions();
    updateMobileDetails();
  }

  /* CAMBIO UNITÀ */

  function setUnit(unit) {
    if (unit !== "celsius" && unit !== "fahrenheit") return;
    if (unit === state.unit) return;

    state.unit = unit;
    localStorage.setItem("tl-unit", unit);

    // RERENDER SE DIPESO DALLA TEMPERATURA
    if (state.current) {
      renderHero();
      renderDaysList();
      renderHours(state.currentDayIndex);
      renderMobileOptions();
      updateMobileDetails();
    }
  }

  function getUnit() {
    return state.unit;
  }

  /* API PUBBLICA */

  window.WeatherUI = {
    render,
    setUnit,
    getUnit,
    showRetrying,
    showError,
    clearError,
    startClock,
    // ESPONGO selectDay PER EVENTUALE USO ESTERNO
    selectDay,
  };

  /* BOOTSTRAP: QUANDO DOM PRONTO, SI COLLEGANO GLI EVENTI E SI AVVIA L'OROLOGIO */

  function boot() {
    showSkeleton();
    bindEvents();
    startClock();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
