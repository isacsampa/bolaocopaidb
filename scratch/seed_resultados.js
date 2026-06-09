/**
 * SEED RESULTS — Insere resultados reais nos primeiros 2 jogos de cada grupo
 * para testar o sistema de pontuação.
 *
 * Execução: node scratch/seed_resultados.js
 *
 * Usa a SUPABASE_KEY do .env para escrever diretamente na tabela `jogos`.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ── Resultados fictícios realistas para os 24 jogos-alvo ──────────────────────
// Formato: { jogo_id, gols_a, gols_b }
// Baseados nos IDs que o seeder identificou (grupos A-L, 2 primeiros jogos cada)
const RESULTADOS = [
  // Grupo A
  { id: 290, gols_a: 2, gols_b: 1 },   // México × África do Sul     → México vence
  { id: 314, gols_a: 0, gols_b: 2 },   // Rep. Tcheca × África do Sul → África do Sul vence

  // Grupo B
  { id: 292, gols_a: 3, gols_b: 1 },   // Canadá × Bósnia             → Canadá vence
  { id: 294, gols_a: 1, gols_b: 1 },   // Catar × Suíça               → Empate

  // Grupo C
  { id: 295, gols_a: 3, gols_b: 0 },   // Brasil × Marrocos           → Brasil vence (3×0)
  { id: 296, gols_a: 1, gols_b: 2 },   // Haiti × Escócia             → Escócia vence

  // Grupo D
  { id: 293, gols_a: 4, gols_b: 0 },   // EUA × Paraguai              → EUA vence
  { id: 297, gols_a: 2, gols_b: 2 },   // Austrália × Turquia         → Empate

  // Grupo E
  { id: 300, gols_a: 1, gols_b: 1 },   // Costa do Marfim × Equador   → Empate
  { id: 323, gols_a: 5, gols_b: 1 },   // Alemanha × Costa do Marfim  → Alemanha vence

  // Grupo F
  { id: 299, gols_a: 3, gols_b: 2 },   // Holanda × Japão             → Holanda vence
  { id: 301, gols_a: 0, gols_b: 0 },   // Suécia × Tunísia            → Empate 0×0

  // Grupo G
  { id: 303, gols_a: 2, gols_b: 0 },   // Bélgica × Egito             → Bélgica vence
  { id: 305, gols_a: 1, gols_b: 3 },   // Irã × Nova Zelândia         → Nova Zelândia vence

  // Grupo H
  { id: 302, gols_a: 4, gols_b: 1 },   // Espanha × Cabo Verde        → Espanha vence
  { id: 304, gols_a: 0, gols_b: 1 },   // Arábia Saudita × Uruguai   → Uruguai vence

  // Grupo I
  { id: 306, gols_a: 2, gols_b: 2 },   // França × Senegal            → Empate
  { id: 307, gols_a: 0, gols_b: 1 },   // Iraque × Noruega            → Noruega vence

  // Grupo J
  { id: 308, gols_a: 3, gols_b: 1 },   // Argentina × Argélia         → Argentina vence
  { id: 309, gols_a: 2, gols_b: 0 },   // Áustria × Jordânia          → Áustria vence

  // Grupo K
  { id: 313, gols_a: 1, gols_b: 2 },   // Uzbequistão × Colômbia      → Colômbia vence
  { id: 334, gols_a: 3, gols_b: 0 },   // Portugal × Uzbequistão      → Portugal vence

  // Grupo L
  { id: 311, gols_a: 2, gols_b: 1 },   // Inglaterra × Croácia        → Inglaterra vence
  { id: 312, gols_a: 1, gols_b: 1 },   // Gana × Panamá               → Empate
];

// ── Pontuação esperada (para validação visual) ────────────────────────────────
// Usamos o endpoint /api/palpites/publicos para buscar os palpites e calcular

function classificarPalpite(palA, palB, realA, realB) {
  if (palA === realA && palB === realB) return { tipo: "EXATO",   pts: 3, icon: "🎯" };
  const predVenc = palA > palB ? "A" : palA < palB ? "B" : "D";
  const realVenc = realA > realB ? "A" : realA < realB ? "B" : "D";
  if (predVenc === realVenc)           return { tipo: "PARCIAL",  pts: 1, icon: "⭐" };
  return                                      { tipo: "ERRO",     pts: 0, icon: "❌" };
}

async function main() {
  console.log("\n⚽ Bolão Copa 2026 — Inserindo Resultados dos Jogos\n");
  console.log("─".repeat(55));

  // 1. Atualizar os resultados na tabela jogos
  console.log("\n📝 Atualizando gols na tabela `jogos`...\n");

  let ok = 0, errs = 0;
  for (const r of RESULTADOS) {
    const { error } = await supabase
      .from("jogos")
      .update({ gols_a: r.gols_a, gols_b: r.gols_b })
      .eq("id", r.id);

    if (error) {
      console.error(`   ❌ Jogo #${r.id}: ${error.message}`);
      errs++;
    } else {
      ok++;
    }
  }
  console.log(`   ✅ ${ok} jogos atualizados | ❌ ${errs} erros\n`);

  if (errs > 0) {
    console.warn("   Alguns jogos não foram atualizados. Verifique os IDs acima.\n");
  }

  // 2. Buscar palpites públicos para calcular pontuação esperada
  console.log("─".repeat(55));
  console.log("\n🔢 Calculando pontuação esperada por participante...\n");

  const { data: palpites, error: palErr } = await supabase
    .from("palpites")
    .select("usuario_id, jogo_id, palpite_gols_a, palpite_gols_b, perfis(nome)")
    .order("usuario_id");

  if (palErr) {
    console.error("Erro ao buscar palpites:", palErr.message);
    process.exit(1);
  }

  // Mapa de resultados
  const resultMap = Object.fromEntries(RESULTADOS.map(r => [r.id, r]));

  // Agrupar por usuário
  const porUsuario = {};
  for (const p of palpites) {
    const uid  = p.usuario_id;
    const nome = p.perfis?.nome || "Desconhecido";
    if (!porUsuario[uid]) porUsuario[uid] = { nome, total: 0, exatos: 0, parciais: 0, erros: 0, pendentes: 0 };

    const resultado = resultMap[p.jogo_id];
    if (!resultado) {
      porUsuario[uid].pendentes++;
      continue;
    }
    const { pts, tipo } = classificarPalpite(
      p.palpite_gols_a, p.palpite_gols_b,
      resultado.gols_a,  resultado.gols_b
    );
    porUsuario[uid].total    += pts;
    if (tipo === "EXATO")   porUsuario[uid].exatos++;
    if (tipo === "PARCIAL") porUsuario[uid].parciais++;
    if (tipo === "ERRO")    porUsuario[uid].erros++;
  }

  // Ordenar por pontuação total
  const ranking = Object.values(porUsuario).sort((a, b) => b.total - a.total);

  console.log("  Pos  Nome                 Pts  🎯Exatos  ⭐Parciais  ❌Erros  ⏳Pend");
  console.log("  " + "─".repeat(65));
  ranking.forEach((u, i) => {
    const pos  = String(i + 1).padStart(3, " ");
    const nome = u.nome.padEnd(20, " ");
    const pts  = String(u.total).padStart(3, " ");
    const ex   = String(u.exatos).padStart(7, " ");
    const pa   = String(u.parciais).padStart(9, " ");
    const er   = String(u.erros).padStart(7, " ");
    const pe   = String(u.pendentes).padStart(6, " ");
    console.log(`  ${pos}  ${nome} ${pts}  ${ex}   ${pa}   ${er}   ${pe}`);
  });

  // 3. Verificar ranking_geral no Supabase (view que o sistema usa)
  console.log("\n" + "─".repeat(55));
  console.log("\n🏆 Ranking Geral via View `ranking_geral` (o que o site usa):\n");

  const { data: rankView, error: rankErr } = await supabase
    .from("ranking_geral")
    .select("nome, pontos_totais")
    .order("pontos_totais", { ascending: false });

  if (rankErr) {
    console.warn("   ⚠️  Não foi possível ler a view ranking_geral:", rankErr.message);
    console.warn("      (Normal se a view ainda não inclui os jogos recém atualizados)\n");
  } else {
    rankView.forEach((r, i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";
      console.log(`   ${medal} ${String(i+1).padStart(2)}. ${r.nome.padEnd(22)} ${r.pontos_totais ?? 0} pts`);
    });
  }

  console.log("\n✅ Pronto! Acesse http://localhost:3000 para ver o ranking atualizado.\n");
}

main().catch(err => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
