# 🌤️ Tempo Lodigiano - Weather DashBoard

Dashboard meteo editoriale per Lodi, Italia. Un progetto front-end senza framework, bundler o dipendenze da installare.

L'applicazione combina meteo attuale, previsioni, narrativa editoriale e un canvas animato in un'interfaccia responsive con tema chiaro/scuro.

## Indice

- [Caratteristiche](#caratteristiche)
- [Avvio locale](#avvio-locale)
- [Struttura del progetto](#struttura-del-progetto)
- [Stack tecnologico](#stack-tecnologico)
- [Scelte tecniche](#scelte-tecniche)
- [Accessibilità](#accessibilità)
- [Tecnologie valutate](#tecnologie-valutate)
- [Deploy](#deploy)
- [Sviluppi futuri](#sviluppi-futuri)
- [Licenza](#licenza)

## Caratteristiche

- Meteo attuale di Lodi con temperatura, temperatura percepita, umidità, vento e pressione.
- Frase narrativa ironica, variabile in base alle condizioni meteo e al giorno.
- Timeline delle prossime 24 ore, con otto slot da tre ore e card espandibili.
- Previsioni a cinque giorni con accordion per umidità, vento, alba e tramonto.
- Canvas animato a tutto schermo con pioggia, neve, stelle o nuvole in base al meteo selezionato.
- Aggiornamento dello scenario del canvas quando si seleziona un giorno diverso.
- Tema chiaro/scuro salvato nella memoria del browser.
- Conversione istantanea tra Celsius e Fahrenheit senza una nuova chiamata API.
- Layout responsive: accordion su desktop e dropdown personalizzato su mobile.
- Skeleton loader al primo caricamento: shimmer mentre arrivano i dati, così l'utente non vede pagine vuote.
- Interfaccia realizzata con HTML semantico e attenzione alla navigazione da tastiera.

## Avvio locale

### 1. Clona il repository

```bash
git clone https://github.com/gcangemi1997-coder/weather_dashboard
cd weather_dashboard
```

### 2. Crea una API key OpenWeather

Registrati su [OpenWeather](https://openweathermap.org/api) e recupera la chiave dalla pagina [API keys](https://home.openweathermap.org/api_keys).

Dopo la registrazione, l'attivazione della chiave può richiedere da 10 minuti a 2 ore.

### 3. Crea la configurazione locale

Copia il file di esempio:

```bash
cp js/config.example.js js/config.js
```

Apri `js/config.js` e sostituisci `INCOLLA_QUI_LA_TUA_API_KEY` con la tua chiave reale.

> ⚠️ `js/config.js` è incluso in `.gitignore` e non deve mai essere committato. Contiene file .env.

### 4. Apri l'applicazione

Puoi aprire direttamente `index.html` con un doppio clic: l'applicazione usa esclusivamente file statici e risorse CDN.

Per un server locale, utile durante lo sviluppo e il live reload:

```bash
python -m http.server 8000
```

Poi visita [http://localhost:8000](http://localhost:8000).

## Struttura del progetto

```text
weather_dashboard/

├── index.html
├── impostazioni.html
├── favicon.svg
├── assets/
│   ├── og-image.png
│   └── icon.svg
├── css/
│   └── stile.css
├── js/
│   ├── config.example.js
│   ├── config.js
│   ├── api.js
│   ├── canvas.js
│   ├── ui.js
│   └── main.js
├── scripts/
│   └── generate-config.js
├── package.json
├── vercel.json
├── .gitignore
└── README.md
```

## Stack tecnologico

| Area       | Tecnologia                                        | Utilizzo                                              |
| ---------- | ------------------------------------------------- | ----------------------------------------------------- |
| Markup     | HTML5 semantico                                   | `header`, `main`, `section`, `article`, `dl`, `ol`    |
| Stile      | CSS3 puro                                         | Custom properties, gradienti, `backdrop-filter`, Grid |
| Logica     | JavaScript vanilla ES2020+                        | `async/await`, `AbortController`, `CustomEvent`       |
| Dati       | [OpenWeather API](https://openweathermap.org/api) | Endpoint `/weather` e `/forecast`                     |
| Animazioni | Canvas 2D nativo                                  | Pioggia, neve, stelle e nuvole senza librerie         |
| Font       | Google Fonts                                      | Playfair Display e Inter                              |
| Hosting    | Vercel                                            | Deploy automatico dal repository GitHub               |
| Versioning | Git e GitHub                                      | Configurazione locale esclusa dallo storico           |

## Scelte tecniche

### Nessun framework o bundler

Il progetto utilizza esclusivamente HTML, CSS e JavaScript nativi. Non sono presenti React, Vue, Svelte, Vite, Webpack, TypeScript o dipendenze npm.

La dashboard è composta da due pagine e pochi moduli JavaScript caricati con `defer`. Il browser può quindi scaricare gli script in parallelo ed eseguirli nell'ordine corretto, senza un processo di build.

Questa scelta mantiene il progetto semplice da clonare e avviare: ciò che si trova nel repository è direttamente pubblicabile.

### Architettura solo front-end

Non esistono server Node.js, database o funzioni serverless. Le coordinate di Lodi sono definite nella configurazione e la chiave API viene caricata dal browser all'avvio.

Questo comporta un compromesso: in un'applicazione esclusivamente front-end la chiave può essere visualizzata dagli utenti nella console del browser. Le contromisure adottate sono:

- la chiave non viene mai committata su GitHub;
- `js/config.js` è escluso tramite `.gitignore`;
- in produzione la chiave può essere limitata al dominio Vercel autorizzato;
- la configurazione di produzione viene generata tramite la variabile d'ambiente `WEATHER_API_KEY`.

Per una protezione completa sarebbe necessario un backend proxy che custodisca la chiave e inoltri le richieste all'API.

### Retry, timeout e backoff

Le chiamate a OpenWeather includono una gestione degli errori composta da:

- due tentativi totali: una richiesta iniziale e un retry;
- backoff esponenziale con jitter, secondo una logica equivalente a `base * 2^attempt + random`;
- timeout di cinque secondi per tentativo tramite `AbortController`;
- nessun retry per gli errori 4xx definitivi, fatta eccezione per il rate limit `429`;
- callback `onRetry`, usata dalla UI per mostrare lo stato di ripetizione della richiesta.

### Fuso orario di Lodi, non del browser

Tutte le chiamate a OpenWeather passano `dalla TimeZone Europa/Roma`. Le date vengono convertite usando l'offset di fuso che OpenWeather restituisce in `forecast.city.timezone`, non con `new Date()` (che userebbe il fuso del visitatore).

Se un utente apre il sito da Londra, la timeline delle 18:00 a Lodi deve restare “18:00”, non diventare “17:00”. Le funzioni `dayKeyFromDate`, `formatDateShort`, `formatHour` usano i metodi `getUTC*` sul `Date` già convertito, che è il modo corretto di gestire un fuso “fisso” in JavaScript senza librerie.

### Canvas dinamico

Il canvas è scritto senza librerie di animazione e disegna scenari diversi in base alla categoria meteo:

- pioggia;
- neve;
- stelle;
- nuvole.

Il loop usa `requestAnimationFrame` con delta time normalizzato, così l'animazione mantiene un comportamento coerente su schermi a 60 Hz e 144 Hz. Il rendering si interrompe quando la scheda non è visibile e rispetta `prefers-reduced-motion`.

### Eventi custom

Il cambio del giorno selezionato viene comunicato tramite l'evento custom `weather:day-change`:

```text
ui.js → dispatch('weather:day-change') → main.js → canvas.setCategory()
```

`ui.js` non conosce il canvas e `canvas.js` non conosce la UI. `main.js` coordina i moduli, applicando un semplice pattern observer e mantenendo separate responsabilità e dipendenze.

### Accordion con CSS Grid

Gli accordion usano la transizione da `0fr` a `1fr`, evitando valori `max-height` fissi:

```css
.collapsible {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.5s var(--ease);
}

.is-open > .collapsible {
  grid-template-rows: 1fr;
}
```

Il contenuto può quindi avere altezze diverse senza ricalibrare manualmente la transizione.

### Architettura modulare

| Modulo      | Responsabilità                           | API principale                   |
| ----------- | ---------------------------------------- | -------------------------------- |
| `api.js`    | Fetch, mapping dei dati e gestione retry | `WeatherAPI.fetchAll()`          |
| `ui.js`     | Rendering e interazioni                  | `WeatherUI.render(data)`         |
| `canvas.js` | Sfondo animato                           | `WeatherCanvas.setCategory(cat)` |
| `main.js`   | Avvio e coordinamento                    | Orchestrazione globale           |

`api.js` restituisce un oggetto con struttura `{ current, forecast, days }`. `days` contiene cinque giornate, ciascuna con otto intervalli orari.

Ogni modulo è esposto come oggetto globale — `window.WeatherAPI`, `window.WeatherUI` e `window.WeatherCanvas` — mentre `main.js` è l'unico modulo che li conosce tutti.

## Accessibilità

Il progetto include:

- elementi HTML semantici come `header`, `main`, `section`, `article`, `footer`, `dl` e `ol`;
- navigazione da tastiera sulle card giornaliere e orarie tramite `role="button"`, `tabindex="0"` e supporto a Invio/Spazio;
- `aria-expanded` sugli accordion;
- `aria-current="page"` sul link della pagina attiva;
- `aria-label` sulle icone di navigazione;
- `role="alert"` per i messaggi di errore;
- supporto a `prefers-reduced-motion`, con animazioni e transizioni ridotte o disattivate.

## Tecnologie valutate

### jQuery

Scartata perché le funzionalità necessarie sono già coperte dalle API moderne del browser:

- `querySelectorAll()` per i selettori;
- `classList`, `setAttribute()` e `dataset` per la manipolazione del DOM;
- `addEventListener()` e `closest()` per la delegazione degli eventi;
- `fetch()` con `async/await` per le richieste;
- CSS Grid per le animazioni degli accordion.

Aggiungere jQuery avrebbe introdotto peso e complessità senza un beneficio concreto per un progetto di queste dimensioni.

### Vite e altri bundler

Non necessari per cinque script caricati con `defer`. Un bundler diventerebbe utile in caso di adozione di TypeScript, SCSS, un framework o una codebase più ampia.

### React, Vue e Svelte

Non necessari per una dashboard composta da due pagine, una card riutilizzabile e poche interazioni. In questo contesto la manipolazione diretta del DOM tramite template string mantiene il codice più contenuto.

### TypeScript

Valutato ma rimandato. Il progetto non ha una complessità di tipi sufficiente a giustificare transpiler, configurazione e build step.

### Preprocessori CSS

Non necessari: le custom properties CSS coprono già il principale caso d'uso delle variabili e il CSS moderno offre funzionalità native sempre più complete.

### WordPress

Non adatto al contesto: il progetto è una dashboard interattiva, non un sito editoriale basato su contenuti, articoli e media.

### OpenWeather One Call 3.0

Non utilizzata perché richiede una carta di credito anche per il piano gratuito. Gli endpoint `/weather` e `/forecast` coprono le esigenze attuali con previsioni a cinque giorni a intervalli di tre ore.

### Test automatici

Rimandati. In futuro sarebbe utile introdurre Vitest per testare in isolamento le funzioni pure di `api.js`, come `buildDays`, `pickHours` e `narrativeFor`.

### PWA

Rimandata. Un service worker e un manifest permetterebbero installazione su mobile e funzionamento offline con l'ultima previsione salvata.

## Deploy

Il progetto è pubblicato su [Vercel](https://vercel.com/) con deploy automatico dal repository GitHub.

Ogni push sul branch `main` genera un nuovo deploy. In produzione, la variabile d'ambiente `WEATHER_API_KEY` viene utilizzata dallo script `scripts/generate-config.js` per generare la configurazione necessaria al build.

### Replica del deploy

1. Fai fork del repository su GitHub.
2. Importa il progetto su [Vercel](https://vercel.com/new).
3. Aggiungi la variabile d'ambiente `WEATHER_API_KEY` con la tua chiave OpenWeather.
4. Avvia il deploy.

Vercel eseguirà `npm run build` e pubblicherà la cartella statica configurata dal progetto.

## Sviluppi futuri

- Ampliare il dizionario delle frasi narrative con variazioni per ora del giorno e stagione.
- Estendere la timeline oltre le 24 ore con granularità oraria.
- Salvare il giorno selezionato tra una sessione e l'altra.
- Trasformare l'applicazione in una PWA installabile e utilizzabile offline.
- Aggiungere test automatici con Vitest per le funzioni pure di `api.js`.
- Introdurre la ricerca di città con il geocoding di OpenWeather.

## Licenza

Progetto dimostrativo. Sentiti libero di usarlo come riferimento.

I dati meteo sono forniti da [OpenWeather](https://openweathermap.org/).

<p align="center">Fatto a mano, con calma. 🌤️</p>
