require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const FAKE_NAMES = [
  "Rodrigo Boleiro",
  "Fernanda Gol",
  "Carlos Craque",
  "Juliana Campeã",
  "Thiago Torcedor"
];

async function clearTestData() {
  console.log("🧼 Iniciando limpeza completa de dados de teste...");

  try {
    // 1. Buscar perfis correspondentes aos nomes falsos na tabela pública `perfis`
    console.log("🔍 Buscando perfis de teste na tabela `perfis`...");
    const { data: profiles, error: perfisErr } = await supabase
      .from("perfis")
      .select("id, nome")
      .in("nome", FAKE_NAMES);
    
    if (perfisErr) {
      console.error("❌ Erro ao buscar perfis no Supabase:", perfisErr.message);
      return;
    }

    console.log(`   Encontrados ${profiles ? profiles.length : 0} perfis de teste.`);

    if (profiles && profiles.length > 0) {
      const uids = profiles.map(p => p.id);
      
      // Deletar palpites dos usuários de teste
      console.log("🗑️ Deletando palpites dos perfis de teste...");
      const { error: delPalpitesErr } = await supabase
        .from("palpites")
        .delete()
        .in("usuario_id", uids);
      
      if (delPalpitesErr) {
        console.error("❌ Erro ao deletar palpites:", delPalpitesErr.message);
      } else {
        console.log("   ✅ Palpites de teste deletados com sucesso.");
      }

      // Deletar perfis dos usuários de teste
      console.log("🗑️ Deletando registros na tabela `perfis`...");
      const { error: delPerfilErr } = await supabase
        .from("perfis")
        .delete()
        .in("id", uids);
      
      if (delPerfilErr) {
        console.error("❌ Erro ao deletar perfis:", delPerfilErr.message);
      } else {
        console.log("   ✅ Perfis de teste deletados com sucesso.");
      }
    }

    // 2. Resetar placares de jogos (gols_a e gols_b devem voltar a ser NULL)
    console.log("🔄 Resetando todos os placares de jogos para NULL...");
    const { data: games, error: gamesErr } = await supabase
      .from("jogos")
      .select("id, time_a, time_b, gols_a, gols_b");

    if (gamesErr) {
      console.error("❌ Erro ao buscar jogos:", gamesErr.message);
      return;
    }

    let resetCount = 0;
    for (const game of games) {
      if (game.gols_a !== null || game.gols_b !== null) {
        console.log(`   Resetando resultado de #${game.id}: ${game.time_a} vs ${game.time_b} (${game.gols_a} × ${game.gols_b}) -> NULL`);
        const { error: updateErr } = await supabase
          .from("jogos")
          .update({ gols_a: null, gols_b: null })
          .eq("id", game.id);
        
        if (updateErr) {
          console.error(`      ❌ Erro ao resetar jogo #${game.id}:`, updateErr.message);
        } else {
          resetCount++;
        }
      }
    }
    console.log(`   ✅ ${resetCount} placares de jogos foram resetados para NULL.`);

    console.log("🎉 Limpeza de dados de teste finalizada com sucesso!");
  } catch (error) {
    console.error("❌ Ocorreu um erro durante a limpeza:", error.message);
  }
}

clearTestData();
