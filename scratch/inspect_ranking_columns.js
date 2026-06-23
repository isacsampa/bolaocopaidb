require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from("ranking_geral")
    .select("*")
    .limit(1);

  if (error) {
    console.error("❌ Erro ao buscar ranking_geral:", error.message);
  } else {
    console.log("✅ Colunas de ranking_geral:", Object.keys(data[0] || {}));
    console.log("Amostra de dados:", data[0]);
  }
}

run().catch(console.error);
