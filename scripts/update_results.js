/**
 * Script de Atualização Automática de Resultados
 * Esse script busca os resultados reais da Copa do Mundo 2026 usando a API gratuita do football-data.org
 * e atualiza os placares oficiais dos jogos na tabela `jogos` do seu banco Supabase.
 * 
 * Pré-requisitos:
 * 1. Obter uma chave de API gratuita em: https://www.football-data.org/ (leva 1 minuto)
 * 2. Adicionar a variável no seu arquivo `.env`:
 *    FOOTBALL_DATA_API_KEY=seu_token_aqui
 * 
 * Para rodar manualmente:
 *   node scripts/update_results.js
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// Validação de variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Service Role Key
const apiKey = process.env.FOOTBALL_DATA_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Erro: SUPABASE_URL e SUPABASE_KEY precisam estar configurados no .env");
  process.exit(1);
}

if (!apiKey) {
  console.warn("⚠️ Aviso: FOOTBALL_DATA_API_KEY não configurada no .env. O script não rodará.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Dicionário de tradução de nomes de países (API em Inglês -> Banco de Dados em Português)
const TEAM_TRANSLATIONS = {
  "Mexico": "México",
  "South Africa": "África do Sul",
  "South Korea": "Coreia do Sul",
  "Korea Republic": "Coreia do Sul",
  "Czechia": "República Tcheca",
  "Czech Republic": "República Tcheca",
  "Canada": "Canadá",
  "Bosnia and Herzegovina": "Bósnia e Herzegovina",
  "Qatar": "Catar",
  "Switzerland": "Suíça",
  "Brazil": "Brasil",
  "Morocco": "Marrocos",
  "Haiti": "Haiti",
  "Scotland": "Escócia",
  "USA": "Estados Unidos",
  "United States": "Estados Unidos",
  "Paraguay": "Paraguai",
  "Australia": "Austrália",
  "Turkey": "Turquia",
  "Germany": "Alemanha",
  "Curaçao": "Curaçao",
  "Ivory Coast": "Costa do Marfim",
  "Ecuador": "Equador",
  "Netherlands": "Holanda",
  "Japan": "Japão",
  "Sweden": "Suécia",
  "Tunisia": "Tunísia",
  "Belgium": "Bélgica",
  "Egypt": "Egito",
  "Iran": "Irã",
  "New Zealand": "Nova Zelândia",
  "Spain": "Espanha",
  "Cape Verde": "Cabo Verde",
  "Saudi Arabia": "Arábia Saudita",
  "Uruguay": "Uruguai",
  "France": "França",
  "Senegal": "Senegal",
  "Iraq": "Iraque",
  "Norway": "Noruega",
  "Argentina": "Argentina",
  "Algeria": "Argélia",
  "Austria": "Áustria",
  "Jordan": "Jordânia",
  "Portugal": "Portugal",
  "DR Congo": "República Democrática do Congo",
  "Congo DR": "República Democrática do Congo",
  "Democratic Republic of the Congo": "República Democrática do Congo",
  "Uzbekistan": "Uzbequistão",
  "Colombia": "Colômbia",
  "England": "Inglaterra",
  "Croatia": "Croácia",
  "Ghana": "Gana",
  "Panama": "Panamá"
};

function translateTeam(name) {
  return TEAM_TRANSLATIONS[name] || name;
}

async function updateScores() {
  try {
    console.log("🔄 Buscando partidas reais da API do Football-Data...");

    // Busca os dados da Copa do Mundo (WC) na API
    const response = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
      headers: { "X-Auth-Token": apiKey }
    });

    if (!response.ok) {
      throw new Error(`Erro na API externa: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const matches = data.matches || [];
    console.log(`✅ ${matches.length} partidas encontradas na API.`);

    // Busca as partidas cadastradas no nosso banco Supabase
    const { data: dbGames, error: dbError } = await supabase
      .from("jogos")
      .select("id, time_a, time_b, gols_a, gols_b");

    if (dbError) {
      throw new Error(`Erro ao buscar jogos no Supabase: ${dbError.message}`);
    }

    console.log(`📦 ${dbGames.length} jogos cadastrados no banco local.`);

    let updatedCount = 0;

    for (const match of matches) {
      // Só nos interessam jogos que já terminaram (FINISHED) ou estão acontecendo (IN_PLAY)
      if (match.status !== "FINISHED" && match.status !== "IN_PLAY") {
        continue;
      }

      const homeTranslated = translateTeam(match.homeTeam.name);
      const awayTranslated = translateTeam(match.awayTeam.name);
      
      const realGolsA = match.score.fullTime.home;
      const realGolsB = match.score.fullTime.away;

      if (realGolsA === null || realGolsB === null) {
        continue;
      }

      // Encontra a partida correspondente no nosso banco
      const matchedDbGame = dbGames.find(g => 
        (g.time_a === homeTranslated && g.time_b === awayTranslated) ||
        // Caso os times estejam em posições trocadas na API
        (g.time_a === awayTranslated && g.time_b === homeTranslated)
      );

      if (matchedDbGame) {
        // Verifica se a partida correspondente está invertida home/away
        const isReversed = matchedDbGame.time_a === awayTranslated;
        const targetGolsA = isReversed ? realGolsB : realGolsA;
        const targetGolsB = isReversed ? realGolsA : realGolsB;

        // Só atualiza se o placar no banco for diferente ou nulo
        if (matchedDbGame.gols_a !== targetGolsA || matchedDbGame.gols_b !== targetGolsB) {
          console.log(`⚽ Atualizando jogo: ${matchedDbGame.time_a} vs ${matchedDbGame.time_b} -> Placar: ${targetGolsA}x${targetGolsB}`);
          
          const { error: updateError } = await supabase
            .from("jogos")
            .update({ gols_a: targetGolsA, gols_b: targetGolsB })
            .eq("id", matchedDbGame.id);

          if (updateError) {
            console.error(`❌ Erro ao atualizar jogo ID ${matchedDbGame.id}:`, updateError.message);
          } else {
            updatedCount++;
          }
        }
      }
    }

    console.log(`🏁 Atualização finalizada. ${updatedCount} jogos foram atualizados com novos placares.`);
  } catch (error) {
    console.error("❌ Ocorreu um erro no processo de atualização:", error.message);
  }
}

updateScores();
