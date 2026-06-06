require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function cleanup() {
  try {
    console.log("🔍 Buscando todos os jogos...");
    const { data: games, error: gamesError } = await supabase
      .from("jogos")
      .select("id, time_a, time_b, data_hora");

    if (gamesError) throw gamesError;

    console.log(`Encontrados ${games.length} jogos no total.`);

    // Agrupa os jogos por time_a, time_b e data_hora
    const groups = {};
    games.forEach(j => {
      const key = `${j.time_a.trim()} vs ${j.time_b.trim()} @ ${j.data_hora}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(j.id);
    });

    const toDeleteIds = [];
    const reassignmentMap = {}; // map duplicate_id -> original_id

    for (const [key, ids] of Object.entries(groups)) {
      if (ids.length > 1) {
        // Ordena para garantir que pegamos o menor ID como original
        ids.sort((a, b) => Number(a) - Number(b));
        const originalId = ids[0];
        const duplicates = ids.slice(1);
        
        console.log(`⚠️ Jogo duplicado: "${key}". Original ID: ${originalId}, Duplicados: ${duplicates.join(", ")}`);
        
        duplicates.forEach(dupId => {
          toDeleteIds.push(dupId);
          reassignmentMap[dupId] = originalId;
        });
      }
    }

    if (toDeleteIds.length === 0) {
      console.log("✅ Nenhum jogo duplicado para deletar!");
      return;
    }

    console.log(`\n🔄 Total de IDs duplicados para remover: ${toDeleteIds.length}`);

    // Verifica se existem palpites associados aos IDs duplicados para migrá-los
    console.log("🔍 Verificando se existem palpites associados aos jogos duplicados...");
    const { data: palpites, error: palpitesError } = await supabase
      .from("palpites")
      .select("id, jogo_id, usuario_id, palpite_gols_a, palpite_gols_b");

    if (palpitesError) throw palpitesError;

    let migratedPalpites = 0;
    for (const palpite of palpites) {
      if (reassignmentMap[palpite.jogo_id]) {
        const targetJogoId = reassignmentMap[palpite.jogo_id];
        console.log(`Migrando palpite ID ${palpite.id} do jogo duplicado ${palpite.jogo_id} para o jogo original ${targetJogoId}...`);
        
        // Verifica se o usuário já tem um palpite para o jogo original
        const existingOriginal = palpites.find(p => p.jogo_id === targetJogoId && p.usuario_id === palpite.usuario_id);
        if (existingOriginal) {
          // Se já existe, deleta o palpite do duplicado
          console.log(`  - Usuário já tem palpite no jogo original. Removendo palpite redundante.`);
          await supabase.from("palpites").delete().eq("id", palpite.id);
        } else {
          // Se não existe, atualiza para o ID original
          await supabase.from("palpites").update({ jogo_id: targetJogoId }).eq("id", palpite.id);
          migratedPalpites++;
        }
      }
    }
    console.log(`✅ Migração de palpites finalizada. ${migratedPalpites} palpites movidos.`);

    // Deleta os jogos duplicados em blocos (para evitar limites de URL)
    console.log("🗑️ Deletando jogos duplicados...");
    const chunkSize = 20;
    for (let i = 0; i < toDeleteIds.length; i += chunkSize) {
      const chunk = toDeleteIds.slice(i, i + chunkSize);
      const { error: deleteError } = await supabase
        .from("jogos")
        .delete()
        .in("id", chunk);

      if (deleteError) {
        console.error(`Erro ao deletar lote ${i}:`, deleteError.message);
      } else {
        console.log(`  - Deletado lote de ${chunk.length} jogos.`);
      }
    }

    console.log("🎉 Limpeza concluída com sucesso!");

  } catch (error) {
    console.error("❌ Erro durante a limpeza:", error.message);
  }
}

cleanup();
