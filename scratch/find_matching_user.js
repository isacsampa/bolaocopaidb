require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Guesses from the sheet for Groups A, B, C
const SHEET_GUESSES = [
  // Grupo A
  { time_a: "México", time_b: "África do Sul", a: 2, b: 0 },
  { time_a: "República da Coreia", time_b: "República Tcheca", a: 1, b: 1 },
  { time_a: "República Tcheca", time_b: "África do Sul", a: 2, b: 1 },
  { time_a: "México", time_b: "República da Coreia", a: 1, b: 1 },
  { time_a: "República Tcheca", time_b: "México", a: 2, b: 1 },
  { time_a: "África do Sul", time_b: "República da Coreia", a: 0, b: 1 },
  // Grupo B
  { time_a: "Canadá", time_b: "Bósnia e Herzegovina", a: 2, b: 1 },
  { time_a: "Catar", time_b: "Suíça", a: 0, b: 2 },
  { time_a: "Suíça", time_b: "Bósnia e Herzegovina", a: 2, b: 1 },
  { time_a: "Canadá", time_b: "Catar", a: 0, b: 0 },
  { time_a: "Suíça", time_b: "Canadá", a: 2, b: 1 },
  { time_a: "Bósnia e Herzegovina", time_b: "Catar", a: 1, b: 0 },
  // Grupo C
  { time_a: "Brasil", time_b: "Marrocos", a: 2, b: 1 },
  { time_a: "Haiti", time_b: "Escócia", a: 0, b: 2 },
  { time_a: "Brasil", time_b: "Escócia", a: 3, b: 0 },
  { time_a: "Marrocos", time_b: "Haiti", a: 2, b: 1 },
  { time_a: "Brasil", time_b: "Haiti", a: 3, b: 0 },
  { time_a: "Marrocos", time_b: "Escócia", a: 3, b: 0 }
];

async function run() {
  console.log("🔍 Buscando dados do banco...");

  // 1. Buscar jogos
  const { data: jogos, error: errJogos } = await supabase
    .from("jogos")
    .select("id, time_a, time_b");

  if (errJogos) {
    console.error(errJogos);
    return;
  }

  // Mapear jogos por times
  const getGameId = (timeA, timeB) => {
    const game = jogos.find(g => 
      (g.time_a.trim() === timeA.trim() && g.time_b.trim() === timeB.trim()) ||
      (g.time_a.trim() === timeB.trim() && g.time_b.trim() === timeA.trim())
    );
    return game ? game.id : null;
  };

  const sheetBetsWithGameIds = SHEET_GUESSES.map(bet => {
    const gameId = getGameId(bet.time_a, bet.time_b);
    return { ...bet, game_id: gameId };
  }).filter(b => b.game_id !== null);

  // 2. Buscar usuários
  const { data: perfis, error: errPerfis } = await supabase
    .from("perfis")
    .select("id, nome");

  if (errPerfis) {
    console.error(errPerfis);
    return;
  }

  // 3. Para cada usuário, calcular a correspondência
  console.log("\n📊 Comparando palpites dos usuários com a planilha (Grupos A, B, C):");
  
  for (const perfil of perfis) {
    const { data: palpites } = await supabase
      .from("palpites")
      .select("jogo_id, palpite_gols_a, palpite_gols_b")
      .eq("usuario_id", perfil.id);

    let matchesCount = 0;
    let totalCompared = 0;
    const mismatches = [];

    sheetBetsWithGameIds.forEach(sheetBet => {
      const dbBet = palpites.find(p => p.jogo_id === sheetBet.game_id);
      if (dbBet) {
        totalCompared++;
        // Verificar se os placares batem
        // Nota: se o jogo no banco estiver invertido em relação à planilha, precisamos alinhar os gols
        const dbGame = jogos.find(g => g.id === sheetBet.game_id);
        const isReversed = dbGame.time_a.trim() === sheetBet.time_b.trim();
        const targetA = isReversed ? sheetBet.b : sheetBet.a;
        const targetB = isReversed ? sheetBet.a : sheetBet.b;

        if (dbBet.palpite_gols_a === targetA && dbBet.palpite_gols_b === targetB) {
          matchesCount++;
        } else {
          mismatches.push({
            confronto: `${sheetBet.time_a} x ${sheetBet.time_b}`,
            planilha: `${sheetBet.a}x${sheetBet.b}`,
            banco: `${isReversed ? dbBet.palpite_gols_b : dbBet.palpite_gols_a}x${isReversed ? dbBet.palpite_gols_a : dbBet.palpite_gols_b}`
          });
        }
      }
    });

    console.log(`👤 ${perfil.nome}: ${matchesCount}/${totalCompared} palpites idênticos (${Math.round((matchesCount/totalCompared)*100)}%)`);
    if (mismatches.length > 0 && perfil.nome.toLowerCase().includes("wallef")) {
      console.log(`   Divergências para Wallef:`);
      mismatches.forEach(m => {
        console.log(`     • ${m.confronto}: Planilha ${m.planilha} vs Banco ${m.banco}`);
      });
    }
  }
}

run();
