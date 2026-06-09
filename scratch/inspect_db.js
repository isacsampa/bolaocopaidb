require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function inspect() {
  const { data: profiles, error: perfisErr } = await supabase
    .from("perfis")
    .select("id, nome");

  if (perfisErr) {
    console.error("Erro ao buscar perfis:", perfisErr.message);
    return;
  }

  console.log(`=== Perfis no Banco (${profiles.length}) ===`);
  profiles.forEach(p => console.log(`- ID: ${p.id} | Nome: ${p.nome}`));

  const { data: gamesWithScores, error: gamesErr } = await supabase
    .from("jogos")
    .select("id, time_a, time_b, gols_a, gols_b")
    .not("gols_a", "is", null);

  if (gamesErr) {
    console.error("Erro ao buscar jogos com placares:", gamesErr.message);
    return;
  }

  console.log(`\n=== Jogos com resultados definidos (${gamesWithScores.length}) ===`);
  gamesWithScores.forEach(g => console.log(`- Jogo #${g.id}: ${g.time_a} ${g.gols_a} × ${g.gols_b} ${g.time_b}`));
}

inspect();
