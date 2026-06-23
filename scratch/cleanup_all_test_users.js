require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function run() {
  console.log("🧹 Iniciando limpeza de todos os perfis contendo 'Test User'...");

  // 1. Buscar perfis
  const { data: profiles, error: findError } = await supabase
    .from("perfis")
    .select("id, nome")
    .like("nome", "Test User %");

  if (findError) {
    console.error("❌ Erro ao buscar perfis:", findError.message);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log("ℹ️ Nenhum perfil de teste encontrado.");
    return;
  }

  console.log(`👤 Perfis de teste encontrados: ${profiles.length}`);
  const uids = profiles.map(p => p.id);

  // 2. Deletar palpites deles
  const { error: delBetsErr } = await supabase
    .from("palpites")
    .delete()
    .in("usuario_id", uids);

  if (delBetsErr) {
    console.error("❌ Erro ao deletar palpites:", delBetsErr.message);
  } else {
    console.log("✅ Palpites de teste deletados com sucesso.");
  }

  // 3. Deletar perfis
  const { error: delProfilesErr } = await supabase
    .from("perfis")
    .delete()
    .in("id", uids);

  if (delProfilesErr) {
    console.error("❌ Erro ao deletar perfis:", delProfilesErr.message);
  } else {
    console.log("✅ Perfis deletados com sucesso.");
  }
}

run().catch(console.error);
