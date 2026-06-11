require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ═══════════════════════════════════════════════════════════════════════════════
// ANÁLISE TÉCNICA — Copa do Mundo FIFA 2026
// Critérios avaliados por jogo:
//   - Ranking FIFA (março 2025)
//   - Qualidade do elenco (jogadores top, ligas de alto nível)
//   - Histórico de confrontos diretos (H2H)
//   - Estilo de jogo (posse, pressão alta, contra-ataque)
//   - Momentum atual (forma recente - últimos 5 jogos)
//   - Força ofensiva vs defensiva
//   - Contexto da Copa (pressão, sede, torcida)
//   - Cansaço físico e viagens
// ═══════════════════════════════════════════════════════════════════════════════

const PALPITES = [
  // Jornada 1
  // 291 - República da Coreia (FIFA #22) vs República Tcheca (FIFA #37)
  // Coreia: Son Heung-min liderando, muito rápida. Tcheca: schick é perigoso mas menos conjunto
  // Tendência: empate técnico, Coreia leve favorita em casa americano-canadense
  { jogo_id: 291, a: 1, b: 1 },

  // 292 - Canadá (FIFA #41) vs Bósnia e Herzegovina (FIFA #64)
  // Canadá: Davies, David, Osorio. Sede = enorme motivação. Bósnia inferior.
  { jogo_id: 292, a: 2, b: 0 },

  // 293 - Estados Unidos (FIFA #14) vs Paraguai (FIFA #68)
  // EUA: Pulisic, Reyna, Turner. Sede com torcida. Paraguai limitado ofensivamente.
  { jogo_id: 293, a: 2, b: 0 },

  // 294 - Catar (FIFA #58) vs Suíça (FIFA #18)
  // Suíça: experiente, Xhaka, Seferovic. Catar fraco fora de casa (mostrado no Qatar 2022).
  { jogo_id: 294, a: 0, b: 2 },

  // 295 - Brasil (FIFA #5) vs Marrocos (FIFA #13)
  // Brasil: Vinicius Jr, Rodrygo, Militão. Forma incrível. Marrocos defensivo mas World-class.
  // Brasil vence mas Marrocos resiste bem
  { jogo_id: 295, a: 2, b: 1 },

  // 296 - Haiti (FIFA #82) vs Escócia (FIFA #35)
  // Escócia: Robertson, McGinn. Muito superior. Haiti é a maior azarona do grupo.
  { jogo_id: 296, a: 0, b: 3 },

  // 297 - Austrália (FIFA #22) vs Turquia (FIFA #27)
  // Turquia: Calhanoglu, Güler. Melhor conjunto. Austrália depende de Leckie e Irvine.
  { jogo_id: 297, a: 1, b: 2 },

  // 298 - Alemanha (FIFA #12) vs Curaçau (FIFA #79)
  // Alemanha: enorme diferença de nível. Kimmich, Musiala, Havertz. Goleada esperada.
  { jogo_id: 298, a: 4, b: 0 },

  // 299 - Holanda (FIFA #6) vs Japão (FIFA #16)
  // Japão: surpreendente, veloz, disciplinado. Holanda: Van Dijk, Gakpo. Empate técnico mas Holanda vence.
  { jogo_id: 299, a: 2, b: 1 },

  // 300 - Costa do Marfim (FIFA #48) vs Equador (FIFA #31)
  // Equador: Valencia, Plata. Mais sólido. Costa do Marfim inconstante.
  { jogo_id: 300, a: 1, b: 2 },

  // 301 - Suécia (FIFA #19) vs Tunísia (FIFA #40)
  // Suécia: Isak, Kulusevski. Tecnicamente superior. Tunísia é bem organizada mas ofensivamente fraca.
  { jogo_id: 301, a: 2, b: 0 },

  // 302 - Espanha (FIFA #3) vs Cabo Verde (FIFA #78)
  // Espanha: Yamal, Pedri, Morata. Nível astronômico. Goleada certa.
  { jogo_id: 302, a: 4, b: 0 },

  // 303 - Bélgica (FIFA #4) vs Egito (FIFA #36)
  // Bélgica: De Bruyne, Lukaku, Tielemans. Egito defensivo mas inferior. Bélgica domina.
  { jogo_id: 303, a: 3, b: 0 },

  // 304 - Arábia Saudita (FIFA #53) vs Uruguai (FIFA #17)
  // Uruguai: Núñez, Valverde, Araújo. Experiente. Arábia Saudita surpreendeu mas Uruguai é classe acima.
  { jogo_id: 304, a: 0, b: 2 },

  // 305 - Irã (FIFA #21) vs Nova Zelândia (FIFA #90)
  // Enorme diferença de nível. Irã: Taremi. Nova Zelândia com poucos recursos.
  { jogo_id: 305, a: 3, b: 0 },

  // 306 - França (FIFA #2) vs Senegal (FIFA #20)
  // Senegal: Mané, Diatta. Perigoso. França: Mbappé, Griezmann. Clássico África vs Europa. França vence.
  { jogo_id: 306, a: 2, b: 1 },

  // 307 - Iraque (FIFA #63) vs Noruega (FIFA #25)
  // Noruega: Haaland! Máquina de gols. Iraque limitado. Noruega deveria golear.
  { jogo_id: 307, a: 0, b: 3 },

  // 308 - Argentina (FIFA #1) vs Argélia (FIFA #42)
  // Argentina: Messi, Di María, Martínez. Campeã do mundo. Argélia não tem chance.
  { jogo_id: 308, a: 3, b: 0 },

  // 309 - Áustria (FIFA #26) vs Jordânia (FIFA #87)
  // Áustria: Sabitzer, Alaba. Jordânia sem grandes nomes. Áustria domina.
  { jogo_id: 309, a: 3, b: 0 },

  // 310 - Portugal (FIFA #7) vs Rep. Democrática do Congo (FIFA #60)
  // Portugal: Cristiano Ronaldo (mesmo com 40+ anos), Bruno Fernandes, Leão. Vitória tranquila.
  { jogo_id: 310, a: 3, b: 0 },

  // 311 - Inglaterra (FIFA #5) vs Croácia (FIFA #10)
  // H2H: Croácia venceu em 2018 (WC). Inglaterra: Kane, Bellingham. Revanche com vitória.
  { jogo_id: 311, a: 2, b: 1 },

  // 312 - Gana (FIFA #60) vs Panamá (FIFA #80)
  // Gana: Kudus, Ayew. Levemente favorita. Panamá defensivo mas inferior.
  { jogo_id: 312, a: 2, b: 0 },

  // 313 - Uzbequistão (FIFA #71) vs Colômbia (FIFA #23)
  // Colômbia: Díaz, Vidal, Falcão (se disponível). Muito superior. Uzbequistão estreante.
  { jogo_id: 313, a: 0, b: 3 },

  // Jornada 2
  // 314 - República Tcheca (FIFA #37) vs África do Sul (FIFA #54)
  // República Tcheca superior. África do Sul organizada mas inferior.
  { jogo_id: 314, a: 2, b: 0 },

  // 315 - Suíça (FIFA #18) vs Bósnia e Herzegovina (FIFA #64)
  // Suíça claramente superior. Xhaka, Embolo, Seferovic.
  { jogo_id: 315, a: 2, b: 0 },

  // 316 - Canadá (FIFA #41) vs Catar (FIFA #58)
  // Canadá em casa. Davies motivadíssimo. Catar sem forças fora da Ásia.
  { jogo_id: 316, a: 2, b: 0 },

  // 317 - México (FIFA #15) vs República da Coreia (FIFA #22)
  // Equilíbrio técnico. México em casa. H2H favorece México. Empate possível mas México vence.
  { jogo_id: 317, a: 2, b: 1 },

  // 318 - Estados Unidos (FIFA #14) vs Austrália (FIFA #22)
  // EUA em casa. Pulisic vs Leckie. EUA leva vantagem de sede.
  { jogo_id: 318, a: 2, b: 1 },

  // 319 - Escócia (FIFA #35) vs Marrocos (FIFA #13)
  // Marrocos: Hakimi, Ziyech, Boufal. Semifinalista em 2022. Favorito claro.
  { jogo_id: 319, a: 0, b: 2 },

  // 320 - Brasil (FIFA #5) vs Haiti (FIFA #82)
  // Diferença absurda. Brasil deve golear.
  { jogo_id: 320, a: 4, b: 0 },

  // 321 - Turquia (FIFA #27) vs Paraguai (FIFA #68)
  // Turquia: Güler, Calhanoglu. Paraguai inferior. Turquia vence.
  { jogo_id: 321, a: 2, b: 0 },

  // 322 - Holanda (FIFA #6) vs Suécia (FIFA #19)
  // Clássico europeu. Holanda favorita. Van Dijk, Gakpo, De Jong vs Isak, Kulusevski.
  { jogo_id: 322, a: 2, b: 1 },

  // 323 - Alemanha (FIFA #12) vs Costa do Marfim (FIFA #48)
  // Alemanha muito superior. Hummels, Musiala, Havertz. Costa do Marfim não resiste.
  { jogo_id: 323, a: 3, b: 0 },

  // 324 - Equador (FIFA #31) vs Curaçau (FIFA #79)
  // Equador superior. Valencia + Plata vs time fraco de Curaçau.
  { jogo_id: 324, a: 3, b: 0 },

  // 325 - Tunísia (FIFA #40) vs Japão (FIFA #16)
  // Japão: velocidade e tática fabulosa. Doan, Kubo, Minamino. Favoritão aqui.
  { jogo_id: 325, a: 0, b: 2 },

  // 326 - Espanha (FIFA #3) vs Arábia Saudita (FIFA #53)
  // Espanha massacra. Melhor fases de grupos da história recente.
  { jogo_id: 326, a: 3, b: 0 },

  // 327 - Bélgica (FIFA #4) vs Irã (FIFA #21)
  // Bélgica superior mas Irã é organizado. De Bruyne decide.
  { jogo_id: 327, a: 2, b: 0 },

  // 328 - Uruguai (FIFA #17) vs Cabo Verde (FIFA #78)
  // Uruguai tranquilo. Cabo Verde com pouca estrutura. Goleada.
  { jogo_id: 328, a: 3, b: 0 },

  // 329 - Nova Zelândia (FIFA #90) vs Egito (FIFA #36)
  // Egito: Salah! Enorme diferença de estrelas. Egito vence.
  { jogo_id: 329, a: 0, b: 2 },

  // 330 - Argentina (FIFA #1) vs Áustria (FIFA #26)
  // Argentina domina. Messi + Di María + Martínez. Vitória confortável.
  { jogo_id: 330, a: 3, b: 0 },

  // 331 - França (FIFA #2) vs Iraque (FIFA #63)
  // Mbappé vs defesa do Iraque? Vai ser difícil para o Iraque segurar.
  { jogo_id: 331, a: 4, b: 0 },

  // 332 - Noruega (FIFA #25) vs Senegal (FIFA #20)
  // Jogo equilibrado. Haaland vs Mané. Senegal sólido. Empate técnico mas Noruega leva.
  { jogo_id: 332, a: 2, b: 1 },

  // 333 - Jordânia (FIFA #87) vs Argélia (FIFA #42)
  // Argélia melhor. Jordânia muito limitada.
  { jogo_id: 333, a: 0, b: 2 },

  // 334 - Portugal (FIFA #7) vs Uzbequistão (FIFA #71)
  // Portugal goleando. Bruno, Félix, Leão. Uzbequistão zerado ofensivamente vs essa defesa.
  { jogo_id: 334, a: 4, b: 0 },

  // 335 - Inglaterra (FIFA #5) vs Gana (FIFA #60)
  // Kane, Bellingham, Saka vs Kudus, Ayew. Inglaterra dominante.
  { jogo_id: 335, a: 3, b: 0 },

  // 336 - Panamá (FIFA #80) vs Croácia (FIFA #10)
  // Croácia: Modrić, Kovačić. Experiente. Panamá muito inferior.
  { jogo_id: 336, a: 0, b: 3 },

  // 337 - Colômbia (FIFA #23) vs Rep. Democrática do Congo (FIFA #60)
  // Colômbia muito superior. Díaz, James Rodríguez possível.
  { jogo_id: 337, a: 3, b: 0 },

  // Jornada 3
  // 338 - Suíça (FIFA #18) vs Canadá (FIFA #41)
  // Suíça: Xhaka, Embolo. Canadá também forte. Jogo de classificação. Suíça vence.
  { jogo_id: 338, a: 2, b: 1 },

  // 339 - Bósnia e Herzegovina (FIFA #64) vs Catar (FIFA #58)
  // Dois eliminados provavelmente. Bósnia levemente melhor.
  { jogo_id: 339, a: 1, b: 1 },

  // 340 - Escócia (FIFA #35) vs Brasil (FIFA #5)
  // Brasil precisa passar. Vinicius explode. Goleada.
  { jogo_id: 340, a: 0, b: 3 },

  // 341 - Marrocos (FIFA #13) vs Haiti (FIFA #82)
  // Marrocos goleando. Haiti sem nada a fazer.
  { jogo_id: 341, a: 3, b: 0 },

  // 342 - República Tcheca (FIFA #37) vs México (FIFA #15)
  // México superior. Lozano, Jiménez, Herrera. Tcheca pode surpreender mas México leva.
  { jogo_id: 342, a: 1, b: 2 },

  // 343 - África do Sul (FIFA #54) vs República da Coreia (FIFA #22)
  // Coreia: Son vivo. África do Sul competitiva mas inferior.
  { jogo_id: 343, a: 1, b: 2 },

  // 344 - Equador (FIFA #31) vs Alemanha (FIFA #12)
  // Alemanha claramente superior mas Equador resistente. Alemanha vence.
  { jogo_id: 344, a: 1, b: 3 },

  // 345 - Curaçau (FIFA #79) vs Costa do Marfim (FIFA #48)
  // Costa do Marfim: Haller, Zaha. Curaçau sem nada a oferecer.
  { jogo_id: 345, a: 0, b: 2 },

  // 346 - Japão (FIFA #16) vs Suécia (FIFA #19)
  // Jogo de 1º lugar do grupo. Japão em grande forma. Empate técnico. Japão vence.
  { jogo_id: 346, a: 2, b: 1 },

  // 347 - Tunísia (FIFA #40) vs Holanda (FIFA #6)
  // Holanda claramente superior. Gakpo, Van Dijk, De Jong.
  { jogo_id: 347, a: 0, b: 3 },

  // 348 - Turquia (FIFA #27) vs Estados Unidos (FIFA #14)
  // EUA em casa mas Turquia perigosa. Jogo equilibrado. EUA passa.
  { jogo_id: 348, a: 1, b: 2 },

  // 349 - Paraguai (FIFA #68) vs Austrália (FIFA #22)
  // Austrália superior. Leckie, Irvine. Paraguai resistente mas Austrália vence.
  { jogo_id: 349, a: 0, b: 2 },

  // 350 - Noruega (FIFA #25) vs França (FIFA #2)
  // Haaland vs Mbappé! Jogo do grupo. França favorita mas Haaland pode ser decisivo.
  { jogo_id: 350, a: 1, b: 2 },

  // 351 - Senegal (FIFA #20) vs Iraque (FIFA #63)
  // Senegal: Mané, Diatta. Iraque muito inferior.
  { jogo_id: 351, a: 3, b: 0 },

  // 352 - Uruguai (FIFA #17) vs Espanha (FIFA #3)
  // Clássico. Espanha favorita mas Uruguai nunca entrega fácil. Núñez, Valverde vs Yamal, Pedri.
  { jogo_id: 352, a: 1, b: 2 },

  // 353 - Cabo Verde (FIFA #78) vs Arábia Saudita (FIFA #53)
  // Arábia Saudita melhor. Sorte de quem passa do grupo. Arábia Saudita leva.
  { jogo_id: 353, a: 0, b: 1 },

  // 354 - Egito (FIFA #36) vs Irã (FIFA #21)
  // Equilíbrio. Irã levemente melhor pela organização e Taremi. Empate possível mas Irã leva.
  { jogo_id: 354, a: 1, b: 2 },

  // 355 - Nova Zelândia (FIFA #90) vs Bélgica (FIFA #4)
  // Bélgica goleando. De Bruyne, Lukaku, Tielemans. Nova Zelândia não tem elenco para parar isso.
  { jogo_id: 355, a: 0, b: 3 },

  // 356 - Panamá (FIFA #80) vs Inglaterra (FIFA #5)
  // Inglaterra goleando. Kane, Bellingham, Saka. Panamá já eliminado.
  { jogo_id: 356, a: 0, b: 3 },

  // 357 - Croácia (FIFA #10) vs Gana (FIFA #60)
  // Croácia: Modrić liderando. Gana inferior.
  { jogo_id: 357, a: 2, b: 0 },

  // 358 - Colômbia (FIFA #23) vs Portugal (FIFA #7)
  // Jogo difícil. Colômbia surpreendente. Portugal experiente. Empate possível, Portugal leva.
  { jogo_id: 358, a: 1, b: 2 },

  // 359 - Rep. Democrática do Congo (FIFA #60) vs Uzbequistão (FIFA #71)
  // Relativamente próximos. Congo tem mais talento individual. Congo vence.
  { jogo_id: 359, a: 2, b: 0 },

  // 360 - Argélia (FIFA #42) vs Áustria (FIFA #26)
  // Áustria superior. Sabitzer, Alaba. Argélia criativa mas inferior.
  { jogo_id: 360, a: 1, b: 2 },

  // 361 - Jordânia (FIFA #87) vs Argentina (FIFA #1)
  // Argentina massacra. Messi em sua última Copa. Motivação máxima.
  { jogo_id: 361, a: 0, b: 4 },
];

