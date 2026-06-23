require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function run() {
  const usuario_id = "4ca59f85-5993-40af-9ad4-50a00777b57b"; // João Pedro
  const jogo_id = 290; // México x África do Sul
  const palpite_gols_a = 1; // México
  const palpite_gols_b = 0; // África do Sul

  console.log(`💾 Salvando palpite para João Pedro (ID: ${usuario_id}):`);
  console.log(`🏟️ Jogo #${jogo_id}: México ${palpite_gols_a} x ${palpite_gols_b} África do Sul`);

  const { data, error } = await supabase
    .from("palpites")
    .upsert(
      {
        usuario_id,
        jogo_id,
        palpite_gols_a,
        palpite_gols_b
      },
      { onConflict: "usuario_id,jogo_id" }
    )
    .select();

  if (error) {
    console.error("❌ Erro ao salvar palpite:", error.message);
  } else {
    console.log("✅ Palpite salvo com sucesso!", data);
  }
}

run().catch(console.error);
