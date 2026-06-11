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

const TEAMS = {
  769: "México", 774: "África do Sul", 772: "Coreia do Sul", 798: "Rep. Tcheca",
  828: "Canadá", 1060: "Bósnia", 771: "EUA", 761: "Paraguai",
  8030: "Catar", 788: "Suíça", 764: "Brasil", 815: "Marrocos",
  836: "Haiti", 8873: "Escócia", 779: "Austrália", 803: "Turquia",
  759: "Alemanha", 9460: "Curaçau", 8601: "Holanda", 766: "Japão",
  1935: "Costa Marfim", 791: "Equador", 792: "Suécia", 802: "Tunísia",
  760: "Espanha", 1930: "Cabo Verde", 805: "Bélgica", 825: "Egito",
  801: "Arábia Saudita", 758: "Uruguai", 840: "Irã", 783: "Nova Zelândia",
  773: "França", 804: "Senegal", 8062: "Iraque", 8872: "Noruega",
  762: "Argentina", 778: "Argélia", 816: "Áustria", 8049: "Jordânia",
  765: "Portugal", 1934: "Congo DR", 770: "Inglaterra", 799: "Croácia",
  763: "Gana", 1836: "Panamá", 8070: "Uzbequistão", 818: "Colômbia"
};

function calcForm(matches, teamId) {
  const recent = matches
    .filter(m => m.status === "FINISHED" && (m.homeTeam?.id === teamId || m.awayTeam?.id === teamId))
    .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
    .slice(0, 5);

  if (!recent.length) return { form: "N/A", pts: 0, gf: 0, ga: 0, games: 0 };

  let pts = 0, gf = 0, ga = 0;
  const formStr = recent.map(m => {
    const isHome = m.homeTeam?.id === teamId;
    const myGoals = isHome ? m.score?.fullTime?.home : m.score?.fullTime?.away;
    const opGoals = isHome ? m.score?.fullTime?.away : m.score?.fullTime?.home;
    gf += myGoals || 0;
    ga += opGoals || 0;
    if (myGoals > opGoals) { pts += 3; return "V"; }
    if (myGoals === opGoals) { pts += 1; return "E"; }
    return "D";
  }).join("");

  return { form: formStr, pts, gf, ga, games: recent.length };
}

async function main() {
  const teamIds = Object.keys(TEAMS).map(Number);
  const formData = {};

  console.log("🔍 Buscando forma recente de cada seleção...\n");

  // Buscar partidas de qualificatórias/amistosos recentes por time
  for (let i = 0; i < teamIds.length; i++) {
    const id = teamIds[i];
    const name = TEAMS[id];
    try {
      await sleep(700); // respeitar rate limit
      const data = await fetchJSON(
        `https://api.football-data.org/v4/teams/${id}/matches?status=FINISHED&limit=10`
      );
      const matches = data.matches || [];
      const form = calcForm(matches, id);
      formData[id] = { name, ...form };

      const bar = "█".repeat(Math.round((form.pts / 15) * 10));
      process.stdout.write(`✓ ${name.padEnd(18)} | Forma: ${(form.form || "—").padEnd(5)} | Pts: ${form.pts}/15 | GF:${form.gf} GA:${form.ga}\n`);
    } catch(e) {
      formData[id] = { name, form: "ERR", pts: 0, gf: 0, ga: 0, games: 0 };
      process.stdout.write(`✗ ${name}: ${e.message}\n`);
    }
  }

  // Salvar resultado
  const fs = require("fs");
  fs.writeFileSync("scratch/form_data.json", JSON.stringify(formData, null, 2));
  console.log("\n✅ Dados salvos em scratch/form_data.json");
}

main().catch(console.error);
