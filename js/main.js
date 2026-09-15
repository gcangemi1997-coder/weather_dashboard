/* MAIN FILE: 
    1. APPLICA TEMA SALVATO AL BOOT
    2. GESTISCE SWITCH TEMA APPLICATO
    3. SU DASHBOARD: FETCH + RENDER + CANVAS + AUTP-REFRESH
    4. TOGGLE GRADI
    5. RILEVAMENTO PAGINA ATTUALE
   */

(function () {
  "use strict";

  /* RILEVAMENTO PAGINA */
  const isDashboard = !!document.getElementById("daysList");
  const isSettings = !!document.getElementById("settings-title");

  /* APPLICAZIONE E SWITCH TEMA */

  const THEME_KEY = "tl-theme";

  function applyTheme(dark) {
    document.body.classList.toggle("dark", dark);

    // AGGIORNAMENTO TOGGLE PAGINA
    document.querySelectorAll(".theme-switch").forEach((sw) => {
      sw.setAttribute("aria-pressed", dark);
      const knob = sw.querySelector(".knob");
      if (knob) knob.textContent = dark ? "🌙" : "☀️";
    });

    // AGGIORNA ETICHETTA IN PAGINA IMPOSTAZIONI
    const themeValue = document.getElementById("themeValue");
    if (themeValue) themeValue.textContent = dark ? "Scuro" : "Chiaro";

    // AGGIORNA COLORE DEL TEMA SULLA BARRA DEL BROWSER IN MOBILE
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#0b1024" : "#fdf6ec");
  }

  function getSavedTheme() {
    return localStorage.getItem(THEME_KEY) === "dark";
  }

  function toggleTheme() {
    const next = !document.body.classList.contains("dark");
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    applyTheme(next);
  }

  function bindThemeSwitches() {
    document.querySelectorAll(".theme-switch").forEach((sw) => {
      sw.addEventListener("click", toggleTheme);
    });
  }

  /* UNITÀ — PAGINA IMPOSTAZIONI */

  const UNIT_KEY = "tl-unit";

  function applyUnit(unit) {
    const isC = unit === "celsius";

    const btnC = document.getElementById("unitCelsius");
    const btnF = document.getElementById("unitFahrenheit");

    if (btnC) {
      btnC.classList.toggle("is-active", isC);
      btnC.setAttribute("aria-checked", isC);
    }
    if (btnF) {
      btnF.classList.toggle("is-active", !isC);
      btnF.setAttribute("aria-checked", !isC);
    }
  }

  function getSavedUnit() {
    const saved = localStorage.getItem(UNIT_KEY);
    return saved === "fahrenheit" ? "fahrenheit" : "celsius";
  }

  function bindUnitButtons() {
    const btnC = document.getElementById("unitCelsius");
    const btnF = document.getElementById("unitFahrenheit");

    if (btnC) {
      btnC.addEventListener("click", () => {
        localStorage.setItem(UNIT_KEY, "celsius");
        applyUnit("celsius");
        if (window.WeatherUI) window.WeatherUI.setUnit("celsius");
      });
    }
    if (btnF) {
      btnF.addEventListener("click", () => {
        localStorage.setItem(UNIT_KEY, "fahrenheit");
        applyUnit("fahrenheit");
        if (window.WeatherUI) window.WeatherUI.setUnit("fahrenheit");
      });
    }
  }

  /* ---------------------------------------------------------
     DASHBOARD — FETCH, RENDER, CANVAS E AUTO-REFRESH */

  let refreshTimerId = null;

  /* Al primo caricamento, lo skeleton resta visibile per almeno
     MIN_SKELETON_MS millisecondi. Così l'utente percepisce il
     caricamento anche se la fetch è velocissima. I refresh
     successivi (auto-refresh, cambio giorno) non sono rallentati. */
  const MIN_SKELETON_MS = 600;
  let isFirstLoad = true;

  function refresh() {
    const startTime = Date.now();

    return window.WeatherAPI.fetchAll({
      onRetry: ({ attempt, maxAttempts }) => {
        if (window.WeatherUI) {
          window.WeatherUI.showRetrying(attempt, maxAttempts);
        }
      },
    })
      .then((data) => {
        const render = () => {
          // Render della UI
          if (window.WeatherUI) {
            window.WeatherUI.render(data);
          }

          // Sfondo canvas: prendo la categoria dal meteo corrente
          if (window.WeatherCanvas && data.days && data.days.length) {
            // Uso la categoria del primo giorno (Oggi), coerente
            // con la selezione iniziale della colonna sinistra.
            const cat =
              data.days[0].category ||
              window.WeatherAPI.categoryFor(data.current.weather[0].id);
            window.WeatherCanvas.setCategory(cat);
            window.WeatherCanvas.start();
          }

          return data;
        };

        // Primo caricamento: rispetta il minimo di skeleton
        if (isFirstLoad) {
          isFirstLoad = false;
          const elapsed = Date.now() - startTime;
          const wait = Math.max(0, MIN_SKELETON_MS - elapsed);
          return new Promise((resolve) => setTimeout(resolve, wait)).then(
            render,
          );
        }

        // Refresh successivi: render immediato
        return render();
      })
      .catch((err) => {
        console.error("[main.js] fetch fallita:", err);
        if (window.WeatherUI) {
          window.WeatherUI.showError(err.message);
        }
      });
  }

  function startAutoRefresh() {
    const minutes = Number((window.WEATHER_CONFIG || {}).refreshMinutes) || 0;
    if (minutes <= 0) return;

    // RESET TIMER PER EVENTUALE REBOOT
    if (refreshTimerId) clearInterval(refreshTimerId);

    refreshTimerId = setInterval(
      () => {
        // NON RICARICARE SE SCHEDA NASCOSTA

        if (!document.hidden) refresh();
      },
      minutes * 70 * 1000,
    );
  }

  /* AVVIO */

  function boot() {
    // TEMA PER ENTRAMBE LE PAGINE
    applyTheme(getSavedTheme());
    bindThemeSwitches();

    // TEMA SU IMPOSTAZIONI
    if (isSettings) {
      applyUnit(getSavedUnit());
      bindUnitButtons();

      // CANVAS DECORATIVO
      if (window.WeatherCanvas) {
        window.WeatherCanvas.setCategory("clouds");
        window.WeatherCanvas.start();
      }
      return;
    }

    // TEMA SU PAGINA INDEX
    if (isDashboard) {
      if (window.WeatherUI) {
        window.WeatherUI.setUnit(getSavedUnit());
      }

      // IL CANVAS REAGISCE AL CAMBIO DI GIORNO
      document.addEventListener("weather:day-change", (e) => {
        if (window.WeatherCanvas && e.detail && e.detail.category) {
          window.WeatherCanvas.setCategory(e.detail.category);
        }
      });
      refresh().then(() => startAutoRefresh());

      // REFRESH DEL CANVAS
      document.addEventListener("weather:day-change", (e) => {
        if (window.WeatherCanvas && e.detail && e.detail.category) {
          window.WeatherCanvas.setCategory(e.detail.category);
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
