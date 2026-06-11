const https = require("https");

const API_KEY = "90085551c8e747d58044f9587a1e613d";

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: { "X-Auth-Token": API_KEY }
    };
    https.get(url, options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    }).on("error", reject);
  });
}

async function main() {
  // Testar acesso à API
  console.log("Testando football-data.org API...\n");

  // Buscar competições disponíveis
  const comps = await fetchJSON("https://api.football-data.org/v4/competitions/");
  console.log("Competições disponíveis:");
  (comps.competitions || []).forEach(c => {
    console.log(`  [${c.id}] ${c.name} (${c.code}) — ${c.area?.name}`);
  });

  // Tentar buscar Copa do Mundo 2026
  try {
    const wc = await fetchJSON("https://api.football-data.org/v4/competitions/WC/matches");
    console.log("\nCopa do Mundo matches:", JSON.stringify(wc).slice(0, 300));
  } catch(e) {
    console.log("\nErro ao buscar WC:", e.message);
  }
}

main().catch(console.error);
