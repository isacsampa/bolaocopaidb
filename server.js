/**
 * BOLÃO COPA DO MUNDO 2026 — Backend
 * Stack: Node.js + Express + @supabase/supabase-js
 *
 * Variáveis de ambiente necessárias (.env):
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_KEY=eyJhbGc... (service_role key)
 *   PORT=3000 (opcional)
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

// ─── Inicialização ─────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;

// Valida variáveis obrigatórias antes de qualquer coisa
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error(
    "❌ SUPABASE_URL e SUPABASE_KEY são obrigatórios no arquivo .env"
  );
  process.exit(1);
}

// Cliente Supabase com a service_role key (nunca exposta ao frontend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ─── Middlewares ───────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" })); // Em produção, restrinja ao domínio do frontend
app.use(express.json());

// Servir arquivos estáticos do frontend (permite deploy unificado frontend + backend)
app.use(express.static(__dirname));

// Middleware de log de requisições
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extrai e valida o token JWT enviado no header Authorization.
 * Retorna o usuário autenticado ou lança erro 401.
 */
async function getUserFromToken(req, res) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token de autenticação não fornecido." });
    return null;
  }
  const token = auth.split(" ")[1];
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: "Token inválido ou expirado." });
    return null;
  }
  return user;
}

// ─── ROTAS DE AUTENTICAÇÃO ─────────────────────────────────────────────────────

/**
 * POST /api/auth/signup
 * Body: { email, senha, nome }
 * Cria o usuário no Supabase Auth e insere o perfil na tabela `perfis`.
 */
app.post("/api/auth/signup", async (req, res) => {
  const { email, senha, nome } = req.body;

  if (!email || !senha || !nome) {
    return res
      .status(400)
      .json({ error: "Campos obrigatórios: email, senha, nome." });
  }

  if (senha.length < 6) {
    return res
      .status(400)
      .json({ error: "A senha deve ter no mínimo 6 caracteres." });
  }

  // 1. Cria o usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: senha,
  });

  if (authError) {
    console.error("Erro signup:", authError.message);
    return res.status(400).json({ error: authError.message });
  }

  const userId = authData.user?.id;

  if (!userId) {
    return res
      .status(500)
      .json({ error: "Falha ao obter ID do usuário após cadastro." });
  }

  // 2. Insere o nome na tabela `perfis`
  const { error: perfilError } = await supabase
    .from("perfis")
    .insert({ id: userId, nome });

  if (perfilError) {
    console.error("Erro ao criar perfil:", perfilError.message);
    // Mesmo que falhe, retorna sucesso parcial (o auth foi criado)
    return res.status(207).json({
      warning: "Usuário criado, mas houve erro ao salvar o perfil.",
      session: authData.session,
      user: { id: userId, email, nome },
    });
  }

  return res.status(201).json({
    message: "Cadastro realizado com sucesso!",
    session: authData.session,
    user: { id: userId, email, nome },
  });
});

/**
 * POST /api/auth/login
 * Body: { email, senha }
 * Autentica o usuário e retorna a sessão com o access_token.
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res
      .status(400)
      .json({ error: "Campos obrigatórios: email, senha." });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    console.error("Erro login:", error.message);
    return res.status(401).json({ error: "Email ou senha incorretos." });
  }

  // Busca o perfil para retornar o nome ao frontend
  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome")
    .eq("id", data.user.id)
    .single();

  return res.status(200).json({
    message: "Login realizado com sucesso!",
    session: data.session,
    user: {
      id: data.user.id,
      email: data.user.email,
      nome: perfil?.nome || "Participante",
    },
  });
});

// ─── ROTAS DE JOGOS ────────────────────────────────────────────────────────────

/**
 * GET /api/jogos
 * Retorna todos os jogos ordenados por data_hora crescente.
 * Rota pública (não exige autenticação).
 */
app.get("/api/jogos", async (_req, res) => {
  const { data, error } = await supabase
    .from("jogos")
    .select("id, time_a, time_b, gols_a, gols_b, data_hora")
    .order("data_hora", { ascending: true });

  if (error) {
    console.error("Erro ao buscar jogos:", error.message);
    return res.status(500).json({ error: "Erro ao buscar jogos." });
  }

  return res.status(200).json(data);
});

/**
 * GET /api/config
 * Retorna as configurações do bolão, incluindo o prazo limite global para palpites.
 */
app.get("/api/config", (_req, res) => {
  return res.status(200).json({
    global_deadline: process.env.GLOBAL_DEADLINE || "2026-06-11T16:00:00-03:00"
  });
});

// ─── ROTAS DE PALPITES ─────────────────────────────────────────────────────────

/**
 * POST /api/palpites
 * Headers: Authorization: Bearer <token>
 * Body: { jogo_id, palpite_gols_a, palpite_gols_b }
 *
 * Valida se o jogo ainda não começou, depois faz upsert do palpite.
 */
