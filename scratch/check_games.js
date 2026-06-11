require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function main() {
  // Buscar todos os jogos
  const { data: jogos, error } = await supabase
    .from("jogos")
    .select("id, time_a, time_b, gols_a, gols_b, data_hora")
    .order("data_hora", { ascending: true });

  if (error) { console.error("Erro:", error.message); return; }

  const now = new Date();
  const deadline = new Date(process.env.GLOBAL_DEADLINE || "2026-06-11T16:00:00-03:00");

  console.log(`\n⏰ Agora: ${now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);
  console.log(`🔒 Deadline: ${deadline.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);
  console.log(`\n📋 TOTAL DE JOGOS: ${jogos.length}\n`);

  const abertos = [];
  const comResultado = [];
  const encerrados = [];

  for (const j of jogos) {
    const dataJogo = new Date(j.data_hora);
    const temResultado = j.gols_a !== null && j.gols_b !== null;

    if (temResultado) {
      comResultado.push(j);
    } else if (now >= deadline || now >= dataJogo) {
      encerrados.push(j);
    } else {
      abertos.push(j);
    }
  }

  console.log("✅ JOGOS ABERTOS PARA PALPITE:");
  abertos.forEach(j => {
    const d = new Date(j.data_hora).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    console.log(`  [${j.id}] ${j.time_a} vs ${j.time_b} — ${d}`);
  });

  console.log(`\n🔒 JOGOS ENCERRADOS (sem resultado): ${encerrados.length}`);
  encerrados.slice(0, 5).forEach(j => {
    const d = new Date(j.data_hora).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    console.log(`  [${j.id}] ${j.time_a} vs ${j.time_b} — ${d}`);
  });

  console.log(`\n🏁 JOGOS COM RESULTADO: ${comResultado.length}`);

  // Buscar palpites do Isaac (id: fd57a176-2b1d-4a9d-a133-b7f7f4f8e0dd)
  const ISAAC_ID = "fd57a176-2b1d-4a9d-a133-b7f7f4f8e0dd";
  const { data: palpites } = await supabase
    .from("palpites")
    .select("jogo_id, palpite_gols_a, palpite_gols_b")
    .eq("usuario_id", ISAAC_ID);

  console.log(`\n🎯 PALPITES DO ISAAC: ${palpites?.length || 0}`);
  const palpitesIds = new Set((palpites || []).map(p => p.jogo_id));

  console.log("\n📌 JOGOS ABERTOS SEM PALPITE DO ISAAC:");
  abertos.filter(j => !palpitesIds.has(j.id)).forEach(j => {
    const d = new Date(j.data_hora).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    console.log(`  [${j.id}] ${j.time_a} vs ${j.time_b} — ${d}`);
  });
}

main().catch(console.error);
