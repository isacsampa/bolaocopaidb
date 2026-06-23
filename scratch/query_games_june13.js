require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function run() {
  console.log("🔍 Buscando partidas do dia 13 de Junho de 2026...");
  
  const { data: jogos, error } = await supabase
    .from("jogos")
    .select("id, time_a, time_b, data_hora, gols_a, gols_b")
    .order("data_hora");

  if (error) {
    console.error("❌ Erro ao buscar jogos:", error.message);
    return;
  }

  const jogosDia13 = jogos.filter(j => j.data_hora.startsWith("2026-06-13"));
  
  console.log(`📋 Total de jogos encontrados no dia 13: ${jogosDia13.length}`);
  jogosDia13.forEach(j => {
    console.log(`- ID: ${j.id} | ${j.time_a} x ${j.time_b} | Data: ${j.data_hora} | Placar: ${j.gols_a} x ${j.gols_b}`);
  });
}

run().catch(console.error);
