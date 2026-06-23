require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const RAW_TEXT = `
Grupo A
México 2 x 0 África do Sul
Coreia do Sul 2 x 1 República Tcheca
República Tcheca 1 x 0 África do Sul
México 1 x 1 Coreia do Sul
República Tcheca 1 x 2 México
África do Sul 0 x 2 Coreia do Sul
Grupo B
Canadá 1 x 0 Bósnia
Catar 0 x 2 Suíça
Suíça 1 x 0 Bósnia
Canadá 2 x 1 Catar
Suíça 1 x 0 Canadá
Bósnia 1 x 1 Catar
Grupo C
Brasil 2 x 1 Marrocos
Haiti 0 x 1 Escócia
Brasil 3 x 0 Escócia
Marrocos 2 x 0 Haiti
Brasil 4 x 0 Haiti
Marrocos 3 x 0 Escócia
Grupo D
Estados Unidos 1 x 1 Paraguai
Austrália 1 x 2 Turquia
Paraguai 2 x 2 Austrália
Estados Unidos 1 x 0 Turquia
Estados Unidos 2 x 0 Austrália
Paraguai 1 x 0 Turquia
Grupo E
Alemanha 4 x 0 Curaçao
Costa do Marfim 1 x 1 Equador
Alemanha 2 x 0 Costa do Marfim
Curaçao 0 x 2 Equador
Alemanha 1 x 0 Equador
Curaçao 0 x 3 Costa do Marfim
Grupo F
Holanda 2 x 1 Japão
Suécia 1 x 0 Tunísia
Holanda 2 x 0 Tunísia
Japão 1 x 1 Suécia
Holanda 1 x 0 Suécia
Japão 1 x 1 Tunísia
Grupo G
Bélgica 2 x 1 Irã
Egito 1 x 0 Nova Zelândia
Bélgica 3 x 0 Nova Zelândia
Egito 1 x 1 Irã
Bélgica 2 x 0 Egito
Irã 1 x 0 Nova Zelândia
Grupo H
Espanha 3 x 0 Cabo Verde
Arábia Saudita 0 x 2 Uruguai
Espanha 2 x 0 Uruguai
Cabo Verde 1 x 2 Arábia Saudita
Espanha 3 x 0 Arábia Saudita
Cabo Verde 0 x 2 Uruguai
Grupo I
França 2 x 1 Senegal
Iraque 0 x 3 Noruega
França 4 x 0 Noruega
Senegal 2 x 2 Iraque
França 2 x 1 Iraque
Senegal 3 x 0 Noruega
Grupo J
Argentina 2 x 0 Argélia
Áustria 0 x 1 Jordânia
Argentina 3 x 0 Jordânia
Argélia 1 x 2 Áustria
Argentina 5 x 0 Áustria
Argélia 1 x 2 Jordânia
Grupo K
Portugal 3 x 0 RD Congo
Uzbequistão 0 x 2 Colômbia
Portugal 3 x 0 Colômbia
RD Congo 1 x 1 Uzbequistão
Portugal 2 x 0 Uzbequistão
RD Congo 1 x 1 Colômbia
Grupo L
Inglaterra 1 x 0 Croácia
Gana 1 x 0 Panamá
Inglaterra 2 x 0 Panamá
Croácia 1 x 1 Gana
Inglaterra 3 x 0 Gana
Croácia 2 x 1 Panamá
`;

function normalizeTeamName(name) {
  let normalized = name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/\./g, "") // remove pontos (ex: Rep. -> Rep)
    .replace(/\s+/g, " ")
    .trim();

  // Mapeamentos comuns
  if (normalized === "coreia do sul" || normalized === "republica da coreia" || normalized === "coreia") {
    return "coreia";
  }
  if (normalized === "bosnia" || normalized === "bosnia e herzegovina") {
    return "bosnia";
  }
  if (normalized === "rd congo" || normalized === "rep democratica do congo" || normalized === "republica democratica do congo" || normalized === "congo") {
    return "congo";
  }
  if (normalized === "curacao" || normalized === "curacau") {
    return "curacao";
  }
  if (normalized === "colobiia" || normalized === "colombia") {
    return "colombia";
  }
  return normalized;
}

