require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const https = require("https");

const apiKey = process.env.FOOTBALL_DATA_API_KEY;

if (!apiKey) {
  console.error("❌ Erro: FOOTBALL_DATA_API_KEY não configurada no arquivo .env");
  process.exit(1);
}

// Same translations from scripts/update_results.js
const TEAM_TRANSLATIONS = {
  "Mexico": "México",
  "South Africa": "África do Sul",
  "South Korea": "Coreia do Sul",
  "Korea Republic": "Coreia do Sul",
  "Czechia": "República Tcheca",
  "Czech Republic": "República Tcheca",
  "Canada": "Canadá",
  "Bosnia and Herzegovina": "Bósnia e Herzegovina",
  "Qatar": "Catar",
  "Switzerland": "Suíça",
  "Brazil": "Brasil",
  "Morocco": "Marrocos",
  "Haiti": "Haiti",
  "Scotland": "Escócia",
  "USA": "Estados Unidos",
  "United States": "Estados Unidos",
  "Paraguay": "Paraguai",
  "Australia": "Austrália",
  "Turkey": "Turquia",
  "Germany": "Alemanha",
  "Curaçao": "Curaçao",
  "Ivory Coast": "Costa do Marfim",
  "Ecuador": "Equador",
  "Netherlands": "Holanda",
  "Japan": "Japão",
  "Sweden": "Suécia",
  "Tunisia": "Tunísia",
  "Belgium": "Bélgica",
  "Egypt": "Egito",
  "Iran": "Irã",
  "New Zealand": "Nova Zelândia",
  "Spain": "Espanha",
  "Cape Verde": "Cabo Verde",
  "Saudi Arabia": "Arábia Saudita",
  "Uruguay": "Uruguai",
  "France": "França",
  "Senegal": "Senegal",
  "Iraq": "Iraque",
  "Norway": "Noruega",
  "Argentina": "Argentina",
  "Algeria": "Argélia",
  "Austria": "Áustria",
  "Jordan": "Jordânia",
  "Portugal": "Portugal",
  "DR Congo": "República Democrática do Congo",
  "Congo DR": "República Democrática do Congo",
  "Democratic Republic of the Congo": "República Democrática do Congo",
  "Uzbekistan": "Uzbequistão",
  "Colombia": "Colômbia",
  "England": "Inglaterra",
  "Croatia": "Croácia",
  "Ghana": "Gana",
  "Panama": "Panamá"
};

function translateTeam(name) {
  return TEAM_TRANSLATIONS[name] || name;
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: { "X-Auth-Token": apiKey }
    };
    https.get(url, options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    }).on("error", reject);
  });
}

async function run() {
  console.log("🔍 Buscando partidas da Copa do Mundo na API externa...");
  
  const res = await fetchJSON("https://api.football-data.org/v4/competitions/WC/matches");
  
  if (res.statusCode !== 200) {
    console.error(`❌ Erro ao buscar dados da API: ${res.statusCode}`);
    console.error(res.body);
    return;
  }

  const matches = res.body.matches || [];
  console.log(`✅ ${matches.length} partidas retornadas no total.`);

  console.log("\n=== FILTRANDO PARTIDAS DO DIA 14/06/2026 (ONTEM) ===");
  
  let count = 0;
  matches.forEach(m => {
    const dateUtc = m.utcDate; // e.g. "2026-06-14T17:00:00Z"
    const dateObj = new Date(dateUtc);
    
    // Formata em Horário de Brasília (SP) para verificar a data local
    const options = { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" };
    const localStr = dateObj.toLocaleString("pt-BR", options);
    
    const isUtcJune14 = dateUtc.startsWith("2026-06-14");
    const isLocalJune14 = localStr.includes("14/06/2026");
    
    if (isUtcJune14 || isLocalJune14) {
      count++;
      console.log(`\nPartida #${count}:`);
      console.log(`  • ID na API: ${m.id}`);
      console.log(`  • Confronto: ${m.homeTeam.name} x ${m.awayTeam.name}`);
      console.log(`  • Traduzido: ${translateTeam(m.homeTeam.name)} x ${translateTeam(m.awayTeam.name)}`);
      console.log(`  • Data UTC:   ${dateUtc}`);
      console.log(`  • Data Local: ${localStr}`);
      console.log(`  • Status API: ${m.status}`);
      console.log(`  • Placar:     ${m.score?.fullTime?.home !== null ? m.score.fullTime.home : "null"} x ${m.score?.fullTime?.away !== null ? m.score.fullTime.away : "null"}`);
    }
  });

  if (count === 0) {
    console.log("ℹ️ Nenhuma partida encontrada na API para o dia 14/06/2026.");
  }
}

run().catch(console.error);
