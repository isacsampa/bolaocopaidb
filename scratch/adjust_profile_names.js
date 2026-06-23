require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

function capitalizeName(name) {
  if (!name || typeof name !== 'string') return name;
  const trimmed = name.trim();
  
  // Lista de conectores comuns em português que devem ficar minúsculos
  const conectores = ["de", "do", "da", "dos", "das", "e"];
  
  return trimmed.split(/\s+/).map((word, idx) => {
    // Mantém conectores em minúsculo, exceto se for a primeira palavra
    if (idx > 0 && conectores.includes(word.toLowerCase())) {
      return word.toLowerCase();
    }
    // Capitaliza a palavra
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(" ");
}

async function adjustNames() {
  console.log("🔍 Buscando todos os perfis no banco...");
  const { data: perfis, error: fetchError } = await supabase
    .from("perfis")
    .select("id, nome");

  if (fetchError) {
    console.error("Erro ao buscar perfis:", fetchError.message);
    return;
  }

  console.log(`📋 Total de perfis encontrados: ${perfis.length}\n`);

  for (const perfil of perfis) {
    let novoNome = perfil.nome;
    let modificado = false;

    // 1. Substituições específicas
    if (perfil.nome === "JP") {
      novoNome = "João Pedro";
      modificado = true;
    } else if (perfil.nome === "jacks") {
      novoNome = "Jackslanio";
      modificado = true;
    } else if (perfil.nome === "Borges Neto") {
      novoNome = "Raimundo Borges";
      modificado = true;
    }

    // 2. Aplica capitalização geral e compara
    if (!modificado) {
      novoNome = capitalizeName(perfil.nome);
      if (novoNome !== perfil.nome) {
        modificado = true;
      }
    }

    // Se houve modificação, atualiza no banco
    if (modificado) {
      console.log(`✏️ Atualizando: "${perfil.nome}" -> "${novoNome}"`);
      const { error: updateError } = await supabase
        .from("perfis")
        .update({ nome: novoNome })
        .eq("id", perfil.id);

      if (updateError) {
        console.error(`  ❌ Erro ao atualizar ID ${perfil.id}:`, updateError.message);
      } else {
        console.log(`  ✅ Atualizado com sucesso!`);
      }
    } else {
      console.log(`  • Sem alterações necessárias para: "${perfil.nome}"`);
    }
  }

  console.log("\n🏁 Processo de ajuste de nomes concluído!");
}

adjustNames().catch(console.error);
