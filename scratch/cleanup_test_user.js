require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function run() {
  console.log("🧹 Iniciando limpeza do perfil Rodrigo Boleiro e seus palpites...");

  // 1. Encontrar o ID do Rodrigo Boleiro
  const { data: profile, error: findError } = await supabase
    .from("perfis")
    .select("id")
    .eq("nome", "Rodrigo Boleiro")
    .single();

  if (findError || !profile) {
    console.log("ℹ️ Perfil Rodrigo Boleiro não encontrado ou já deletado.");
    return;
  }

  const uid = profile.id;
  console.log(`👤 Encontrado ID do perfil: ${uid}`);

  // 2. Deletar palpites dele
  const { error: delBetsErr } = await supabase
    .from("palpites")
    .delete()
    .eq("usuario_id", uid);

  if (delBetsErr) {
    console.error("❌ Erro ao deletar palpites:", delBetsErr.message);
  } else {
    console.log("✅ Palpites de teste deletados com sucesso.");
  }

  // 3. Deletar perfil
  const { error: delProfileErr } = await supabase
    .from("perfis")
    .delete()
    .eq("id", uid);

  if (delProfileErr) {
    console.error("❌ Erro ao deletar perfil:", delProfileErr.message);
  } else {
    console.log("✅ Perfil deletado com sucesso.");
  }
}

run().catch(console.error);