async function run() {
  // 1. Procurar perfil por anderson
  console.log("🔍 Buscando perfil do Anderson no banco...");
  const { data: perfis, error: perfisError } = await supabase
    .from("perfis")
    .select("id, nome");

  if (perfisError) {
    console.error("Erro ao buscar perfis:", perfisError.message);
    return;
  }

  const anderson = perfis.find(p => p.nome.toLowerCase().includes("anderson"));

  if (!anderson) {
    console.error("❌ Usuário 'Anderson' não encontrado no banco de dados.");
    console.log("Lista de usuários cadastrados:");
    perfis.forEach(p => console.log(` - ID: ${p.id} | Nome: ${p.nome}`));
    return;
  }

  console.log(`✅ Usuário encontrado: ID: ${anderson.id} | Nome: ${anderson.nome}\n`);

  // 2. Buscar jogos
  const { data: jogos, error: jogosError } = await supabase
    .from("jogos")
    .select("id, time_a, time_b");

  if (jogosError) {
    console.error("Erro ao buscar jogos:", jogosError.message);
    return;
  }

  // 3. Processar o texto
  const lines = RAW_TEXT.split("\n");
  const palpitesAProcessar = [];
  const regex = /^(.+?)\s+(\d+)\s*x\s*(\d+)\s+(.+)$/;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("Grupo")) return;

    const match = trimmed.match(regex);
    if (!match) {
      console.log(`⚠️ Linha não reconhecida: "${trimmed}"`);
      return;
    }

    const teamA = match[1].trim();
    const scoreA = parseInt(match[2].trim(), 10);
    const scoreB = parseInt(match[3].trim(), 10);
    const teamB = match[4].trim();

    palpitesAProcessar.push({ teamA, scoreA, scoreB, teamB, raw: trimmed });
  });

  console.log(`\n📋 Total de palpites lidos do texto: ${palpitesAProcessar.length}`);

  // 4. Cruzar com a tabela de jogos
  const listPalpites = [];
  const naoEncontrados = [];

  palpitesAProcessar.forEach(p => {
    const normA = normalizeTeamName(p.teamA);
    const normB = normalizeTeamName(p.teamB);

    let jogoEncontrado = null;
    let ordemInvertida = false;

    for (const j of jogos) {
      const normJogoA = normalizeTeamName(j.time_a);
      const normJogoB = normalizeTeamName(j.time_b);

      if (normJogoA === normA && normJogoB === normB) {
        jogoEncontrado = j;
        ordemInvertida = false;
        break;
      } else if (normJogoA === normB && normJogoB === normA) {
        jogoEncontrado = j;
        ordemInvertida = true;
        break;
      }
    }

    if (jogoEncontrado) {
      listPalpites.push({
        usuario_id: anderson.id,
        jogo_id: jogoEncontrado.id,
        palpite_gols_a: ordemInvertida ? p.scoreB : p.scoreA,
        palpite_gols_b: ordemInvertida ? p.scoreA : p.scoreB,
        time_a: jogoEncontrado.time_a,
        time_b: jogoEncontrado.time_b
      });
    } else {
      naoEncontrados.push(p.raw);
    }
  });

  if (naoEncontrados.length > 0) {
    console.log("\n❌ Não foi possível mapear os seguintes confrontos:");
    naoEncontrados.forEach(ne => console.log(` - ${ne}`));
    return;
  }

  console.log(`\n✅ Sucesso: ${listPalpites.length} de ${palpitesAProcessar.length} jogos mapeados com sucesso.\n`);

  // 5. Inserir no banco
  console.log("💾 Gravando palpites no banco de dados...");
  let cadastrados = 0;
  let falhas = 0;

  for (const palpite of listPalpites) {
    const { error } = await supabase
      .from("palpites")
      .upsert(
        {
          usuario_id: palpite.usuario_id,
          jogo_id: palpite.jogo_id,
          palpite_gols_a: palpite.palpite_gols_a,
          palpite_gols_b: palpite.palpite_gols_b
        },
        { onConflict: "usuario_id,jogo_id" }
      );

    if (error) {
      falhas++;
      console.error(`❌ Erro no jogo ID ${palpite.jogo_id} (${palpite.time_a} x ${palpite.time_b}):`, error.message);
    } else {
      cadastrados++;
    }
  }

  console.log(`\n🏁 Concluído!`);
  console.log(`✅ Palpites gravados: ${cadastrados}`);
  console.log(`❌ Falhas: ${falhas}`);
}

run().catch(console.error);