app.post("/api/palpites", async (req, res) => {
  // 1. Autentica o usuário pelo token
  const user = await getUserFromToken(req, res);
  if (!user) return;

  const { jogo_id, palpite_gols_a, palpite_gols_b } = req.body;

  // 2. Validação dos campos
  if (
    jogo_id == null ||
    palpite_gols_a == null ||
    palpite_gols_b == null
  ) {
    return res.status(400).json({
      error: "Campos obrigatórios: jogo_id, palpite_gols_a, palpite_gols_b.",
    });
  }

  if (
    !Number.isInteger(Number(palpite_gols_a)) ||
    !Number.isInteger(Number(palpite_gols_b)) ||
    palpite_gols_a < 0 ||
    palpite_gols_b < 0
  ) {
    return res
      .status(400)
      .json({ error: "Os palpites de gols devem ser números inteiros >= 0." });
  }

  // 3. Busca o jogo para validar horário e se já tem resultado
  const { data: jogo, error: jogoError } = await supabase
    .from("jogos")
    .select("id, data_hora, gols_a, gols_b")
    .eq("id", jogo_id)
    .single();

  if (jogoError || !jogo) {
    return res.status(404).json({ error: "Jogo não encontrado." });
  }

  // 3.5. Bloqueia palpite se o prazo limite global do bolão tiver expirado
  const globalDeadlineStr = process.env.GLOBAL_DEADLINE || "2026-06-11T16:00:00-03:00";
  const globalDeadline = new Date(globalDeadlineStr);
  const agora = new Date();
  if (agora >= globalDeadline) {
    return res.status(403).json({
      error: `Prazo encerrado. O prazo limite para todas as apostas expirou em ${globalDeadline.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`
    });
  }

  // 4. Bloqueia palpite se o jogo já tiver resultado registrado
  if (jogo.gols_a !== null && jogo.gols_b !== null) {
    return res.status(403).json({
      error: "Este jogo já possui resultado final. Palpites encerrados.",
    });
  }

  // 5. Bloqueia palpite se o horário atual for posterior ao início do jogo
  const dataJogo = new Date(jogo.data_hora);

  if (agora >= dataJogo) {
    return res.status(403).json({
      error: `Prazo encerrado. O jogo começou em ${dataJogo.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`,
    });
  }

  // 6. Upsert do palpite (cria ou atualiza se já existir)
  const { data: palpite, error: palpiteError } = await supabase
    .from("palpites")
    .upsert(
      {
        usuario_id: user.id,
        jogo_id: Number(jogo_id),
        palpite_gols_a: Number(palpite_gols_a),
        palpite_gols_b: Number(palpite_gols_b),
      },
      { onConflict: "usuario_id,jogo_id" }
    )
    .select()
    .single();

  if (palpiteError) {
    console.error("Erro ao salvar palpite:", palpiteError.message);
    return res.status(500).json({ error: "Erro ao salvar o palpite." });
  }

  return res
    .status(200)
    .json({ message: "Palpite salvo com sucesso!", palpite });
});

/**
 * GET /api/palpites/meus
 * Headers: Authorization: Bearer <token>
 * Retorna todos os palpites do usuário autenticado.
 */
app.get("/api/palpites/meus", async (req, res) => {
  const user = await getUserFromToken(req, res);
  if (!user) return;

  const { data, error } = await supabase
    .from("palpites")
    .select("jogo_id, palpite_gols_a, palpite_gols_b")
    .eq("usuario_id", user.id);

  if (error) {
    console.error("Erro ao buscar palpites:", error.message);
    return res.status(500).json({ error: "Erro ao buscar seus palpites." });
  }

  return res.status(200).json(data);
});

// ─── ROTAS DE RANKING ──────────────────────────────────────────────────────────

/**
 * GET /api/ranking
 * Retorna os dados da view `ranking_geral` ordenados por pontos decrescentes.
 * Rota pública.
 */
app.get("/api/ranking", async (_req, res) => {
  const { data, error } = await supabase
    .from("ranking_geral")
    .select("usuario_id, nome, pontos_totais")
    .order("pontos_totais", { ascending: false });

  if (error) {
    console.error("Erro ao buscar ranking:", error.message);
    return res.status(500).json({ error: "Erro ao buscar o ranking." });
  }

  return res.status(200).json(data);
});

// ─── Rota de saúde ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Rota ${req.method} ${req.path} não existe.` });
});

// ─── Error Handler Global ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Erro não tratado:", err);
  res.status(500).json({ error: "Erro interno do servidor." });
});

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏆 Bolão Copa 2026 — Backend rodando em http://localhost:${PORT}`);
  console.log(`📡 Supabase conectado: ${process.env.SUPABASE_URL}\n`);
});
