require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  const { error } = await supabase.from("jogos").delete().eq("id", 2);
  if (error) {
    console.error("Erro ao deletar:", error);
  } else {
    console.log("✅ Jogo ID 2 deletado com sucesso!");
  }
}

run();
