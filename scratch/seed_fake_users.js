/**
 * SEED: 5 usuários falsos + palpites nos 2 primeiros jogos de cada grupo
 * Execução: node scratch/seed_fake_users.js
 */

const http = require("http");

const BASE = "http://localhost:3000";

// ── Helpers ──────────────────────────────────────────────────────────────────

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "localhost",
      port: 3000,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ── Fake users ────────────────────────────────────────────────────────────────

const FAKE_USERS = [
  { nome: "Rodrigo Boleiro",  email: "rodrigo.boleiro26@mailnull.com",  senha: "senha123" },
  { nome: "Fernanda Gol",     email: "fernanda.gol26@mailnull.com",     senha: "senha123" },
  { nome: "Carlos Craque",    email: "carlos.craque26@mailnull.com",    senha: "senha123" },
  { nome: "Juliana Campeã",   email: "juliana.campea26@mailnull.com",   senha: "senha123" },
  { nome: "Thiago Torcedor",  email: "thiago.torcedor26@mailnull.com",  senha: "senha123" },
];

// ── Groups map (same as app.js) ───────────────────────────────────────────────

const GROUPS = {
  A: ["México", "África do Sul", "Coreia do Sul", "República Tcheca"],
  B: ["Canadá", "Bósnia e Herzegovina", "Catar", "Suíça"],
  C: ["Brasil", "Marrocos", "Haiti", "Escócia"],
  D: ["Estados Unidos", "Paraguai", "Austrália", "Turquia"],
  E: ["Alemanha", "Curaçao", "Costa do Marfim", "Equador"],
  F: ["Holanda", "Japão", "Suécia", "Tunísia"],
  G: ["Bélgica", "Egito", "Irã", "Nova Zelândia"],
  H: ["Espanha", "Cabo Verde", "Arábia Saudita", "Uruguai"],
  I: ["França", "Senegal", "Iraque", "Noruega"],
  J: ["Argentina", "Argélia", "Áustria", "Jordânia"],
  K: ["Portugal", "República Democrática do Congo", "Uzbequistão", "Colômbia"],
  L: ["Inglaterra", "Croácia", "Gana", "Panamá"],
};

// All teams belonging to any group
const ALL_TEAMS = new Set(Object.values(GROUPS).flat());

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 Bolão Copa 2026 — Seeder de Usuários Falsos\n");

  // 1. Buscar todos os jogos
  console.log("📡 Buscando jogos da API...");
  const jogosRes = await request("GET", "/api/jogos");
  if (jogosRes.status !== 200 || !Array.isArray(jogosRes.body)) {
    console.error("❌ Erro ao buscar jogos:", jogosRes.body);
    process.exit(1);
  }
  const allJogos = jogosRes.body;
  console.log(`   ✅ ${allJogos.length} jogos encontrados.\n`);

  // 2. Filtrar apenas jogos da fase de grupos (ambos os times pertencem a algum grupo)
  const gruposJogos = allJogos.filter(
    (j) => ALL_TEAMS.has(j.time_a) && ALL_TEAMS.has(j.time_b)
  );

  // 3. Para cada grupo, pegar os 2 primeiros jogos (ordenados por data_hora)
  const targetJogos = [];
  for (const [letra, times] of Object.entries(GROUPS)) {
    const jogosDoGrupo = gruposJogos
      .filter((j) => times.includes(j.time_a) && times.includes(j.time_b))
      .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));

    const primeiros2 = jogosDoGrupo.slice(0, 2);
    if (primeiros2.length === 0) {
      console.warn(`   ⚠️  Grupo ${letra}: nenhum jogo entre times do grupo encontrado.`);
    }
    primeiros2.forEach((j) => targetJogos.push({ ...j, grupo: letra }));
  }

  // Remover duplicatas (mesmo jogo pode aparecer em múltiplos grupos de pesquisa — improvável mas seguro)
  const uniqueJogos = [...new Map(targetJogos.map((j) => [j.id, j])).values()];
  console.log(`🎯 Jogos alvo para palpites: ${uniqueJogos.length} (2 primeiros de cada grupo)\n`);
  uniqueJogos.forEach((j) =>
    console.log(`   [Grupo ${j.grupo}] #${j.id} ${j.time_a} × ${j.time_b} — ${new Date(j.data_hora).toLocaleString("pt-BR")}`)
  );
  console.log();

  // 4. Cadastrar cada usuário e registrar palpites
  for (const user of FAKE_USERS) {
    console.log(`\n👤 Cadastrando: ${user.nome} (${user.email})`);

    // 4a. Signup
    const signupRes = await request("POST", "/api/auth/signup", {
      email: user.email,
      senha: user.senha,
      nome:  user.nome,
    });

    let token = null;

    if (signupRes.status === 201 || signupRes.status === 207) {
      token = signupRes.body?.session?.access_token || null;
      console.log(`   ✅ Cadastro OK${signupRes.status === 207 ? " (com aviso de perfil)" : ""}`);
    } else if (signupRes.status === 400 && String(signupRes.body?.error).toLowerCase().includes("already registered")) {
      // Usuário já existe — fazer login
      console.log(`   ℹ️  Já cadastrado. Fazendo login...`);
      const loginRes = await request("POST", "/api/auth/login", {
        email: user.email,
        senha: user.senha,
      });
      if (loginRes.status === 200) {
        token = loginRes.body?.session?.access_token || null;
        console.log(`   ✅ Login OK`);
      } else {
        console.warn(`   ⚠️  Login falhou: ${JSON.stringify(loginRes.body)}`);
      }
    } else {
      console.warn(`   ⚠️  Signup retornou ${signupRes.status}: ${JSON.stringify(signupRes.body)}`);
      // Tentar login mesmo assim
      await sleep(500);
      const loginRes = await request("POST", "/api/auth/login", {
        email: user.email,
        senha: user.senha,
      });
      if (loginRes.status === 200) {
        token = loginRes.body?.session?.access_token || null;
        console.log(`   ✅ Login OK (fallback)`);
      }
    }

    if (!token) {
      console.error(`   ❌ Sem token — pulando palpites de ${user.nome}`);
      continue;
    }

    // 4b. Registrar palpites
    let ok = 0, skip = 0, fail = 0;
    for (const jogo of uniqueJogos) {
      // Placar aleatório realista: maioria dos placares entre 0-3
      const ga = rnd(0, 3);
      const gb = rnd(0, 3);

      const palRes = await request(
        "POST",
        "/api/palpites",
        { jogo_id: jogo.id, palpite_gols_a: ga, palpite_gols_b: gb },
        token
      );

      if (palRes.status === 200) {
        ok++;
      } else if (palRes.status === 403) {
        skip++; // prazo encerrado ou jogo já tem resultado
      } else {
        fail++;
        console.warn(`      ⚠️  Jogo #${jogo.id}: ${JSON.stringify(palRes.body)}`);
      }
      await sleep(120); // pequeno delay para não sobrecarregar o Supabase
    }
    console.log(`   📝 Palpites: ✅ ${ok} salvos | ⏭️ ${skip} bloqueados (prazo/resultado) | ❌ ${fail} erros`);
  }

  console.log("\n\n🏁 Seeding concluído! Acesse http://localhost:3000 para ver o ranking.\n");
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
