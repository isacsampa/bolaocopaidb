const https = require("https");

function postJSON(url, body, token = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const data = JSON.stringify(body);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
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

    const req = https.request(options, (res) => {
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

async function run() {
  const randomSuffix = Math.floor(Math.random() * 10000);
  const email = `testuser_${randomSuffix}@example.com`;
  const password = "password123";
  const nome = `Test User ${randomSuffix}`;

  console.log(`👤 Tentando criar usuário de teste na produção: ${email}`);
  
  // 1. Cadastrar usuário
  const signupRes = await postJSON("https://bolaocopa-2026.onrender.com/api/auth/signup", {
    email,
    senha: password,
    nome
  });

  console.log(`Signup Status: ${signupRes.statusCode}`);
  console.log("Signup Resposta:", signupRes.body);

  if (signupRes.statusCode !== 200 && signupRes.statusCode !== 201) {
    console.error("❌ Falha no cadastro de teste na produção.");
    return;
  }

  // 2. Fazer login
  console.log("\n🔑 Tentando fazer login na produção...");
  const loginRes = await postJSON("https://bolaocopa-2026.onrender.com/api/auth/login", {
    email,
    senha: password
  });

  console.log(`Login Status: ${loginRes.statusCode}`);
  console.log("Login Resposta:", loginRes.body);

  if (loginRes.statusCode !== 200) {
    console.error("❌ Falha no login de teste na produção.");
    return;
  }

  const token = loginRes.body.session.access_token;
  console.log("✅ Token de acesso obtido com sucesso!");

  // 3. Obter um jogo que ainda não começou (por exemplo, um jogo no futuro, ID 310)
  // De acordo com list_games, o jogo 310 é "Portugal vs Rep. Democrática do Congo @ 2026-06-17"
  console.log("\n🏟️ Enviando palpite para jogo futuro (ID 310)...");
  const palpiteRes = await postJSON("https://bolaocopa-2026.onrender.com/api/palpites", {
    jogo_id: 310,
    palpite_gols_a: 3,
    palpite_gols_b: 0
  }, token);

  console.log(`Palpite Status: ${palpiteRes.statusCode}`);
  console.log("Palpite Resposta:", palpiteRes.body);

  if (palpiteRes.statusCode === 200) {
    console.log("🎉 SUCESSO! A API de palpites na produção está respondendo e salvando corretamente!");
  } else {
    console.error("❌ FALHA! A API de palpites na produção retornou um erro ao salvar.");
  }
}

run().catch(console.error);
