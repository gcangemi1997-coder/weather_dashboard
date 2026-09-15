/* CANVAS:
QUESTO FILE AGGIUNGE LO SFONDO DINAMICO
ALLA PAGINA IN BASE AL METEO ATTUALE */

(function () {
  "use strict";

  const canvas = document.getElementById("weatherCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  /* STATO INTERNO */

  let width = 0;
  let height = 0;
  let dpr = 1;

  let currentCategory = "clouds";
  let particles = [];
  let animationId = null;
  let running = false;

  /* RIDIMENSIONAMENTO DEL CANVAS IN BASE ALLO SCHERMO UTILIZZATO */

  function resize() {
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // RIGENERAZIONE PARTICELLE PER ADATTARLE ALLO SCHERMO
    buildParticles();
  }

  /* GENERATORE DI PARTICELLE */

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  /* ANIMAZIONE PIOGGIA */
  function makeRainDrop() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      len: randomBetween(10, 22),
      speed: randomBetween(6, 12),
      opacity: randomBetween(0.15, 0.4),
    };
  }

  /* ANIMAZIONE NEVE */
  function makeSnowFlake() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: randomBetween(1.2, 3.2),
      speed: randomBetween(0.4, 1.4),
      drift: randomBetween(-0.4, 0.4),
      phase: Math.random() * Math.PI * 2,
      opacity: randomBetween(0.4, 0.9),
    };
  }

  /* ANIMAZIONE SERA */
  function makeStar() {
    return {
      x: Math.random() * width,
      y: Math.random() * height * 0.7,
      r: randomBetween(0.6, 1.6),
      phase: Math.random() * Math.PI * 2,
      speed: randomBetween(0.005, 0.02),
    };
  }

  /* ANIMAZIONE NUVOLE */
  function makeCloud() {
    return {
      x: randomBetween(-200, width + 200),
      y: randomBetween(0, height * 0.6),
      r: randomBetween(80, 220),
      speed: randomBetween(0.05, 0.2),
      opacity: randomBetween(0.08, 0.22),
    };
  }

  /* ANIMAZIONE TEMPORALE */
  let flashAlpha = 0;

  /* COSTRUZIONE PARTICELLE */

  function buildParticles() {
    const area = width * height;
    particles = [];
    flashAlpha = 0;

    switch (currentCategory) {
      case "rain": {
        const n = Math.min(220, Math.floor(area / 9000));
        for (let i = 0; i < n; i++) particles.push(makeRainDrop());
        break;
      }
      case "storm": {
        const n = Math.min(280, Math.floor(area / 7000));
        for (let i = 0; i < n; i++) particles.push(makeRainDrop());
        break;
      }
      case "snow": {
        const n = Math.min(180, Math.floor(area / 11000));
        for (let i = 0; i < n; i++) particles.push(makeSnowFlake());
        break;
      }
      case "clear": {
        const n = Math.min(120, Math.floor(area / 14000));
        for (let i = 0; i < n; i++) particles.push(makeStar());
        break;
      }
      case "clouds": {
        const n = 6;
        for (let i = 0; i < n; i++) particles.push(makeCloud());
        break;
      }
      case "mist": {
        const n = 8;
        for (let i = 0; i < n; i++) particles.push(makeCloud());
        break;
      }
      default: {
        const n = 5;
        for (let i = 0; i < n; i++) particles.push(makeCloud());
      }
    }
  }

  /* SWITCH COLORI IN BASE A SCELTA TEMA */

  function isDark() {
    return document.body.classList.contains("dark");
  }

  function rainColor(opacity) {
    return isDark()
      ? `rgba(190, 200, 255, ${opacity})`
      : `rgba(80, 100, 140, ${opacity})`;
  }

  function snowColor(opacity) {
    return isDark()
      ? `rgba(240, 240, 255, ${opacity})`
      : `rgba(255, 255, 255, ${opacity * 0.9})`;
  }

  function starColor(opacity) {
    return isDark()
      ? `rgba(255, 250, 220, ${opacity})`
      : `rgba(180, 120, 50, ${opacity * 0.45})`;
  }

  function cloudColor(opacity) {
    return isDark()
      ? `rgba(180, 170, 230, ${opacity})`
      : `rgba(80, 60, 40, ${opacity * 1.6})`;
  }

  /* DISEGNO PER CATEGORIA */

  function drawRain(dt) {
    ctx.lineCap = "round";
    particles.forEach((p) => {
      p.y += p.speed * dt;
      if (p.y > height + 20) {
        p.y = -20;
        p.x = Math.random() * width;
      }
      ctx.strokeStyle = rainColor(p.opacity);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, p.y + p.len);
      ctx.stroke();
    });
  }

  function drawStorm(dt) {
    drawRain(dt);

    // Lampi occasionali
    if (Math.random() < 0.004) {
      flashAlpha = 0.35 + Math.random() * 0.3;
    }
    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
      ctx.fillRect(0, 0, width, height);
      flashAlpha -= 0.025;
      if (flashAlpha < 0) flashAlpha = 0;
    }
  }

  function drawSnow(dt) {
    particles.forEach((p) => {
      p.phase += 0.02;
      p.y += p.speed * dt;
      p.x += Math.sin(p.phase) * 0.6 + p.drift;

      if (p.y > height + 10) {
        p.y = -10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      ctx.fillStyle = snowColor(p.opacity);
      const radius = isDark() ? p.r : p.r * 1.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawStars(dt) {
    particles.forEach((p) => {
      p.phase += p.speed;
      const twinkle = (Math.sin(p.phase) + 1) / 2; // 0..1
      ctx.fillStyle = starColor(0.3 + twinkle * 0.6);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawClouds(dt) {
    particles.forEach((p) => {
      p.x += p.speed * dt;
      if (p.x - p.r > width + 100) {
        p.x = -p.r - 100;
        p.y = Math.random() * height * 0.6;
      }

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      grad.addColorStop(0, cloudColor(p.opacity));
      grad.addColorStop(1, cloudColor(0));

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /* LOOP ANIMAZIONE PER NON ASPETTARE IL REFRESH DELLA */

  let lastTime = 0;

  function loop(timestamp) {
    if (!running) return;

    if (!lastTime) lastTime = timestamp;
    const rawDt = (timestamp - lastTime) / 16.67; // CIRCA 60fps
    const dt = Math.min(rawDt, 3); // LIMITE SALTO
    lastTime = timestamp;

    ctx.clearRect(0, 0, width, height);

    switch (currentCategory) {
      case "rain":
        drawRain(dt);
        break;
      case "storm":
        drawStorm(dt);
        break;
      case "snow":
        drawSnow(dt);
        break;
      case "clear":
        drawStars(dt);
        break;
      case "mist":
      case "clouds":
      default:
        drawClouds(dt);
    }

    animationId = requestAnimationFrame(loop);
  }

  /* API PUBBLICA */

  function setCategory(category) {
    if (!category || category === currentCategory) return;
    currentCategory = category;
    buildParticles();
  }

  function start() {
    if (running) return;
    running = true;
    lastTime = 0;
    animationId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  /* INIZIALIZZAZIONE */

  window.addEventListener("resize", resize);

  // STOP ANIMAZIONE SE SCHEDA NON PRESENTE - RISPARMIO CPU
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (prefersReduced) {
    // SE NON C'É ANIMAZIONE -> SCENARIO STATICO
    resize();
    running = false;
  } else {
    resize();
  }

  window.WeatherCanvas = {
    setCategory,
    start: () => {
      if (!prefersReduced) start();
    },
    stop,
  };
})();
