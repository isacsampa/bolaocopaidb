require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function listBets() {
  const ISAAC_ID = "fd57a176-2b1d-4a9d-a133-b7f7f4f8e0dd";

  // 1. Obter todos os jogos para cruzar com os nomes dos times
  const { data: jogos, error: jogosError } = await supabase
    .from("jogos")
    .select("id, time_a, time_b, data_hora")
    .order("id");

  if (jogosError) {
    console.error("Erro ao buscar jogos:", jogosError.message);
    return;
  }

  const jogosMap = {};
  jogos.forEach(j => {
    jogosMap[j.id] = j;
  });

  // 2. Buscar todos os palpites do Isaac
  const { data: palpites, error: palpitesError } = await supabase
    .from("palpites")
    .select("jogo_id, palpite_gols_a, palpite_gols_b")
    .eq("usuario_id", ISAAC_ID)
    .order("jogo_id");

  if (palpitesError) {
    console.error("Erro ao buscar palpites:", palpitesError.message);
    return;
  }

  console.log(`### PALPITES DO ISAAC NO BANCO DE DADOS (${palpites.length} palpites)\n`);
  console.log("| ID Jogo | Data/Hora | Confronto | Palpite |");
  console.log("|---|---|---|---|");

  palpites.forEach(p => {
    const jogo = jogosMap[p.jogo_id];
    if (jogo) {
      const dataStr = new Date(jogo.data_hora).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
      console.log(`| ${p.jogo_id} | ${dataStr} | ${jogo.time_a} x ${jogo.time_b} | **${p.palpite_gols_a} x ${p.palpite_gols_b}** |`);
    } else {
      console.log(`| ${p.jogo_id} | - | Jogo não encontrado | **${p.palpite_gols_a} x ${p.palpite_gols_b}** |`);
    }
  });
}

listBets().catch(console.error);
