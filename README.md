# 🏆 Bolão Copa do Mundo 2026

Sistema completo de bolão com Backend Node.js/Express + Frontend HTML/CSS/JS puro.

---

## Estrutura do Projeto

```
bolao-copa-2026/
├── server.js          # Backend (Node.js + Express + Supabase)
├── package.json
├── .env.example       # Template das variáveis de ambiente
│
├── index.html         # Frontend — estrutura HTML
├── style.css          # Frontend — estilos
└── app.js             # Frontend — lógica JavaScript
```

---

## 1. Pré-requisitos

- Node.js 18+ instalado
- Projeto no Supabase com as tabelas abaixo já criadas
- (Opcional) `nodemon` para desenvolvimento

---

## 2. Estrutura do Banco de Dados (Supabase)

Certifique-se de que as seguintes tabelas e view existem no seu projeto:

```sql
-- Tabela de perfis (sincronizada com auth.users)
CREATE TABLE perfis (
  id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL
);

-- Tabela de jogos
CREATE TABLE jogos (
  id        BIGSERIAL PRIMARY KEY,
  time_a    TEXT NOT NULL,
  time_b    TEXT NOT NULL,
  gols_a    INT DEFAULT NULL,
  gols_b    INT DEFAULT NULL,
  data_hora TIMESTAMPTZ NOT NULL
);

-- Tabela de palpites
CREATE TABLE palpites (
  id               BIGSERIAL PRIMARY KEY,
  usuario_id       UUID REFERENCES perfis(id) ON DELETE CASCADE,
  jogo_id          BIGINT REFERENCES jogos(id) ON DELETE CASCADE,
  palpite_gols_a   INT NOT NULL,
  palpite_gols_b   INT NOT NULL,
  UNIQUE (usuario_id, jogo_id)  -- garante o upsert funcionar corretamente
);

-- View de ranking (lógica de pontuação: acerto exato = 3pts, só resultado = 1pt)
CREATE OR REPLACE VIEW ranking_geral AS
SELECT
  p.usuario_id,
  pf.nome,
  COALESCE(SUM(
    CASE
      WHEN j.gols_a IS NULL OR j.gols_b IS NULL THEN 0
      WHEN p.palpite_gols_a = j.gols_a AND p.palpite_gols_b = j.gols_b THEN 3
      WHEN
        SIGN(p.palpite_gols_a - p.palpite_gols_b) =
        SIGN(j.gols_a - j.gols_b) THEN 1
      ELSE 0
    END
  ), 0) AS pontos_totais
FROM palpites p
JOIN jogos    j  ON p.jogo_id    = j.id
JOIN perfis   pf ON p.usuario_id = pf.id
GROUP BY p.usuario_id, pf.nome;
```

**Desabilite Row Level Security (RLS)** nas tabelas `perfis`, `jogos` e `palpites`
— o backend usa a `service_role` key, que bypassa o RLS por padrão.
Alternativamente, crie políticas de acesso usando a `anon` key e ajuste o backend.

---

## 3. Configuração do Backend

### 3.1 Instalar dependências

```bash
npm install
```

### 3.2 Criar arquivo `.env`

Copie o arquivo de exemplo e preencha:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_KEY=eyJhbGci...  # Service Role Key (Project Settings > API)
PORT=3000
```

> ⚠️ **IMPORTANTE:** Use a **service_role** key no backend. Nunca a exponha no frontend.

### 3.3 Iniciar o servidor

```bash
# Produção
npm start

# Desenvolvimento (com hot-reload)
npm run dev
```

O servidor estará disponível em `http://localhost:3000`.

---

## 4. Configuração do Frontend

O frontend é 100% estático (HTML + CSS + JS). Basta servir os arquivos `index.html`, `style.css` e `app.js` de qualquer servidor HTTP.

### Opção A — Live Server (VS Code)
Instale a extensão **Live Server** e clique em "Go Live" no `index.html`.

### Opção B — `serve` (npm)
```bash
npx serve .
```

### Opção C — Python
```bash
python3 -m http.server 8080
```

> A variável `API_BASE` em `app.js` aponta para `http://localhost:3000/api`.
> Em produção, altere para a URL do seu servidor.

---

## 5. Rotas da API

| Método | Rota                  | Auth?  | Descrição                              |
|--------|-----------------------|--------|----------------------------------------|
| POST   | `/api/auth/signup`    | Não    | Cadastra usuário e cria perfil         |
| POST   | `/api/auth/login`     | Não    | Autentica e retorna sessão/token       |
| GET    | `/api/jogos`          | Não    | Lista todos os jogos por data          |
| GET    | `/api/palpites/meus`  | Sim    | Retorna palpites do usuário logado     |
| POST   | `/api/palpites`       | Sim    | Cria ou atualiza palpite (upsert)      |
| GET    | `/api/ranking`        | Não    | Retorna classificação da view          |
| GET    | `/api/health`         | Não    | Healthcheck do servidor                |

**Autenticação:** Header `Authorization: Bearer <access_token>`

---

## 6. Sistema de Pontuação (View `ranking_geral`)

| Situação                        | Pontos |
|---------------------------------|--------|
| Placar exato (ex: 2×1 → 2×1)  | 3 pts  |
| Resultado correto (ex: 2×1 → 3×2) | 1 pt |
| Errou o resultado               | 0 pts  |

---

## 7. Deploy em Produção

Você tem duas opções principais para hospedar o projeto:

### Opção A — Deploy Unificado (Recomendado & Mais Fácil)
Como o backend está configurado para servir os arquivos estáticos do frontend (`app.use(express.static(__dirname))`), você só precisa hospedar o servidor Node.js.

1. **Hospede o Backend:** Crie um Web Service em serviços como [Render](https://render.com/), [Railway](https://railway.app/) ou [Fly.io](https://fly.io/).
2. **Configure as Variáveis de Ambiente:** No painel da hospedagem, adicione as variáveis:
   - `SUPABASE_URL` = (URL do seu projeto no Supabase)
   - `SUPABASE_KEY` = (Service Role Key do seu projeto)
   - `GLOBAL_DEADLINE` = (Data limite de palpites no formato `YYYY-MM-DDTHH:MM:SS`, ex: `2026-06-11T16:00:00-03:00` para 11 de Junho de 2026 às 16h BRT)
   - `PORT` = `3000` (ou deixe o serviço definir automaticamente)
3. **Pronto!** O link gerado (ex: `https://meu-bolao.onrender.com`) servirá tanto o site (frontend) quanto a API (backend) de forma integrada, eliminando problemas de CORS ou necessidade de alterar código.

---

### Opção B — Deploy Separado (Frontend no Vercel/GitHub Pages + Backend no Render)
Se você preferir hospedar o site estático em um lugar e o servidor em outro:

1. **Backend:** Hospede no Render/Railway configurando as variáveis de ambiente normais.
2. **Frontend:** 
   - No arquivo `app.js`, altere o placeholder na constante `API_BASE` para a URL pública do seu backend hospedado (ex: `https://meu-bolao-api.onrender.com/api`).
   - Suba e hospede em serviços de front estático como [Vercel](https://vercel.com/), [Netlify](https://netlify.com/) ou [GitHub Pages](https://pages.github.com/).
3. **CORS:** No backend (`server.js`), configure o CORS para aceitar apenas o link do seu frontend, garantindo maior segurança:
   ```js
   app.use(cors({ origin: "https://meu-bolao.vercel.app" }));
   ```

