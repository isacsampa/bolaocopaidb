const fs = require("fs");
const path = require("path");
const http = require("http");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

console.log("=========================================");
console.log("🔍 INICIANDO DIAGNÓSTICO DO PROJETO 🔍");
console.log("=========================================\n");

const SERVER_URL = "http://localhost:3000";

// Helper to make HTTP requests
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data.trim().startsWith("{") || data.trim().startsWith("[") ? JSON.parse(data) : data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

async function runDiagnostics() {
  let passed = true;

  // ─── 1. VERIFICAR ARQUIVOS FRONTEND ───
  console.log("📁 1. Verificando arquivos fundamentais do frontend...");
  const frontendFiles = ["index.html", "app.html", "login.html", "style.css", "app.js"];
  for (const file of frontendFiles) {
    const filePath = path.join(__dirname, "..", file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`  ✅ ${file} existe (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
      console.error(`  ❌ ERRO: Arquivo ${file} não encontrado!`);
      passed = false;
    }
  }
  console.log("");

  // ─── 2. VERIFICAR CONEXÃO E ESTRUTURA DO BANCO DE DADOS (SUPABASE) ───
  console.log("📡 2. Verificando conexão direta com o Supabase...");
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error("  ❌ ERRO: SUPABASE_URL ou SUPABASE_KEY não configurados no arquivo .env!");
    passed = false;
  } else {
    try {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
      
      // Testar tabela jogos
      const { data: jogos, error: errJogos } = await supabase.from("jogos").select("id").limit(1);
      if (errJogos) {
        console.error(`  ❌ ERRO na tabela 'jogos': ${errJogos.message}`);
        passed = false;
      } else {
        console.log("  ✅ Tabela 'jogos' acessível e respondendo.");
      }

      // Testar tabela perfis
      const { data: perfis, error: errPerfis } = await supabase.from("perfis").select("id").limit(1);
      if (errPerfis) {
        console.error(`  ❌ ERRO na tabela 'perfis': ${errPerfis.message}`);
        passed = false;
      } else {
        console.log("  ✅ Tabela 'perfis' acessível e respondendo.");
      }

      // Testar tabela palpites
      const { data: palpites, error: errPalpites } = await supabase.from("palpites").select("jogo_id").limit(1);
      if (errPalpites) {
        console.error(`  ❌ ERRO na tabela 'palpites': ${errPalpites.message}`);
        passed = false;
      } else {
        console.log("  ✅ Tabela 'palpites' acessível e respondendo.");
      }

      // Testar view ranking_geral
      const { data: ranking, error: errRanking } = await supabase.from("ranking_geral").select("nome, pontos_totais").limit(1);
      if (errRanking) {
        console.error(`  ❌ ERRO na view 'ranking_geral': ${errRanking.message}`);
        passed = false;
      } else {
        console.log("  ✅ View 'ranking_geral' acessível e respondendo.");
      }
    } catch (e) {
      console.error(`  ❌ Falha crítica ao conectar com o cliente Supabase: ${e.message}`);
      passed = false;
    }
  }
  console.log("");

  // ─── 3. TESTAR ENDPOINTS DO SERVIDOR LOCAL ───
  console.log("🌐 3. Testando endpoints da API no servidor local...");
  const endpoints = [
    { name: "Health Check (/api/health)", path: "/api/health", expectedStatus: 200 },
    { name: "Configuração (/api/config)", path: "/api/config", expectedStatus: 200 },
    { name: "Jogos (/api/jogos)", path: "/api/jogos", expectedStatus: 200 },
    { name: "Palpites Públicos (/api/palpites/publicos)", path: "/api/palpites/publicos", expectedStatus: 200 },
    { name: "Ranking (/api/ranking)", path: "/api/ranking", expectedStatus: 200 },
    { name: "Rota Inválida (404)", path: "/api/rota-inexistente", expectedStatus: 404 }
  ];

  for (const ep of endpoints) {
    try {
      const url = `${SERVER_URL}${ep.path}`;
      const res = await fetchUrl(url);
      if (res.status === ep.expectedStatus) {
        console.log(`  ✅ ${ep.name}: Resposta ${res.status} OK`);
        if (ep.path === "/api/health") {
          console.log(`     Corpo: ${JSON.stringify(res.body)}`);
        }
        if (ep.path === "/api/config") {
          console.log(`     Config: ${JSON.stringify(res.body)}`);
        }
        if (ep.path === "/api/jogos" && Array.isArray(res.body)) {
          console.log(`     Jogos totais cadastrados: ${res.body.length}`);
        }
        if (ep.path === "/api/palpites/publicos" && Array.isArray(res.body)) {
          console.log(`     Palpites públicos totais: ${res.body.length}`);
        }
        if (ep.path === "/api/ranking" && Array.isArray(res.body)) {
          console.log(`     Membros no ranking: ${res.body.length}`);
        }
      } else {
        console.error(`  ❌ ERRO em ${ep.name}: Status esperado ${ep.expectedStatus}, recebido ${res.status}`);
        passed = false;
      }
    } catch (e) {
      console.error(`  ❌ ERRO crítico ao conectar no endpoint ${ep.path}: ${e.message}`);
      passed = false;
    }
  }
  console.log("");

  // ─── 4. VERIFICAÇÃO DE INTEGRIDADE DE LAYOUT E SCRIPTS DO FRONTEND ───
  console.log("🔍 4. Validando integridade de scripts do frontend...");
  try {
    const indexContent = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
    const appContent = fs.readFileSync(path.join(__dirname, "..", "app.html"), "utf8");
    const loginContent = fs.readFileSync(path.join(__dirname, "..", "login.html"), "utf8");

    // Verificar se existe a verificação do document.currentScript no script inline do guia do index.html
    if (indexContent.includes("document.currentScript")) {
      console.log("  ✅ index.html: Script do guia protegido com document.currentScript.");
    } else {
      console.warn("  ⚠️ AVISO index.html: Script inline do guia pode não estar usando proteção de document.currentScript.");
    }

    // Verificar os botões de retorno/links corretos
    if (indexContent.includes("app.html") || indexContent.includes("login.html")) {
      console.log("  ✅ index.html: Possui links para área privada / login.");
    } else {
      console.warn("  ⚠️ AVISO index.html: Links para área privada não encontrados no index.html.");
    }

    if (loginContent.includes("index.html")) {
      console.log("  ✅ login.html: Link de retorno para index.html presente.");
    } else {
      console.error("  ❌ ERRO login.html: Link de retorno para index.html ausente!");
      passed = false;
    }

    if (appContent.includes("index.html")) {
      console.log("  ✅ app.html: Link de retorno para index.html presente na logo/topbar.");
    } else {
      console.error("  ❌ ERRO app.html: Link de retorno para index.html ausente!");
      passed = false;
    }

  } catch (e) {
    console.error(`  ❌ Erro ao validar integridade do frontend: ${e.message}`);
    passed = false;
  }
  console.log("");

  // ─── RESULTADO FINAL ───
  console.log("=========================================");
  if (passed) {
    console.log("🏆 DIAGNÓSTICO CONCLUÍDO: PROJETO 100% OK! 🏆");
  } else {
    console.error("⚠️ DIAGNÓSTICO CONCLUÍDO COM ERROS/AVISOS! ⚠️");
  }
  console.log("=========================================");
}

runDiagnostics().catch(console.error);
