require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Guesses from the Google Sheet for all 72 matches (chronological or grouped order, mapped by team names)
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
  { time_a: "Marrocos", time_b: "Escócia", a: 3, b: 0 },

  // Grupo D
  { time_a: "Estados Unidos", time_b: "Paraguai", a: 2, b: 0 },
  { time_a: "Austrália", time_b: "Turquia", a: 1, b: 2 },
  { time_a: "Turquia", time_b: "Paraguai", a: 2, b: 0 },
  { time_a: "Estados Unidos", time_b: "Austrália", a: 1, b: 0 },
  { time_a: "Turquia", time_b: "Estados Unidos", a: 1, b: 0 },
  { time_a: "Paraguai", time_b: "Austrália", a: 1, b: 1 },

  // Grupo E
  { time_a: "Alemanha", time_b: "Curaçau", a: 4, b: 0 },
  { time_a: "Costa do Marfim", time_b: "Equador", a: 1, b: 1 },
  { time_a: "Alemanha", time_b: "Costa do Marfim", a: 2, b: 0 },
  { time_a: "Equador", time_b: "Curaçau", a: 3, b: 0 },
  { time_a: "Equador", time_b: "Alemanha", a: 0, b: 2 },
  { time_a: "Curaçau", time_b: "Costa do Marfim", a: 0, b: 2 },

  // Grupo F
  { time_a: "Holanda", time_b: "Japão", a: 2, b: 1 },
  { time_a: "Suécia", time_b: "Tunísia", a: 2, b: 0 },
  { time_a: "Holanda", time_b: "Suécia", a: 2, b: 0 },
  { time_a: "Japão", time_b: "Tunísia", a: 1, b: 1 }, // Wait, check this row later
  { time_a: "Japão", time_b: "Suécia", a: 2, b: 0 }, // Wait, check this row later
  { time_a: "Tunísia", time_b: "Holanda", a: 1, b: 1 },

  // Grupo G
  { time_a: "Bélgica", time_b: "Irã", a: 2, b: 0 },
  { time_a: "Egito", time_b: "Nova Zelândia", a: 1, b: 1 },
  { time_a: "Bélgica", time_b: "Nova Zelândia", a: 2, b: 1 },
  { time_a: "Egito", time_b: "Irã", a: 1, b: 1 },
  { time_a: "Bélgica", time_b: "Egito", a: 2, b: 0 },
  { time_a: "Irã", time_b: "Nova Zelândia", a: 2, b: 0 },

  // Grupo H
  { time_a: "Espanha", time_b: "Cabo Verde", a: 4, b: 0 },
  { time_a: "Arábia Saudita", time_b: "Uruguai", a: 0, b: 2 },
  { time_a: "Espanha", time_b: "Uruguai", a: 2, b: 1 },
  { time_a: "Cabo Verde", time_b: "Arábia Saudita", a: 0, b: 2 },
  { time_a: "Espanha", time_b: "Arábia Saudita", a: 2, b: 1 },
  { time_a: "Uruguai", time_b: "Cabo Verde", a: 0, b: 0 },

  // Grupo I
  { time_a: "França", time_b: "Senegal", a: 2, b: 1 },
  { time_a: "Iraque", time_b: "Noruega", a: 0, b: 2 },
  { time_a: "França", time_b: "Iraque", a: 2, b: 0 },
  { time_a: "Senegal", time_b: "Noruega", a: 1, b: 1 },
  { time_a: "França", time_b: "Noruega", a: 2, b: 0 },
  { time_a: "Senegal", time_b: "Iraque", a: 1, b: 1 },

  // Grupo J
  { time_a: "Argentina", time_b: "Argélia", a: 2, b: 0 },
  { time_a: "Áustria", time_b: "Jordânia", a: 0, b: 2 },
  { time_a: "Argentina", time_b: "Jordânia", a: 2, b: 1 },
  { time_a: "Argélia", time_b: "Áustria", a: 1, b: 1 },
  { time_a: "Argentina", time_b: "Áustria", a: 3, b: 0 },
  { time_a: "Jordânia", time_b: "Argélia", a: 1, b: 2 },

  // Grupo K
  { time_a: "Portugal", time_b: "Rep. Democrática do Congo", a: 3, b: 0 },
  { time_a: "Uzbequistão", time_b: "Colômbia", a: 0, b: 2 },
  { time_a: "Portugal", time_b: "Colômbia", a: 2, b: 1 },
  { time_a: "Rep. Democrática do Congo", time_b: "Uzbequistão", a: 0, b: 2 },
  { time_a: "Portugal", time_b: "Uzbequistão", a: 1, b: 1 },
  { time_a: "Colômbia", time_b: "Rep. Democrática do Congo", a: 0, b: 0 },

  // Grupo L
  { time_a: "Inglaterra", time_b: "Croácia", a: 1, b: 1 },
  { time_a: "Gana", time_b: "Panamá", a: 1, b: 0 },
  { time_a: "Inglaterra", time_b: "Gana", a: 2, b: 0 },
  { time_a: "Croácia", time_b: "Panamá", a: 1, b: 0 },
  { time_a: "Inglaterra", time_b: "Panamá", a: 3, b: 0 },
  { time_a: "Croácia", time_b: "Gana", a: 2, b: 1 }
];

