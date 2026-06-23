require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");
const https = require("https");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const apiKey = process.env.FOOTBALL_DATA_API_KEY;

const TEAM_TRANSLATIONS = {
  "Mexico": "México",
  "South Africa": "África do Sul",
  "South Korea": "República da Coreia",
  "Korea Republic": "República da Coreia",
  "Czechia": "República Tcheca",
  "Czech Republic": "República Tcheca",
  "Canada": "Canadá",
  "Bosnia and Herzegovina": "Bósnia e Herzegovina",
  "Bosnia-Herzegovina": "Bósnia e Herzegovina",
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
  "Curaçao": "Curaçau",
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
  "Cape Verde Islands": "Cabo Verde",
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
  "DR Congo": "Rep. Democrática do Congo",
  "Congo DR": "Rep. Democrática do Congo",
  "Democratic Republic of the Congo": "Rep. Democrática do Congo",
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
  const { data: dbGames, error: dbError } = await supabase
    .from("jogos")
    .select("id, time_a, time_b, gols_a, gols_b");

  if (dbError) {
    console.error("Erro no Supabase:", dbError);
    return;
  }

  const res = await fetchJSON("https://api.football-data.org/v4/competitions/WC/matches");
  const matches = res.body.matches || [];

  console.log("=== COMPARAÇÃO E DEBUG ===");
  
  for (const match of matches) {
    if (match.status !== "FINISHED" && match.status !== "IN_PLAY") {
      continue;
    }

    const homeTranslated = translateTeam(match.homeTeam.name);
    const awayTranslated = translateTeam(match.awayTeam.name);
    
    const realGolsA = match.score.fullTime.home;
    const realGolsB = match.score.fullTime.away;

    if (realGolsA === null || realGolsB === null) {
      continue;
    }

    const matchedDbGame = dbGames.find(g => 
      (g.time_a.trim() === homeTranslated.trim() && g.time_b.trim() === awayTranslated.trim()) ||
      (g.time_a.trim() === awayTranslated.trim() && g.time_b.trim() === homeTranslated.trim())
    );

    if (matchedDbGame) {
      const isReversed = matchedDbGame.time_a.trim() === awayTranslated.trim();
      const targetGolsA = isReversed ? realGolsB : realGolsA;
      const targetGolsB = isReversed ? realGolsA : realGolsB;

      console.log(`Match: ${homeTranslated} x ${awayTranslated} | DB Match: [ID ${matchedDbGame.id}] ${matchedDbGame.time_a} x ${matchedDbGame.time_b}`);
      console.log(`  • Placar API: ${realGolsA}x${realGolsB} | Alinhado: ${targetGolsA}x${targetGolsB}`);
      console.log(`  • Placar DB:  ${matchedDbGame.gols_a}x${matchedDbGame.gols_b}`);
      
      if (matchedDbGame.gols_a !== targetGolsA || matchedDbGame.gols_b !== targetGolsB) {
        console.log(`  ➡️ PRECISA ATUALIZAR!`);
      } else {
        console.log(`  ✅ Placar já está idêntico.`);
      }
    } else {
      console.log(`❌ Não encontrou no banco: ${homeTranslated} x ${awayTranslated}`);
    }
  }
}

run().catch(console.error);
