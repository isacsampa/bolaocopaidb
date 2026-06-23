require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function run() {
  console.log("🔍 Buscando perfis no banco...");
  
  // 1. Buscar na tabela perfis
  const { data: perfis, error: err1 } = await supabase
    .from("perfis")
    .select("id, nome");

  if (err1) {
    console.error("Erro ao buscar perfis:", err1);
    return;
  }

  console.log("Perfis cadastrados:");
  perfis.forEach(p => {
    console.log(`- ID: ${p.id} | Nome: "${p.nome}"`);
  });

  // 2. Buscar usuários no auth.users (usando API admin)
  console.log("\n🔍 Buscando usuários no Auth do Supabase...");
  const { data: { users }, error: err2 } = await supabase.auth.admin.listUsers();
  
  if (err2) {
    console.error("Erro ao listar usuários do Auth:", err2);
    return;
  }

  console.log("Usuários no Auth:");
  users.forEach(u => {
    console.log(`- ID: ${u.id} | Email: ${u.email} | Nome no metadata: "${u.user_metadata?.nome || ''}"`);
  });
}

run();
