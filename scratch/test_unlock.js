require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
// Actually, let's write it using standard fetch or http.request to be safe. We'll use http module.

const http = require("http");

function postJSON(url, body, token = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const data = JSON.stringify(body);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      }
    };
    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => responseBody += chunk);
      res.on("end", () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(responseBody)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: responseBody
          });
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function test() {
  console.log("🚀 Iniciando testes do endpoint /api/palpites...");

  // 1. Fazer login do usuário de teste
  const loginRes = await postJSON("http://localhost:3000/api/auth/login", {
    email: "rodrigo.boleiro26@mailnull.com",
    senha: "senha123"
  });

  if (loginRes.statusCode !== 200) {
    console.error("❌ Falha no login:", loginRes.body);
    return;
  }

  const token = loginRes.body.session.access_token;
  const userId = loginRes.body.user.id;
  console.log("🔑 Logado com sucesso! ID:", userId);

  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const { error: profileError } = await supabase
    .from("perfis")
    .upsert({ id: userId, nome: "Rodrigo Boleiro" });

  if (profileError) {
    console.error("❌ Falha ao criar perfil de teste:", profileError.message);
    return;
  }
  console.log("👤 Perfil de teste criado/atualizado com sucesso!");

  // 2. Testar palpite em jogo bloqueado padrão (México x África do Sul, ID 290)
  console.log("\n🔒 Testando jogo do dia 11 (bloqueado, ID 290)...");
  const res290 = await postJSON("http://localhost:3000/api/palpites", {
    jogo_id: 290,
    palpite_gols_a: 1,
    palpite_gols_b: 1
  }, token);
  console.log(`Status: ${res290.statusCode}`);
  console.log("Resposta:", res290.body);
  if (res290.statusCode === 403) {
    console.log("✅ Correto! Jogo bloqueado com sucesso.");
  } else {
    console.log("❌ Incorreto! O palpite deveria ter sido bloqueado.");
  }

  // 3. Testar palpite em jogo do dia 13 (Catar x Suíça, ID 294)
  console.log("\n🔓 Testando jogo do dia 13 (desbloqueado excepcionalmente, ID 294)...");
  const res294 = await postJSON("http://localhost:3000/api/palpites", {
    jogo_id: 294,
    palpite_gols_a: 2,
    palpite_gols_b: 1
  }, token);
  console.log(`Status: ${res294.statusCode}`);
  console.log("Resposta:", res294.body);
  if (res294.statusCode === 200) {
    console.log("✅ Sucesso! Palpite aceito.");
  } else {
    console.log("❌ Falha! O palpite deveria ter sido aceito.");
  }

  // 4. Testar palpite em jogo do dia 13 local time (Haiti x Escócia, ID 296)
  console.log("\n🔓 Testando jogo do dia 13 local time (desbloqueado excepcionalmente, ID 296)...");
  const res296 = await postJSON("http://localhost:3000/api/palpites", {
    jogo_id: 296,
    palpite_gols_a: 0,
    palpite_gols_b: 3
  }, token);
  console.log(`Status: ${res296.statusCode}`);
  console.log("Resposta:", res296.body);
  if (res296.statusCode === 200) {
    console.log("✅ Sucesso! Palpite aceito.");
  } else {
    console.log("❌ Falha! O palpite deveria ter sido aceito.");
  }

  // 5. Testar palpite em jogo do dia 12 com resultado registrado no banco (EUA x Paraguai, ID 293)
  console.log("\n🔓 Testando jogo com resultado já registrado (EUA x Paraguai, ID 293)...");
  const res293 = await postJSON("http://localhost:3000/api/palpites", {
    jogo_id: 293,
    palpite_gols_a: 2,
    palpite_gols_b: 0
  }, token);
  console.log(`Status: ${res293.statusCode}`);
  console.log("Resposta:", res293.body);
  if (res293.statusCode === 200) {
    console.log("✅ Sucesso! Palpite aceito mesmo com resultado já registrado.");
  } else {
    console.log("❌ Falha! O palpite deveria ter sido aceito.");
  }

  // 6. Testar palpite em jogo do dia 14 (Austrália x Turquia, ID 297)
  console.log("\n🔓 Testando jogo do dia 14 (Austrália x Turquia, ID 297)...");
  const res297 = await postJSON("http://localhost:3000/api/palpites", {
    jogo_id: 297,
    palpite_gols_a: 1,
    palpite_gols_b: 2
  }, token);
  console.log(`Status: ${res297.statusCode}`);
  console.log("Resposta:", res297.body);
  if (res297.statusCode === 200) {
    console.log("✅ Sucesso! Palpite aceito.");
  } else {
    console.log("❌ Falha! O palpite deveria ter sido aceito.");
  }
}

test().catch(console.error);
