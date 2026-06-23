require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function run() {
  const wallefId = "0c83da0e-ea3a-4566-a949-be08a316db85"; // Wallef
  console.log(`🔍 Buscando palpites do Wallef (ID: ${wallefId}) no banco...`);
  
  // 1. Buscar jogos
  const { data: jogos, error: errJogos } = await supabase
    .from("jogos")
    .select("id, time_a, time_b, data_hora")
    .order("data_hora");

  if (errJogos) {
    console.error("Erro ao buscar jogos:", errJogos);
    return;
  }

  // 2. Buscar palpites de Wallef
  const { data: palpites, error: errPalpites } = await supabase
    .from("palpites")
    .select("jogo_id, palpite_gols_a, palpite_gols_b")
    .eq("usuario_id", wallefId);

  if (errPalpites) {
    console.error("Erro ao buscar palpites:", errPalpites);
    return;
  }

  console.log(`✅ Total de palpites cadastrados para Wallef: ${palpites.length}`);
  
  // Agrupar jogos e palpites por grupo
  const gamesMap = new Map(jogos.map(j => [j.id, j]));
  const groupGuesses = {};

  palpites.forEach(p => {
    const jogo = gamesMap.get(p.jogo_id);
    if (!jogo) return;
    
    // Determinar o grupo com base nas seleções ou ordenar por data
    // Vamos apenas imprimir a lista ordenada por data
    const date = new Date(jogo.data_hora);
    const options = { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" };
    const dateStr = date.toLocaleString("pt-BR", options);
    
    console.log(`- Jogo #${jogo.id} (${dateStr}): ${jogo.time_a} ${p.palpite_gols_a} x ${p.palpite_gols_b} ${jogo.time_b}`);
  });
}

run();
