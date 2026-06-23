const http = require("http");
const https = require("https");

function request(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on("error", reject);
  });
}

async function testServer(name, baseUrl) {
  console.log(`\n📡 Testando servidor: ${name} (${baseUrl})`);
  
  // Teste 1: /api/config
  try {
    const configRes = await request(`${baseUrl}/config`);
    if (configRes.statusCode === 200) {
      const config = JSON.parse(configRes.body);
      console.log(`  ✅ /config: OK (Status: ${configRes.statusCode})`);
      console.log(`     • Prazo global (global_deadline): "${config.global_deadline}"`);
    } else {
      console.log(`  ❌ /config: Erro (Status: ${configRes.statusCode})`);
      console.log(`     • Resposta: ${configRes.body.slice(0, 100)}`);
    }
  } catch (err) {
    console.log(`  ❌ /config: Falha na conexão: ${err.message}`);
  }

  // Teste 2: /api/jogos
  try {
    const jogosRes = await request(`${baseUrl}/jogos`);
    if (jogosRes.statusCode === 200) {
      const jogos = JSON.parse(jogosRes.body);
      console.log(`  ✅ /jogos: OK (Status: ${jogosRes.statusCode})`);
      console.log(`     • Total de jogos retornados: ${jogos.length}`);
      if (jogos.length > 0) {
        console.log(`     • Exemplo de jogo: ID ${jogos[0].id} (${jogos[0].time_a} x ${jogos[0].time_b})`);
      }
    } else {
      console.log(`  ❌ /jogos: Erro (Status: ${jogosRes.statusCode})`);
      console.log(`     • Resposta: ${jogosRes.body.slice(0, 100)}`);
    }
  } catch (err) {
    console.log(`  ❌ /jogos: Falha na conexão: ${err.message}`);
  }
}

async function main() {
  console.log("=== DIAGNÓSTICO DE APIS (LOCAL vs PRODUÇÃO) ===");
  
  // Testar local
  await testServer("Local (localhost:3000)", "http://localhost:3000/api");
  
  // Testar produção (Render)
  await testServer("Produção (Render)", "https://bolaocopa-2026.onrender.com/api");
  
  console.log("\n==============================================");
}

main().catch(console.error);
