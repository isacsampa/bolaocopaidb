require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Map teams to groups
const GROUPS = {
  A: ["México", "África do Sul", "República da Coreia", "República Tcheca"],
  B: ["Canadá", "Bósnia e Herzegovina", "Catar", "Suíça"],
  C: ["Brasil", "Marrocos", "Haiti", "Escócia"],
  D: ["Estados Unidos", "Paraguai", "Austrália", "Turquia"],
  E: ["Alemanha", "Curaçau", "Costa do Marfim", "Equador"],
  F: ["Holanda", "Japão", "Suécia", "Tunísia"],
  G: ["Bélgica", "Irã", "Nova Zelândia", "Egito"],
  H: ["Espanha", "Cabo Verde", "Arábia Saudita", "Uruguai"],
  I: ["França", "Senegal", "Iraque", "Noruega"],
  J: ["Argentina", "Argélia", "Áustria", "Jordânia"],
  K: ["Portugal", "Rep. Democrática do Congo", "Uzbequistão", "Colômbia"],
  L: ["Inglaterra", "Croácia", "Gana", "Panamá"]
};

function getGroup(team) {
  for (const [group, teams] of Object.entries(GROUPS)) {
    if (teams.includes(team)) return group;
  }
  return null;
}

async function run() {
  const { data: jogos, error } = await supabase
    .from("jogos")
    .select("id, time_a, time_b, data_hora")
    .order("data_hora");

  if (error) {
    console.error(error);
    return;
  }

  const grouped = {};
  Object.keys(GROUPS).forEach(g => grouped[g] = []);

  jogos.forEach(j => {
    const group = getGroup(j.time_a) || getGroup(j.time_b);
    if (group) {
      grouped[group].push(j);
    }
  });

  console.log("=== JOGOS DO BANCO DE DADOS AGRUPADOS ===");
  for (const [group, list] of Object.entries(grouped)) {
    console.log(`\n--- Grupo ${group} ---`);
    list.forEach((j, idx) => {
      const date = new Date(j.data_hora);
      const options = { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" };
      const dateStr = date.toLocaleString("pt-BR", options);
      console.log(`J${idx+1} | ID: ${j.id} | ${dateStr} | ${j.time_a} vs ${j.time_b}`);
    });
  }
}

run();