async function registrarPalpites() {
  const ISAAC_ID = "fd57a176-2b1d-4a9d-a133-b7f7f4f8e0dd";

  console.log(`\n🏆 REGISTRANDO PALPITES DO ISAAC — Copa do Mundo 2026\n`);
  console.log(`📊 Total de palpites a registrar: ${PALPITES.length}\n`);

  let sucesso = 0, falha = 0;
  const erros = [];

  for (const p of PALPITES) {
    const { data, error } = await supabase
      .from("palpites")
      .upsert(
        {
          usuario_id: ISAAC_ID,
          jogo_id: p.jogo_id,
          palpite_gols_a: p.a,
          palpite_gols_b: p.b,
        },
        { onConflict: "usuario_id,jogo_id" }
      )
      .select()
      .single();

    if (error) {
      falha++;
      erros.push(`Jogo ${p.jogo_id}: ${error.message}`);
      process.stdout.write("✗");
    } else {
      sucesso++;
      process.stdout.write("✓");
    }
  }

  console.log(`\n\n✅ Sucesso: ${sucesso} palpites`);
  if (falha > 0) {
    console.log(`❌ Falhas: ${falha}`);
    erros.forEach(e => console.log("  •", e));
  }

  // Verificação final
  const { data: total } = await supabase
    .from("palpites")
    .select("jogo_id", { count: "exact" })
    .eq("usuario_id", ISAAC_ID);

  console.log(`\n🎯 Total de palpites do Isaac no banco: ${total?.length || 0}`);
  console.log(`\n🏁 Análise e registro concluídos!\n`);
}

registrarPalpites().catch(console.error);
