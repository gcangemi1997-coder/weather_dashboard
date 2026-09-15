/* ESPOSIZIONE window.WeatherAPI con:

    - TUTTE LE FETCH
    - STRINGA NARRATIVA
    - ICONE
    - CATEGORIE METEO
*/

(function () {
  "use strict";

  const cfg = window.WEATHER_CONFIG;

  if (!cfg || !cfg.apiKey || cfg.apiKey === "INCOLLA_QUI_LA_TUA_API_KEY") {
    console.warn(
      "[api.js] Config mancante. Copia config.example.js in config.js e inserisci la API key.",
    );
  }

  const BASE = "https://api.openweathermap.org/data/2.5";

  /* MAPPA DEI CODICI METEO
     Solo descrizione e categoria. Le icone arrivano dal campo .icon
     della risposta OpenWeather (es. "10d", "04n"). */
  const WEATHER_MAP = {
    200: { desc: "Temporale", category: "storm" },
    201: { desc: "Temporale", category: "storm" },
    202: { desc: "Temporale forte", category: "storm" },
    210: { desc: "Temporale", category: "storm" },
    211: { desc: "Temporale", category: "storm" },
    212: { desc: "Temporale forte", category: "storm" },
    221: { desc: "Temporale", category: "storm" },
    230: { desc: "Temporale", category: "storm" },
    231: { desc: "Temporale", category: "storm" },
    232: { desc: "Temporale forte", category: "storm" },

    300: { desc: "Pioviggine", category: "rain" },
    301: { desc: "Pioviggine", category: "rain" },
    302: { desc: "Pioviggine", category: "rain" },
    310: { desc: "Pioviggine", category: "rain" },
    311: { desc: "Pioviggine", category: "rain" },
    312: { desc: "Pioviggine", category: "rain" },
    313: { desc: "Pioviggine", category: "rain" },
    314: { desc: "Pioviggine", category: "rain" },
    321: { desc: "Pioviggine", category: "rain" },

    500: { desc: "Pioggia", category: "rain" },
    501: { desc: "Pioggia", category: "rain" },
    502: { desc: "Pioggia forte", category: "rain" },
    503: { desc: "Pioggia forte", category: "rain" },
    504: { desc: "Pioggia forte", category: "rain" },
    511: { desc: "Pioggia gelata", category: "rain" },
    520: { desc: "Rovesci", category: "rain" },
    521: { desc: "Rovesci", category: "rain" },
    522: { desc: "Rovesci forti", category: "rain" },
    531: { desc: "Rovesci", category: "rain" },

    600: { desc: "Neve", category: "snow" },
    601: { desc: "Neve", category: "snow" },
    602: { desc: "Neve forte", category: "snow" },
    611: { desc: "Nevischio", category: "snow" },
    612: { desc: "Nevischio", category: "snow" },
    613: { desc: "Nevischio", category: "snow" },
    615: { desc: "Neve e pioggia", category: "snow" },
    616: { desc: "Neve e pioggia", category: "snow" },
    620: { desc: "Rovesci neve", category: "snow" },
    621: { desc: "Rovesci neve", category: "snow" },
    622: { desc: "Rovesci neve", category: "snow" },

    701: { desc: "Foschia", category: "mist" },
    711: { desc: "Fumo", category: "mist" },
    721: { desc: "Foschia", category: "mist" },
    731: { desc: "Sabbia", category: "mist" },
    741: { desc: "Nebbia", category: "mist" },
    751: { desc: "Sabbia", category: "mist" },
    761: { desc: "Polvere", category: "mist" },
    762: { desc: "Cenere", category: "mist" },
    771: { desc: "Raffiche", category: "mist" },
    781: { desc: "Tornado", category: "storm" },

    800: { desc: "Sereno", category: "clear" },
    801: { desc: "Poco nuvoloso", category: "clouds" },
    802: { desc: "Nubi sparse", category: "clouds" },
    803: { desc: "Nuvoloso", category: "clouds" },
    804: { desc: "Coperto", category: "clouds" },
  };

  const FALLBACK = { desc: "Boh", category: "clouds" };

  function weatherInfo(id) {
    return WEATHER_MAP[id] || FALLBACK;
  }

  function categoryFor(id) {
    return weatherInfo(id).category;
  }

  /* NARRAZIONI IRONICHE -  SCELTE CASUALI IN BASE AL METEO E AL GIORNO */
  const NARRATIVES = {
    clear: [
      "Cielo pulito come i tuoi buoni propositi del lunedì mattina.",
      "Sole pieno. Non ci sono scuse: esci.",
      "Sereno ovunque. Anche il meteo, oggi, ha deciso di collaborare.",
    ],
    clouds: [
      "Il cielo di Lodi oggi è indeciso: qualche nube, ma il sole non molla.",
      "Nuvole in giro, nessuna minaccia concreta. Portati una felpa, per scaramanzia.",
      "Grigio di facciata, ma il cielo non ha cattive intenzioni.",
    ],
    rain: [
      "Piove. L’ombrello è quella cosa che hai lasciato a casa, vero?",
      "Acqua dal cielo. Lodi non diventerà Venezia, ma quasi.",
      "Giornata da film noir: pioggia, caffè, e nessuna voglia di uscire.",
    ],
    snow: [
      "Nevica su Lodi. Il traffico non sarà d’accordo.",
      "Neve. Bello da guardare, meno da spalare.",
      "Fiocchi in giro. Metti le scarpe giuste, non le solite.",
    ],
    storm: [
      "Temporale in arrivo. Oggi il cielo ha carattere.",
      "Tuoni e lampi: meglio non fare gli eroi con l’ombrello.",
      "Fulmini sopra Lodi. Resta al coperto e goditi lo spettacolo.",
    ],
    mist: [
      "Nebbia fitta. Lodi è ancora lì, promesso.",
      "Visibilità ridotta: guida piano e accendi i fari.",
      "Foschia dappertutto. Il Po si è trasferito in città, quasi.",
    ],
  };

  function narrativeFor(id, tempC) {
    const cat = categoryFor(id);
    const list = NARRATIVES[cat] || NARRATIVES.clouds;

    // STESSO GIORNO -> STESSA FRASE
    const day = new Date().getDate();
    let phrase = list[day % list.length];

    // FRASE IRONICA PER TEMPERATURE ESAGERATE
    if (typeof tempC === "number") {
      if (tempC >= 32) {
        phrase += " E fa anche un caldo indecente.";
      } else if (tempC <= 3) {
        phrase += " E fa un freddo che nemmeno a gennaio.";
      }
    }

    return phrase;
  }

  /* 
     FETCH CON LOGICA DI RETRY:
     - 2 TENTATIVI TOTALI (1 + 1 RETRY)
     - BACKOFF ESPONENZIALE CON JITTER
     - OGNI TENTATIVO 5S DI TIMEOUT
     - NIENTE RETRY SU ERRORE 4xx (tranne 429)
     - UI CALLBACK ONRETRY OPZIONALE
     */

  const MAX_ATTEMPTS = 2;
  const TIMEOUT_MS = 5000;
  const BASE_DELAY_MS = 900;

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function fetchOnce(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  async function fetchWithRetry(url, options = {}) {
    const { onRetry } = options;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const res = await fetchOnce(url);

        // SUCCESSO
        if (res.ok) return res.json();

        const retryAfter = Number(res.headers.get("Retry-After"));
        const isRetryable =
          res.status === 429 || (res.status >= 500 && res.status < 600);

        // ERRORE PER CUI NON RIPROVARE
        if (!isRetryable) {
          const err = new Error(`OpenWeather ha risposto ${res.status}`);
          err.status = res.status;
          err.definitive = true;
          throw err;
        }

        // ULTIMO TENTATIVO ESAURITO
        if (attempt === MAX_ATTEMPTS) {
          const err = new Error(
            `OpenWeather ha risposto ${res.status} dopo ${MAX_ATTEMPTS} tentativi`,
          );
          err.status = res.status;
          err.definitive = false;
          throw err;
        }

        const delay = retryAfter
          ? retryAfter * 1000
          : BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 300;

        console.warn(
          `[api.js] ${res.status}, ritento tra ${Math.round(delay)}ms`,
        );

        if (typeof onRetry === "function") {
          onRetry({
            attempt,
            maxAttempts: MAX_ATTEMPTS,
            delay,
            reason: `HTTP ${res.status}`,
          });
        }

        await sleep(delay);
      } catch (err) {
        lastError = err;

        // ERRORE DEFINITIVO: ESCO SUBITO
        if (err.definitive) throw err;

        // ERRORE RETE O TIMEOUT
        const isNetwork =
          err.name === "AbortError" || err.name === "TypeError" || !err.status;

        if (!isNetwork) throw err;

        if (attempt === MAX_ATTEMPTS) {
          const finalErr = new Error(
            "Connessione a OpenWeather fallita dopo più tentativi",
          );
          finalErr.definitive = false;
          throw finalErr;
        }

        // DURATA RETRY CIRCA 11s

        const delay =
          BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 300;

        console.warn(
          `[api.js] errore di rete, ritento tra ${Math.round(delay)}ms`,
        );

        if (typeof onRetry === "function") {
          onRetry({
            attempt,
            maxAttempts: MAX_ATTEMPTS,
            delay,
            reason: err.name === "AbortError" ? "timeout" : "network",
          });
        }

        await sleep(delay);
      }
    }

    throw lastError || new Error("Errore sconosciuto");
  }

  function fetchJson(url, options) {
    return fetchWithRetry(url, options);
  }

  function fetchCurrent(options) {
    const url =
      `${BASE}/weather?lat=${cfg.lat}&lon=${cfg.lon}` +
      `&units=${cfg.units}&lang=${cfg.lang}&timezone=Europe/Rome` +
      `&appid=${cfg.apiKey}`;
    return fetchJson(url, options);
  }

  function fetchForecast(options) {
    const url =
      `${BASE}/forecast?lat=${cfg.lat}&lon=${cfg.lon}` +
      `&units=${cfg.units}&lang=${cfg.lang}&timezone=Europe/Rome` +
      `&appid=${cfg.apiKey}`;
    return fetchJson(url, options);
  }

  /* AGGREGAZIONE FORECAST IN BASE AL GIORNO */

  function dayKeyFromDate(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  /* CCONVERSIONE ORARIO SECONDO IL TIMEZONE */
  function localDate(utcSeconds, tzOffsetSeconds) {
    return new Date((utcSeconds + tzOffsetSeconds) * 1000);
  }

  const WEEKDAYS_SHORT = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
  const WEEKDAYS_FULL = [
    "Domenica",
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
  ];

  function formatDateShort(date) {
    const d = String(date.getUTCDate()).padStart(2, "0");
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    return `${d}/${m}`;
  }

  function formatHour(date) {
    return `${String(date.getUTCHours()).padStart(2, "0")}:00`;
  }

  /* 
     SE IL GIORNO È OGGI, RESTITUISCE GLI SLOT A PARTIRE DALL'ORA
     CORRENTE (ROLLING SULLE PROSSIME 24 ORE).
     ALTRIMENTI I PRIMI 8.
  */
  function pickHours(slots, isToday) {
    if (!isToday) return slots.slice(0, 8);

    const now = Math.floor(Date.now() / 1000);
    const startIdx = slots.findIndex((s) => s.dt >= now);

    // SE SONO GIÀ TUTTE PASSATE, PRENDO LE ULTIME 8
    if (startIdx === -1) return slots.slice(-8);

    return slots.slice(startIdx, startIdx + 8);
  }

  /* TRASFORMAZIONE DELLA RISPOSTA IN UN ARRAY DI GIORNI */
  function buildDays(forecast) {
    if (!forecast || !Array.isArray(forecast.list)) return [];

    const tz = (forecast.city && forecast.city.timezone) || 0;
    const groups = new Map();

    forecast.list.forEach((slot) => {
      const d = localDate(slot.dt, tz);
      const key = dayKeyFromDate(d);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(slot);
    });

    const nowUtc = Math.floor(Date.now() / 1000);
    const todayKey = dayKeyFromDate(localDate(nowUtc, tz));

    const days = [];

    groups.forEach((slots, key) => {
      // ORDINE CRONOLOGICO DEGLI SLOT
      slots.sort((a, b) => a.dt - b.dt);

      const first = slots[0];
      const d = localDate(first.dt, tz);
      const isToday = key === todayKey;

      // TEMPERATURA MIN/MAX DEL GIORNO
      const temps = slots.map((s) => s.main.temp);
      const min = Math.min(...temps);
      const max = Math.max(...temps);

      // SLOT "PIÙ RAPPRESENTATIVO" DEL GIORNO (vicino a mezzogiorno)
      const midday = slots.reduce((best, s) => {
        const h = localDate(s.dt, tz).getUTCHours();
        const bestH = localDate(best.dt, tz).getUTCHours();
        return Math.abs(h - 13) < Math.abs(bestH - 13) ? s : best;
      }, slots[0]);

      const middayWeather = midday.weather[0];
      const info = weatherInfo(middayWeather.id);

      const dayEntry = {
        key,
        weekday: WEEKDAYS_SHORT[d.getUTCDay()],
        fullWeekday: isToday ? "Oggi" : WEEKDAYS_FULL[d.getDay()],
        date: formatDateShort(d),
        icon: middayWeather.icon, // codice icona es. "04d"
        category: info.category, // per il canvas
        min,
        max,
        desc: info.desc,
        hum: Math.round(first.main.humidity) + "%",
        wind: Math.round(first.wind.speed * 3.6) + " km/h",
        // ALBA/TRAMONTO: LI POPOLA enrichToday SOLO PER OGGI.
        // PER GLI ALTRI GIORNI RESTANO null E UI LI NASCONDE.
        sunrise: null,
        sunset: null,
        hours: pickHours(slots, isToday).map((s) => {
          const sd = localDate(s.dt, tz);
          const si = weatherInfo(s.weather[0].id);
          const rain = s.pop != null ? Math.round(s.pop * 100) + "%" : "—";
          return {
            time: formatHour(sd),
            icon: s.weather[0].icon, // codice icona dello slot
            temp: s.main.temp, // numero in °C
            desc: si.desc,
            feels: s.main.feels_like, // numero in °C
            hum: Math.round(s.main.humidity) + "%",
            wind: Math.round(s.wind.speed * 3.6) + " km/h",
            rain,
          };
        }),
      };

      days.push(dayEntry);
    });

    // ORDINAMENTO GIORNI CRONOLOGICAMENTE
    days.sort((a, b) => a.key.localeCompare(b.key));

    // MASSIMO 5 GIORNI, CAUSA OPENWEATHER
    return days.slice(0, 5);
  }

  function enrichToday(days, current, tz) {
    if (!days.length || !current) return days;

    const w = current.weather[0];
    const info = weatherInfo(w.id);

    const todayEntry = days[0];

    todayEntry.icon = w.icon;
    todayEntry.category = info.category;
    todayEntry.desc = info.desc;

    // AGGIUNTA DATI ALBA/TRAMONTO
    if (current.sys && current.sys.sunrise && current.sys.sunset) {
      const sr = localDate(current.sys.sunrise, tz);
      const ss = localDate(current.sys.sunset, tz);
      todayEntry.sunrise =
        String(sr.getUTCHours()).padStart(2, "0") +
        ":" +
        String(sr.getUTCMinutes()).padStart(2, "0");
      todayEntry.sunset =
        String(ss.getUTCHours()).padStart(2, "0") +
        ":" +
        String(ss.getUTCMinutes()).padStart(2, "0");
    }

    return days;
  }

  /* CHIAMATA API PUBBLICA */

  async function fetchAll(options = {}) {
    const { onRetry } = options;

    const [current, forecast] = await Promise.all([
      fetchCurrent({ onRetry }),
      fetchForecast({ onRetry }),
    ]);

    const tz = (forecast.city && forecast.city.timezone) || 0;
    const days = enrichToday(buildDays(forecast), current, tz);

    return { current, forecast, days };
  }

  window.WeatherAPI = {
    fetchAll,
    narrativeFor,
    categoryFor,
    weatherInfo,
  };
})();