async function run() {
  const wallefId = "0c83da0e-ea3a-4566-a949-be08a316db85"; // Wallef

  // 1. Buscar todos os jogos do banco
  const { data: jogos, error: errJogos } = await supabase
    .from("jogos")
    .select("id, time_a, time_b");

  if (errJogos) {
    console.error(errJogos);
    return;
  }

  // 2. Buscar palpites atuais do Wallef no banco
  const { data: palpites, error: errPalpites } = await supabase
    .from("palpites")
    .select("jogo_id, palpite_gols_a, palpite_gols_b")
    .eq("usuario_id", wallefId);

  if (errPalpites) {
    console.error(errPalpites);
    return;
  }

  console.log(`=== ANÁLISE DE DIVERGÊNCIAS (WALLEF) ===`);
  let totalMatch = 0;
  let totalMismatch = 0;
  const discrepancies = [];

  SHEET_GUESSES.forEach((sheetBet, idx) => {
    // Achar jogo correspondente no banco
    const dbGame = jogos.find(g => 
      (g.time_a.trim() === sheetBet.time_a.trim() && g.time_b.trim() === sheetBet.time_b.trim()) ||
      (g.time_a.trim() === sheetBet.time_b.trim() && g.time_b.trim() === sheetBet.time_a.trim())
    );

    if (!dbGame) {
      console.log(`⚠️ Não encontrou jogo no banco: ${sheetBet.time_a} x ${sheetBet.time_b}`);
      return;
    }

    const isReversed = dbGame.time_a.trim() === sheetBet.time_b.trim();
    const targetA = isReversed ? sheetBet.b : sheetBet.a;
    const targetB = isReversed ? sheetBet.a : sheetBet.b;

    const dbBet = palpites.find(p => p.jogo_id === dbGame.id);

    if (dbBet) {
      const match = dbBet.palpite_gols_a === targetA && dbBet.palpite_gols_b === targetB;
      if (match) {
        totalMatch++;
      } else {
        totalMismatch++;
        discrepancies.push({
          jogo_id: dbGame.id,
          confronto: `${dbGame.time_a} vs ${dbGame.time_b}`,
          planilha: `${targetA} x ${targetB}`,
          banco: `${dbBet.palpite_gols_a} x ${dbBet.palpite_gols_b}`
        });
      }
    } else {
      totalMismatch++;
      discrepancies.push({
        jogo_id: dbGame.id,
        confronto: `${dbGame.time_a} vs ${dbGame.time_b}`,
        planilha: `${targetA} x ${targetB}`,
        banco: "Sem palpite"
      });
    }
  });

  console.log(`\nResumo:`);
  console.log(`  • Palpites que já batem: ${totalMatch}`);
  console.log(`  • Palpites divergentes:  ${totalMismatch}`);

  console.log(`\nDetalhes das Divergências:`);
  discrepancies.forEach((d, i) => {
    console.log(`${i+1}. Jogo #${d.jogo_id} (${d.confronto}): Planilha [${d.planilha}] vs Banco [${d.banco}]`);
  });
}

run();
