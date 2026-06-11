const https = require("https");

const API_KEY = "90085551c8e747d58044f9587a1e613d";

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const options = { headers: { "X-Auth-Token": API_KEY } };
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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  // Buscar todos os jogos da fase de grupos WC 2026
  const wcData = await fetchJSON("https://api.football-data.org/v4/competitions/WC/matches?stage=GROUP_STAGE");

  console.log(`\n📋 Total partidas fase de grupos: ${wcData.resultSet?.count}`);
  console.log("Primeiros jogos:\n");

  const matches = wcData.matches || [];

  // Mostrar estrutura de um jogo para entender os campos
  if (matches.length > 0) {
    const sample = matches[0];
    console.log("EXEMPLO DE JOGO:");
    console.log(`  ID: ${sample.id}`);
    console.log(`  Data: ${sample.utcDate}`);
    console.log(`  ${sample.homeTeam?.name} vs ${sample.awayTeam?.name}`);
    console.log(`  Grupo: ${sample.group}`);
    console.log(`  Status: ${sample.status}`);
    console.log(`  Score: ${JSON.stringify(sample.score)}`);
    console.log(`  HomeTeam ID: ${sample.homeTeam?.id}`);
    console.log(`  AwayTeam ID: ${sample.awayTeam?.id}`);
    console.log();
  }

  // Listar todos os jogos com IDs dos times
  console.log("TODOS OS JOGOS:\n");
  matches.forEach(m => {
    const d = new Date(m.utcDate).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    console.log(`[${m.id}] ${m.homeTeam?.name} (${m.homeTeam?.id}) vs ${m.awayTeam?.name} (${m.awayTeam?.id}) — ${d} | Grupo: ${m.group}`);
  });

  // Pegar IDs únicos dos times
  const teamIds = new Set();
  matches.forEach(m => {
    if (m.homeTeam?.id) teamIds.add(m.homeTeam.id);
    if (m.awayTeam?.id) teamIds.add(m.awayTeam.id);
  });

  console.log(`\n📊 Total de seleções: ${teamIds.size}`);
  console.log("IDs:", [...teamIds].join(", "));
}

main().catch(console.error);
