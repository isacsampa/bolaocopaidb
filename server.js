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

/**
 * POST /api/auth/recovery
 * Body: { email }
 * Envia e-mail real de recuperação de senha via Supabase.
 * O link no e-mail redireciona para a página de login do app.
 */
app.post("/api/auth/recovery", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ error: "E-mail obrigatório." });
  }

  // URL de redirecionamento dinâmica para suportar desenvolvimento local e produção
  const origin = req.headers.origin;
  const redirectTo = origin
    ? `${origin}/login.html`
    : (process.env.APP_URL ? `${process.env.APP_URL}/login.html` : "https://bolaocopa-2026.onrender.com/login.html");

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });

  if (error) {
    console.error("Erro recovery:", error.message);
  }

  // Sempre retorna sucesso para não revelar se o e-mail existe no sistema
  return res.status(200).json({
    message: "Se esse e-mail estiver cadastrado, você receberá as instruções em breve.",
  });
});

/**
 * POST /api/auth/reset-password
 * Body: { access_token, refresh_token, nova_senha }
 * Salva a nova senha para o usuário associado ao access_token.
 */
app.post("/api/auth/reset-password", async (req, res) => {
  const { access_token, refresh_token, nova_senha } = req.body;

  if (!access_token) {
    return res.status(400).json({ error: "Token de acesso obrigatório." });
  }

  if (!nova_senha || nova_senha.length < 6) {
    return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres." });
  }

  try {
    // 1. Cria um cliente Supabase temporário para esta requisição para evitar conflito de sessão
    const tempSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // 2. Define a sessão temporária usando os tokens enviados pelo cliente
    const { data: sessionData, error: sessionError } = await tempSupabase.auth.setSession({
      access_token,
      refresh_token: refresh_token || "",
    });

    if (sessionError || !sessionData.user) {
      console.error("Erro ao definir sessão de redefinição:", sessionError?.message);
      return res.status(401).json({ error: "Token inválido ou expirado. Por favor, solicite a recuperação novamente." });
    }

    // 3. Atualiza a senha na sessão do usuário (funciona com chave pública anon e service_role)
    const { error: updateError } = await tempSupabase.auth.updateUser({
      password: nova_senha,
    });

    if (updateError) {
      console.error("Erro ao redefinir senha no Supabase:", updateError.message);
      return res.status(400).json({ error: updateError.message });
    }

    return res.status(200).json({ message: "Senha atualizada com sucesso!" });
  } catch (err) {
    console.error("Erro interno no reset-password:", err);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
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

  // 3.5. Bloqueia palpite se o prazo limite global do bolão tiver expirado (exceto jogo 291)
  const globalDeadlineStr = process.env.GLOBAL_DEADLINE || "2026-06-11T16:00:00-03:00";
  const globalDeadline = new Date(globalDeadlineStr);
  const agora = new Date();
  if (agora >= globalDeadline && Number(jogo_id) !== 291) {
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

  // 5. Bloqueia palpite se o horário atual for posterior ao início do jogo (exceto jogo 291)
  const dataJogo = new Date(jogo.data_hora);

  if (agora >= dataJogo && Number(jogo_id) !== 291) {
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

// ─── ROTA PÚBLICA DE PALPITES ──────────────────────────────────────────────────

/**
 * GET /api/palpites/publicos
 * Retorna todos os palpites de todos os participantes, com nome do usuário e dados do jogo.
 * Rota pública — sem autenticação. Expõe somente dados necessários para rivalização.
 */
app.get("/api/palpites/publicos", async (_req, res) => {
  // Busca todos os palpites com join nas tabelas perfis e jogos
  const { data, error } = await supabase
    .from("palpites")
    .select(`
      usuario_id,
      jogo_id,
      palpite_gols_a,
      palpite_gols_b,
      perfis ( nome ),
      jogos ( id, time_a, time_b, gols_a, gols_b, data_hora )
    `)
    .order("jogo_id", { ascending: true });

  if (error) {
    console.error("Erro ao buscar palpites públicos:", error.message);
    return res.status(500).json({ error: "Erro ao buscar palpites." });
  }

  // Formata a resposta de forma limpa para o frontend
  const formatted = (data || []).map((p) => ({
    usuario_id:      p.usuario_id,
    nome:            p.perfis?.nome || "Participante",
    jogo_id:         p.jogo_id,
    time_a:          p.jogos?.time_a || "—",
    time_b:          p.jogos?.time_b || "—",
    data_hora:       p.jogos?.data_hora || null,
    gols_a:          p.jogos?.gols_a,   // resultado real (null se ainda não jogou)
    gols_b:          p.jogos?.gols_b,
    palpite_gols_a:  p.palpite_gols_a,
    palpite_gols_b:  p.palpite_gols_b,
  }));

  return res.status(200).json(formatted);
});

// ─── ROTAS DE RANKING ──────────────────────────────────────────────────────────

/**
 * GET /api/ranking
 * Retorna o ranking completo, incluindo TODOS os participantes — mesmo os que
 * ainda não fizeram nenhum palpite (aparecem com 0 pts).
 * A view `ranking_geral` usa JOIN interno, então usuários sem palpites ficam
 * invisíveis. Aqui fazemos o merge manual com a tabela `perfis`.
 * Rota pública.
 */
app.get("/api/ranking", async (_req, res) => {
  // 1. Busca todos os perfis cadastrados
  const { data: perfis, error: perfisError } = await supabase
    .from("perfis")
    .select("id, nome");

  if (perfisError) {
    console.error("Erro ao buscar perfis:", perfisError.message);
    return res.status(500).json({ error: "Erro ao buscar participantes." });
  }

  // 2. Busca ranking (só quem tem palpites)
  const { data: rankingView, error: rankingError } = await supabase
    .from("ranking_geral")
    .select("usuario_id, pontos_totais");

  if (rankingError) {
    console.error("Erro ao buscar ranking_geral:", rankingError.message);
    // Fallback: retorna todos com 0 pts se a view falhar
    const fallback = (perfis || []).map(p => ({
      usuario_id: p.id,
      nome: p.nome,
      pontos_totais: 0,
    }));
    return res.status(200).json(fallback);
  }

  // 3. Cria mapa de pontos por usuario_id
  const ptsPorUsuario = {};
  (rankingView || []).forEach(r => {
    ptsPorUsuario[r.usuario_id] = r.pontos_totais ?? 0;
  });

  // 4. Merge: todos os perfis, com pontos da view (ou 0 se não estiver)
  const resultado = (perfis || [])
    .map(p => ({
      usuario_id: p.id,
      nome: p.nome,
      pontos_totais: ptsPorUsuario[p.id] ?? 0,
    }))
    .sort((a, b) => b.pontos_totais - a.pontos_totais);

  return res.status(200).json(resultado);
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
