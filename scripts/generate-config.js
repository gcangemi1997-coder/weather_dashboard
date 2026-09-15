/* 
   GENERA IL FILE A PARTIRE DA config.example.js
   SOSTITUENDO IL PLACEHOLDER CON LA VARIABILE DI AMBIENTE WEATHER_API_KEY.
    ESEGUITO DA VERCEL AL DEPLOY.
*/

const fs = require("fs");
const path = require("path");

const apiKey = process.env.WEATHER_API_KEY;

if (!apiKey || apiKey === "INCOLLA_QUI_LA_TUA_API_KEY") {
  console.error("");
  console.error("ERRORE: variabile WEATHER_API_KEY non impostata.");
  console.error("");
  console.error("Su Vercel:   Project Settings → Environment Variables");
  console.error("In locale:   WEATHER_API_KEY=la_tua_key npm run build");
  console.error("");
  process.exit(1);
}

const templatePath = path.join(__dirname, "..", "js", "config.example.js");
const outputPath = path.join(__dirname, "..", "js", "config.js");

const template = fs.readFileSync(templatePath, "utf8");
const output = template.replace("INCOLLA_QUI_LA_TUA_API_KEY", apiKey);

fs.writeFileSync(outputPath, output, "utf8");

console.log("[build] js/config.js generato correttamente.");
console.log("[build] La API key NON è stata stampata a video, per sicurezza.");
