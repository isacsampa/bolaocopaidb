/**
 * BOLÃO COPA 2026 — Frontend (app.js) v3
 */

// URL base da API
// - Se rodando localmente (Live Server no 8080/5500), aponta para localhost:3000
// - Se no deploy unificado (backend servindo frontend), usa caminho relativo '/api'
// - Se hospedar o frontend separado (ex: Vercel/GitHub Pages), altere para a URL pública do seu backend
const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname === "" || window.location.protocol === "file:")
  ? (window.location.port === "3000" ? "/api" : "http://localhost:3000/api")
  : (window.location.origin.includes("github.io") || window.location.origin.includes("vercel.app") || window.location.origin.includes("netlify.app")
    ? "https://SEU-BACKEND-NO-RENDER.onrender.com/api" // <- Substitua pela URL do seu backend se hospedar separado!
    : "/api");
 
const state = {
  token: null,
  user: null,
  palpites: {},
  jogos: [],
  selectedGroup: "",
  bracketPalpites: {},
};

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

const ESTADIOS_COPA = [
  { cidade: "Cidade do México", estadio: "Estádio Azteca" },
  { cidade: "Los Angeles", estadio: "SoFi Stadium" },
  { cidade: "Nova York/NJ", estadio: "MetLife Stadium" },
  { cidade: "Dallas", estadio: "AT&T Stadium" },
  { cidade: "Miami", estadio: "Hard Rock Stadium" },
  { cidade: "Atlanta", estadio: "Mercedes-Benz Stadium" },
  { cidade: "Vancouver", estadio: "BC Place" },
  { cidade: "Toronto", estadio: "BMO Field" },
  { cidade: "Guadalajara", estadio: "Estádio Akron" },
  { cidade: "Monterrey", estadio: "Estádio BBVA" },
  { cidade: "Houston", estadio: "NRG Stadium" },
  { cidade: "Kansas City", estadio: "Arrowhead Stadium" },
  { cidade: "Seattle", estadio: "Lumen Field" },
  { cidade: "San Francisco", estadio: "Levi's Stadium" },
  { cidade: "Boston", estadio: "Gillette Stadium" },
  { cidade: "Filadélfia", estadio: "Lincoln Financial" }
];

const TEAM_FLAGS = {
  "México": "mx",
  "África do Sul": "za",
  "Coreia do Sul": "kr",
  "República Tcheca": "cz",
  "Canadá": "ca",
  "Bósnia e Herzegovina": "ba",
  "Catar": "qa",
  "Suíça": "ch",
  "Brasil": "br",
  "Marrocos": "ma",
  "Haiti": "ht",
  "Escócia": "gb-sct",
  "Estados Unidos": "us",
  "Paraguai": "py",
  "Austrália": "au",
  "Turquia": "tr",
  "Alemanha": "de",
  "Curaçao": "cw",
  "Costa do Marfim": "ci",
  "Equador": "ec",
  "Holanda": "nl",
  "Japão": "jp",
  "Suécia": "se",
  "Tunísia": "tn",
  "Bélgica": "be",
  "Egito": "eg",
  "Irã": "ir",
  "Nova Zelândia": "nz",
  "Espanha": "es",
  "Cabo Verde": "cv",
  "Arábia Saudita": "sa",
  "Uruguai": "uy",
  "França": "fr",
  "Senegal": "sn",
  "Iraque": "iq",
  "Noruega": "no",
  "Argentina": "ar",
  "Argélia": "dz",
  "Áustria": "at",
  "Jordânia": "jo",
  "Portugal": "pt",
  "República Democrática do Congo": "cd",
  "Uzbequistão": "uz",
  "Colômbia": "co",
  "Inglaterra": "gb-eng",
  "Croácia": "hr",
  "Gana": "gh",
  "Panamá": "pa"
};

function getTeamFlagHtml(teamName) {
  const code = TEAM_FLAGS[teamName];
  if (!code) return "";
  return `<img src="https://flagcdn.com/w40/${code}.png" class="flag-icon" alt="${esc(teamName)}" />`;
}

const KNOCKOUT_ROUNDS = [
  {
    name: "Round of 32",
    matches: [
      { id: "r32-m1", left: "1C", right: "2F" },
      { id: "r32-m2", left: "1E", right: "3ABCDF" },
      { id: "r32-m3", left: "1F", right: "2C" },
      { id: "r32-m4", left: "1I", right: "3CDFGH" },
      { id: "r32-m5", left: "1A", right: "3CEFHI" },
      { id: "r32-m6", left: "1L", right: "3EHIJK" },
      { id: "r32-m7", left: "1G", right: "3AEHIJ" },
      { id: "r32-m8", left: "1D", right: "3BEFIJ" },
      { id: "r32-m9", left: "1H", right: "2J" },
      { id: "r32-m10", left: "1B", right: "3EFGIJ" },
      { id: "r32-m11", left: "1J", right: "2H" },
      { id: "r32-m12", left: "1K", right: "3DEIJL" },
      { id: "r32-m13", left: "2K", right: "2L" },
      { id: "r32-m14", left: "2D", right: "2G" },
      { id: "r32-m15", left: "2A", right: "2B" },
      { id: "r32-m16", left: "2E", right: "2I" },
    ],
  },
  {
    name: "Round of 16",
    matches: [
      { id: "r16-m1", left: "W_r32-m1", right: "W_r32-m2" },
      { id: "r16-m2", left: "W_r32-m3", right: "W_r32-m4" },
      { id: "r16-m3", left: "W_r32-m5", right: "W_r32-m6" },
      { id: "r16-m4", left: "W_r32-m7", right: "W_r32-m8" },
      { id: "r16-m5", left: "W_r32-m9", right: "W_r32-m10" },
      { id: "r16-m6", left: "W_r32-m11", right: "W_r32-m12" },
      { id: "r16-m7", left: "W_r32-m13", right: "W_r32-m14" },
      { id: "r16-m8", left: "W_r32-m15", right: "W_r32-m16" },
    ],
  },
  {
    name: "Quarterfinals",
    matches: [
      { id: "qf-m1", left: "W_r16-m1", right: "W_r16-m2" },
      { id: "qf-m2", left: "W_r16-m3", right: "W_r16-m4" },
      { id: "qf-m3", left: "W_r16-m5", right: "W_r16-m6" },
      { id: "qf-m4", left: "W_r16-m7", right: "W_r16-m8" },
    ],
  },
  {
    name: "Semifinals",
    matches: [
      { id: "sf-m1", left: "W_qf-m1", right: "W_qf-m2" },
      { id: "sf-m2", left: "W_qf-m3", right: "W_qf-m4" },
    ],
  },
  {
    name: "Final",
    matches: [
      { id: "f-m1", left: "W_sf-m1", right: "W_sf-m2" },
    ],
  },
];
 
/* ── Sessão ───────────────────────────────────────────────────────────────── */
 
function saveSession(token, user) {
  sessionStorage.setItem("bolao_token", token);
  sessionStorage.setItem("bolao_user", JSON.stringify(user));
}
 
function loadSession() {
  const token = sessionStorage.getItem("bolao_token");
  const raw   = sessionStorage.getItem("bolao_user");
  if (!token || !raw) return false;
  try {
    state.token = token;
    state.user  = JSON.parse(raw);
    return true;
  } catch { return false; }
}
 
function clearSession() {
  sessionStorage.removeItem("bolao_token");
  sessionStorage.removeItem("bolao_user");
  state.token = null; state.user = null;
  state.palpites = {}; state.jogos = [];
}
function loadBracketSession() {
  try {
    const saved = localStorage.getItem("bolao_bracket");
    state.bracketPalpites = saved ? JSON.parse(saved) : {};
  } catch {
    state.bracketPalpites = {};
  }
}

function saveBracketSession() {
  try {
    localStorage.setItem("bolao_bracket", JSON.stringify(state.bracketPalpites));
  } catch {
    // ignore storage errors
  }
}/* ── API ──────────────────────────────────────────────────────────────────── */
 
async function api(method, path, body = null) {
  const headers = { "Content-Type": "application/json" };
  if (state.token) headers["Authorization"] = `Bearer ${state.token}`;
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method, headers,
      body: body ? JSON.stringify(body) : null,
    });
  } catch {
    throw new Error("Servidor offline. Verifique se o backend está rodando na porta 3000.");
  }
  let data = {};
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) throw new Error(data.error || `Erro HTTP ${res.status}`);
  return data;
}

async function fetchAndNormalizeJogos() {
  const jogos = await api("GET", "/jogos");
  const nameMap = {
    "república da coreia": "Coreia do Sul",
    "coreia do sul": "Coreia do Sul",
    "curaçau": "Curaçao",
    "rep. democrática do congo": "República Democrática do Congo",
    "república democrática do congo": "República Democrática do Congo"
  };
  return Array.isArray(jogos) ? jogos.map(j => {
    const rawA = String(j.time_a || "").trim();
    const rawB = String(j.time_b || "").trim();
    return {
      ...j,
      time_a: nameMap[rawA.toLowerCase()] || rawA,
      time_b: nameMap[rawB.toLowerCase()] || rawB
    };
  }) : [];
}
 
/* ── Toast ────────────────────────────────────────────────────────────────── */
 
function showToast(msg, type = "info", duration = 4000) {
  const container = document.getElementById("toast-container");
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span class="toast__icon">${icons[type]||"ℹ️"}</span><span class="toast__msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("fade-out");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, duration);
}
 
/* ── UI helpers ───────────────────────────────────────────────────────────── */
 
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}
 
function showSection(id) {
  document.querySelectorAll(".content-section").forEach(s => s.classList.remove("active"));
  document.getElementById(`section-${id}`).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.section === id)
  );
}
 
function setLoading(btn, loading) {
  const text = btn.querySelector(".btn-text");
  const spin = btn.querySelector(".btn-spinner");
  btn.disabled = loading;
  if (text) text.hidden = loading;
  if (spin) spin.hidden = !loading;
}
 
function setFormError(id, msg) {
  const el = document.getElementById(`${id}-error`);
  if (!el) return;
  el.textContent = msg;
  el.hidden = !msg;
}
 
function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(iso));
  } catch { return iso; }
}
 
function getGameStatus(jogo) {
  if (jogo.gols_a !== null && jogo.gols_b !== null) return "encerrado";
  
  // Prazo limite global do bolão
  const deadlineStr = state.config?.global_deadline || "2026-06-11T16:00:00-03:00";
  const globalDeadline = new Date(deadlineStr);
  if (new Date() >= globalDeadline) return "encerrado";

  if (new Date() >= new Date(jogo.data_hora)) return "em-andamento";
  return "aberto";
}

function buildGroupStandings(groupCode) {
  const teams = GROUPS[groupCode] || [];
  const board = teams.map(nome => ({
    nome,
    jogos: 0,
    vitorias: 0,
    empates: 0,
    derrotas: 0,
    gols_pro: 0,
    gols_contra: 0,
    saldo: 0,
    pontos: 0,
  }));
  const byName = Object.fromEntries(board.map(item => [item.nome, item]));

  state.jogos.forEach(jogo => {
    const isGroupMatch = teams.includes(jogo.time_a) && teams.includes(jogo.time_b);
    if (!isGroupMatch) return;

    // Use user guesses (palpites) if official result is not available
    let gols_a = jogo.gols_a;
    let gols_b = jogo.gols_b;
    if (gols_a === null || gols_b === null) {
      const p = state.palpites[jogo.id];
      if (p && p.palpite_gols_a !== null && p.palpite_gols_b !== null) {
        gols_a = p.palpite_gols_a;
        gols_b = p.palpite_gols_b;
      }
    }

    if (gols_a === null || gols_b === null) return;

    const home = byName[jogo.time_a];
    const away = byName[jogo.time_b];
    if (!home || !away) return;

    home.jogos += 1;
    away.jogos += 1;
    home.gols_pro += gols_a;
    home.gols_contra += gols_b;
    away.gols_pro += gols_b;
    away.gols_contra += gols_a;

    if (gols_a > gols_b) {
      home.vitorias += 1;
      away.derrotas += 1;
      home.pontos += 3;
    } else if (gols_a < gols_b) {
      away.vitorias += 1;
      home.derrotas += 1;
      away.pontos += 3;
    } else {
      home.empates += 1;
      away.empates += 1;
      home.pontos += 1;
      away.pontos += 1;
    }
  });

  board.forEach(item => {
    item.saldo = item.gols_pro - item.gols_contra;
  });

  return board.sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (b.saldo !== a.saldo) return b.saldo - a.saldo;
    if (b.gols_pro !== a.gols_pro) return b.gols_pro - a.gols_pro;
    if (a.gols_contra !== b.gols_contra) return a.gols_contra - b.gols_contra;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });
}

function formatDateShort(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "2-digit",
      hour: "2-digit", minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(iso));
  } catch { return ""; }
}



function triggerConfettiAroundElement(element) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2 + window.scrollX;
  const y = rect.top + rect.height / 2 + window.scrollY;
  
  const colors = ["#009a44", "#c8102e", "#002868", "#d4af37", "#ffffff"];
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "100%";
  container.style.height = "100%";
  container.style.pointerEvents = "none";
  container.style.zIndex = "9999";
  document.body.appendChild(container);
  
  for (let i = 0; i < 20; i++) {
    const p = document.createElement("div");
    p.style.position = "absolute";
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.width = `${Math.random() * 6 + 6}px`;
    p.style.height = `${Math.random() * 6 + 6}px`;
    p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    p.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
    p.style.transition = "transform 1s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 1s ease";
    
    container.appendChild(p);
    
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 60 + 40;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    
    setTimeout(() => {
      p.style.transform = `translate(${tx}px, ${ty}px) rotate(${Math.random() * 360}deg)`;
      p.style.opacity = "0";
    }, 10);
  }
  
  setTimeout(() => {
    container.remove();
  }, 1100);
}

async function handleGroupGameAutoSave(jogoId) {
  const inputA = document.getElementById(`group-gols-a-${jogoId}`);
  const inputB = document.getElementById(`group-gols-b-${jogoId}`);
  
  if (!inputA || !inputB) return;
  if (inputA.value === "" || inputB.value === "") return;
  
  const gols_a = parseInt(inputA.value, 10);
  const gols_b = parseInt(inputB.value, 10);
  
  if (isNaN(gols_a) || isNaN(gols_b) || gols_a < 0 || gols_b < 0) {
    showToast("Os gols devem ser números ≥ 0.", "error");
    return;
  }
  
  try {
    await api("POST", "/palpites", { jogo_id: jogoId, palpite_gols_a: gols_a, palpite_gols_b: gols_b });
    state.palpites[jogoId] = { jogo_id: jogoId, palpite_gols_a: gols_a, palpite_gols_b: gols_b };
    
    showToast("Palpite salvo com sucesso! ⚽", "success");
    triggerConfettiAroundElement(inputA);
    renderGroupStandings();
  } catch (err) {
    showToast("Erro ao salvar palpite: " + err.message, "error");
  }
}

function renderGroupStandings() {
  const container = document.getElementById("group-standings");
  if (!container) return;

  container.innerHTML = Object.keys(GROUPS).map(code => {
    const board = buildGroupStandings(code);
    const rows = board.map((team, index) => `
      <tr>
        <td>${index + 1}</td>
        <td class="team-name-cell"><div style="display: flex; align-items: center; gap: 8px;">${getTeamFlagHtml(team.nome)} <span class="team-name-text">${esc(team.nome)}</span></div></td>
        <td class="pts-cell">${team.pontos}</td>
        <td>${team.jogos}</td>
        <td>${team.vitorias}</td>
        <td>${team.empates}</td>
        <td>${team.derrotas}</td>
        <td>${team.gols_pro}</td>
        <td>${team.gols_contra}</td>
        <td class="saldo-cell">${team.saldo > 0 ? "+" + team.saldo : team.saldo}</td>
      </tr>
    `).join("");

    // Group matches and sort chronologically
    const groupMatches = state.jogos
      .filter(jogo => GROUPS[code].includes(jogo.time_a) && GROUPS[code].includes(jogo.time_b))
      .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));

    let matchesHtml = "";
    groupMatches.forEach((jogo, index) => {
      const status = getGameStatus(jogo);
      const palpite = state.palpites[jogo.id];
      const locked = status !== "aberto";
      const valA = palpite != null ? palpite.palpite_gols_a : "";
      const valB = palpite != null ? palpite.palpite_gols_b : "";
      
      const round = Math.floor(index / 2) + 1;
      const estadioInfo = ESTADIOS_COPA[jogo.id % ESTADIOS_COPA.length];
      
      if (index % 2 === 0) {
        matchesHtml += `<div class="group-round-title">${round}ª Rodada</div>`;
      }
      
      matchesHtml += `
        <div class="group-match-row round-${round} ${status}">
          <div class="ticket-notch notch-l"></div>
          <div class="ticket-notch notch-r"></div>
          <div class="ticket-stub">
            <span class="group-match-date">${formatDateShort(jogo.data_hora)}</span>
            <div class="ticket-barcode"></div>
          </div>
          <div class="ticket-body">
            <div class="ticket-venue">
              📍 ${estadioInfo.estadio} — ${estadioInfo.cidade}
            </div>
            <div class="group-match-teams">
              <span class="team-lbl right-align" style="display: inline-flex; align-items: center; justify-content: flex-end; gap: 6px;">
                ${esc(jogo.time_a)} ${getTeamFlagHtml(jogo.time_a)}
              </span>
              <input type="number" min="0" max="99" class="group-score-input"
                id="group-gols-a-${jogo.id}" data-jogo-id="${jogo.id}" value="${valA}" placeholder="0"
                ${locked ? "disabled" : ""} />
              <span class="vs">x</span>
              <input type="number" min="0" max="99" class="group-score-input"
                id="group-gols-b-${jogo.id}" data-jogo-id="${jogo.id}" value="${valB}" placeholder="0"
                ${locked ? "disabled" : ""} />
              <span class="team-lbl left-align" style="display: inline-flex; align-items: center; justify-content: flex-start; gap: 6px;">
                ${getTeamFlagHtml(jogo.time_b)} ${esc(jogo.time_b)}
              </span>
            </div>
            ${locked ? `<span class="locked-icon" title="Jogo encerrado ou em andamento">🔒</span>` : ""}
          </div>
        </div>
      `;
    });

    return `
      <div class="group-standings-card">
        <div class="group-standings-header">
          <h3>Grupo ${code}</h3>
        </div>
        <div class="group-standings-table-wrap">
          <table class="group-standings-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Time</th>
                <th>P</th>
                <th>J</th>
                <th>V</th>
                <th>E</th>
                <th>D</th>
                <th>GP</th>
                <th>GC</th>
                <th>SG</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="group-card-matches">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
            <h4 style="margin: 0;">Jogos</h4>
          </div>
          <div class="group-matches-list" id="matches-list-${code}">${matchesHtml}</div>
        </div>
      </div>`;
  }).join("");

  container.querySelectorAll(".group-score-input").forEach(input => {
    input.addEventListener("change", () => handleGroupGameAutoSave(Number(input.dataset.jogoId)));
  });
}

async function loadGroupStandings() {
  const container = document.getElementById("group-standings");
  if (container && (!state.jogos || state.jogos.length === 0)) {
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Carregando classificação...</p>
      </div>`;
  }
  
  try {
    await fetchConfig();
    const [jogos, meusPalpites] = await Promise.all([
      (!state.jogos || state.jogos.length === 0) ? fetchAndNormalizeJogos() : Promise.resolve(state.jogos),
      api("GET", "/palpites/meus")
    ]);
    
    state.jogos = jogos;
    state.palpites = {};
    meusPalpites.forEach(p => {
      state.palpites[p.jogo_id] = p;
    });

    renderGroupStandings();
  } catch (err) {
    if (container) {
      container.innerHTML = `<p class="form-error">Erro ao carregar classificação: ${err.message}</p>`;
    }
  }
}



async function fetchConfig() {
  if (state.config && Object.keys(state.config).length > 0) return;
  try {
    state.config = await api("GET", "/config");
  } catch (err) {
    state.config = { global_deadline: "2026-06-11T16:00:00-03:00" };
  }
}

function updateDeadlineBanner() {
  const banner = document.getElementById("deadline-banner");
  if (!banner) return;
  
  const deadlineStr = state.config?.global_deadline || "2026-06-11T16:00:00-03:00";
  const deadline = new Date(deadlineStr);
  const agora = new Date();
  
  const formattedDate = deadline.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo"
  });

  if (agora >= deadline) {
    banner.className = "deadline-banner locked";
    banner.innerHTML = `<span>🔒</span> <strong>Palpites encerrados!</strong> O prazo limite para todas as apostas expirou em ${formattedDate}.`;
    banner.hidden = false;
  } else {
    banner.className = "deadline-banner pending";
    banner.innerHTML = `<span>⏰</span> <strong>Prazo limite:</strong> Envie ou edite seus palpites até dia ${formattedDate}.`;
    banner.hidden = false;
  }
}



function esc(str) {
  return String(str || "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function isGroupSimulatedOrPlayed(groupCode) {
  if (!state.jogos || state.jogos.length === 0) return false;
  const teams = GROUPS[groupCode] || [];
  return state.jogos.some(jogo => {
    const isGroupMatch = teams.includes(jogo.time_a) && teams.includes(jogo.time_b);
    if (!isGroupMatch) return false;
    const hasOfficial = jogo.gols_a !== null && jogo.gols_b !== null;
    const hasPalpite = state.palpites && state.palpites[jogo.id] != null && 
                       state.palpites[jogo.id].palpite_gols_a !== null && 
                       state.palpites[jogo.id].palpite_gols_b !== null;
    return hasOfficial || hasPalpite;
  });
}

function getGroupRankings() {
  return Object.fromEntries(Object.keys(GROUPS).map(code => [code, buildGroupStandings(code)]));
}

function sortQualificationTeams(left, right) {
  if (right.pontos !== left.pontos) return right.pontos - left.pontos;
  if (right.saldo !== left.saldo) return right.saldo - left.saldo;
  if (right.gols_pro !== left.gols_pro) return right.gols_pro - left.gols_pro;
  if (left.gols_contra !== right.gols_contra) return left.gols_contra - right.gols_contra;
  return left.nome.localeCompare(right.nome, "pt-BR");
}

function getBestThirdTeams() {
  const groupRankings = getGroupRankings();
  const thirds = Object.entries(groupRankings)
    .map(([code, board]) => ({
      group: code,
      team: isGroupSimulatedOrPlayed(code) ? board[2] : null,
    }))
    .filter(item => item.team && item.team.nome);

  return thirds.sort((a, b) => sortQualificationTeams(a.team, b.team)).slice(0, 8);
}

function computeThirdPlaceAssignments() {
  state.thirdPlaceAssignments = {};
  
  const groupRankings = getGroupRankings();
  const thirds = Object.entries(groupRankings)
    .map(([code, board]) => ({
      group: code,
      team: isGroupSimulatedOrPlayed(code) ? board[2] : null,
    }))
    .filter(item => item.team && item.team.nome)
    .map(item => ({
      group: item.group,
      teamName: item.team.nome,
      pontos: item.team.pontos,
      saldo: item.team.saldo,
      gols_pro: item.team.gols_pro,
      gols_contra: item.team.gols_contra,
      nome: item.team.nome
    }));

  thirds.sort(sortQualificationTeams);
  const qualifyingThirds = thirds.slice(0, 8);

  const slots = [
    { id: "3ABCDF", groups: ["A", "B", "C", "D", "F"] },
    { id: "3CDFGH", groups: ["C", "D", "F", "G", "H"] },
    { id: "3CEFHI", groups: ["C", "E", "F", "H", "I"] },
    { id: "3EHIJK", groups: ["E", "H", "I", "J", "K"] },
    { id: "3AEHIJ", groups: ["A", "E", "H", "I", "J"] },
    { id: "3BEFIJ", groups: ["B", "E", "F", "I", "J"] },
    { id: "3EFGIJ", groups: ["E", "F", "G", "I", "J"] },
    { id: "3DEIJL", groups: ["D", "E", "I", "J", "L"] }
  ];

  let bestAssignment = {};
  let maxMatched = -1;

  function backtrack(slotIndex, currentAssignment, assignedGroups, matchedCount) {
    if (slotIndex === slots.length) {
      if (matchedCount > maxMatched) {
        maxMatched = matchedCount;
        bestAssignment = { ...currentAssignment };
      }
      return;
    }

    const slot = slots[slotIndex];

    for (let i = 0; i < qualifyingThirds.length; i++) {
      const t = qualifyingThirds[i];
      if (assignedGroups.has(t.group)) continue;
      if (slot.groups.includes(t.group)) {
        assignedGroups.add(t.group);
        currentAssignment[slot.id] = t.teamName;
        backtrack(slotIndex + 1, currentAssignment, assignedGroups, matchedCount + 1);
        assignedGroups.delete(t.group);
        delete currentAssignment[slot.id];
      }
    }

    currentAssignment[slot.id] = null;
    backtrack(slotIndex + 1, currentAssignment, assignedGroups, matchedCount);
    delete currentAssignment[slot.id];
  }

  backtrack(0, {}, new Set(), 0);
  state.thirdPlaceAssignments = bestAssignment;
}

function resolveQualification(slot) {
  if (!slot) return "—";
  if (/^[12][A-L]$/.test(slot)) {
    const position = Number(slot[0]);
    const group = slot[1];
    if (!isGroupSimulatedOrPlayed(group)) {
      return `${position}º Grupo ${group}`;
    }
    const board = buildGroupStandings(group);
    const team = board[position - 1];
    return team ? team.nome : `${position}º Grupo ${group}`;
  }

  if (/^3[A-L]{2,6}$/.test(slot)) {
    if (state.thirdPlaceAssignments && state.thirdPlaceAssignments[slot]) {
      return state.thirdPlaceAssignments[slot];
    }
    const groups = slot.slice(1).split("");
    return `3º melhor (${groups.join("/ ")})`;
  }

  if (/^W_/.test(slot)) {
    const winner = getKnockoutMatchWinner(slot.slice(2));
    return winner || `Vencedor ${slot.slice(2)}`;
  }

  if (/^L_/.test(slot)) {
    const loser = getKnockoutMatchLoser(slot.slice(2));
    return loser || `Perdedor ${slot.slice(2)}`;
  }

  return slot;
}

function getBracketLabel(source) {
  if (!source) return "—";
  return resolveQualification(source);
}

function formatSlotLabel(slot) {
  if (!slot) return "—";
  if (/^([12])([A-L])$/.test(slot)) {
    const position = Number(RegExp.$1);
    const group = RegExp.$2;
    return `${position}º${group}`;
  }
  if (/^3[A-L]{2,6}$/.test(slot)) {
    return "3ºs";
  }
  if (/^W_/.test(slot)) {
    return "Vencedor";
  }
  if (/^L_/.test(slot)) {
    return "Perdedor";
  }
  return slot;
}

function renderBestThirdTeams() {
  const container = document.getElementById("best-third-teams");
  if (!container) return;
  const bestThirds = getBestThirdTeams();

  if (bestThirds.length === 0) {
    container.innerHTML = `
      <div class="best-third-note">
        <strong>Ranking dos 8 melhores 3ºs:</strong> aguarde resultados dos grupos para preencher.
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="best-third-note">
      <strong>Melhores 3ºs (top 8):</strong>
      ${bestThirds.map(item => `${esc(item.group)}: ${esc(item.team.nome)} (${item.team.pontos} pts, SG ${item.team.saldo})`).join(" • ")}
    </div>`;
}

function getBracketHalves() {
  const round32 = KNOCKOUT_ROUNDS[0].matches;
  const round16 = KNOCKOUT_ROUNDS[1].matches;
  const quarters = KNOCKOUT_ROUNDS[2].matches;
  const semis = KNOCKOUT_ROUNDS[3].matches;
  return {
    left32: round32.slice(0, 8),
    right32: round32.slice(8),
    left16: round16.slice(0, 4),
    right16: round16.slice(4),
    leftQuarters: quarters.slice(0, 2),
    rightQuarters: quarters.slice(2),
    leftSemis: [semis[0]],
    rightSemis: [semis[1]],
  };
}

function getDisplayName(slot) {
  const resolved = getBracketLabel(slot);
  if (resolved.includes("Grupo") || resolved.includes("melhor") || resolved.includes("Vencedor") || resolved.includes("Perdedor")) {
    return formatSlotLabel(slot);
  }
  return resolved;
}

function renderBracketMatch(match, alignment) {
  const palpite = state.bracketPalpites[match.id] || {};
  const leftText = getDisplayName(match.left);
  const rightText = getDisplayName(match.right);
  const leftSelected = palpite.picked === "left";
  const rightSelected = palpite.picked === "right";

  const renderTeam = (teamText, side, isRightSide) => {
    const flagHtml = getTeamFlagHtml(teamText);
    const circleHtml = `<button type="button" class="bracket-team-circle ${side === "left" ? (leftSelected ? "selected" : "") : (rightSelected ? "selected" : "")}" id="circle-${match.id}-${side}" data-match="${match.id}" data-side="${side}" title="${esc(teamText)}"></button>`;
    
    const labelContent = isRightSide
      ? `${flagHtml} <span class="bracket-team-text">${esc(teamText)}</span>`
      : `<span class="bracket-team-text">${esc(teamText)}</span> ${flagHtml}`;

    const labelHtml = `<span class="bracket-team-label ${side === "left" ? (leftSelected ? "active" : "") : (rightSelected ? "active" : "")}" style="display: inline-flex; align-items: center; gap: 4px;">${labelContent}</span>`;
    
    return isRightSide 
      ? `<div class="bracket-team right-align">${circleHtml}${labelHtml}</div>`
      : `<div class="bracket-team left-align">${labelHtml}${circleHtml}</div>`;
  };

  const isRight = alignment.startsWith("right");
  return `
    <div class="bracket-match-pair" data-match="${match.id}">
      ${renderTeam(leftText, "left", isRight)}
      ${renderTeam(rightText, "right", isRight)}
    </div>`;
}

function renderKnockoutBracket() {
  const container = document.getElementById("knockout-bracket");
  if (!container) return;

  const {
    left32, right32,
    left16, right16,
    leftQuarters, rightQuarters,
    leftSemis, rightSemis
  } = getBracketHalves();
  
  const finalMatch = KNOCKOUT_ROUNDS[4].matches[0];
  const finalPalpite = state.bracketPalpites[finalMatch.id] || {};
  const finalLeftText = getDisplayName(finalMatch.left);
  const finalRightText = getDisplayName(finalMatch.right);
  const finalLeftSelected = finalPalpite.picked === "left";
  const finalRightSelected = finalPalpite.picked === "right";
  
  const championName = getKnockoutMatchWinner(finalMatch.id);
  const hasChampion = !!championName;
  const championText = hasChampion ? championName : "Escolha o Campeão";

  const html = `
    <div class="bracket-grid">
      <!-- Canvas SVG para conexões -->
      <svg id="bracket-svg" class="bracket-svg"></svg>

      <!-- Coluna 1: 16-avos Esquerda -->
      <div class="bracket-column bracket-column-left-32">
        <div class="bracket-column-title">16-avos</div>
        ${left32.map(match => renderBracketMatch(match, "left-32")).join("")}
      </div>

      <!-- Coluna 2: Oitavas Esquerda -->
      <div class="bracket-column bracket-column-left-16">
        <div class="bracket-column-title">Oitavas</div>
        ${left16.map(match => renderBracketMatch(match, "left-16")).join("")}
      </div>

      <!-- Coluna 3: Quartas Esquerda -->
      <div class="bracket-column bracket-column-left-qf">
        <div class="bracket-column-title">Quartas</div>
        ${leftQuarters.map(match => renderBracketMatch(match, "left-qf")).join("")}
      </div>

      <!-- Coluna 4: Semifinal Esquerda -->
      <div class="bracket-column bracket-column-left-sf">
        <div class="bracket-column-title">Semifinal</div>
        ${leftSemis.map(match => renderBracketMatch(match, "left-sf")).join("")}
      </div>

      <!-- Coluna 5: Centro (Final & Troféu) -->
      <div class="bracket-column-center">
        <div class="bracket-center-instruction">
          Clique nos vencedores<br>de cada confronto, para fazer a sua simulação.
        </div>
        
        <div class="bracket-final-wrap">
          <!-- Finalista Esquerdo -->
          <div class="bracket-team left-align">
            <span class="bracket-team-label ${finalLeftSelected ? "active" : ""}" style="display: inline-flex; align-items: center; gap: 4px;">${esc(finalLeftText)} ${getTeamFlagHtml(finalLeftText)}</span>
            <button type="button" class="bracket-team-circle ${finalLeftSelected ? "selected" : ""}" id="circle-${finalMatch.id}-left" data-match="${finalMatch.id}" data-side="left" title="${esc(finalLeftText)}"></button>
          </div>
          
          <!-- Troféu Central -->
          <div class="bracket-trophy-container">
            <div class="bracket-trophy-circle ${hasChampion ? "has-champion" : ""}" id="circle-champion" title="${hasChampion ? 'Campeão: ' + championName : 'Campeão'}">
              🏆
            </div>
            <div class="bracket-champion-label ${hasChampion ? "active" : ""}" style="display: flex; align-items: center; justify-content: center; gap: 6px;">
              ${hasChampion ? getTeamFlagHtml(championName) : ""}
              <span>${esc(championText)}</span>
            </div>
          </div>
          
          <!-- Finalista Direito -->
          <div class="bracket-team right-align">
            <button type="button" class="bracket-team-circle ${finalRightSelected ? "selected" : ""}" id="circle-${finalMatch.id}-right" data-match="${finalMatch.id}" data-side="right" title="${esc(finalRightText)}"></button>
            <span class="bracket-team-label ${finalRightSelected ? "active" : ""}" style="display: inline-flex; align-items: center; gap: 4px;">${getTeamFlagHtml(finalRightText)} ${esc(finalRightText)}</span>
          </div>
        </div>
      </div>

      <!-- Coluna 6: Semifinal Direita -->
      <div class="bracket-column bracket-column-right-sf">
        <div class="bracket-column-title">Semifinal</div>
        ${rightSemis.map(match => renderBracketMatch(match, "right-sf")).join("")}
      </div>

      <!-- Coluna 7: Quartas Direita -->
      <div class="bracket-column bracket-column-right-qf">
        <div class="bracket-column-title">Quartas</div>
        ${rightQuarters.map(match => renderBracketMatch(match, "right-qf")).join("")}
      </div>

      <!-- Coluna 8: Oitavas Direita -->
      <div class="bracket-column bracket-column-right-16">
        <div class="bracket-column-title">Oitavas</div>
        ${right16.map(match => renderBracketMatch(match, "right-16")).join("")}
      </div>

      <!-- Coluna 9: 16-avos Direita -->
      <div class="bracket-column bracket-column-right-32">
        <div class="bracket-column-title">16-avos</div>
        ${right32.map(match => renderBracketMatch(match, "right-32")).join("")}
      </div>
    </div>`;

  container.innerHTML = html;

  container.querySelectorAll(".bracket-team-circle").forEach(button => {
    button.addEventListener("click", (event) => {
      const target = event.currentTarget;
      const matchId = target.dataset.match;
      const side = target.dataset.side;
      pickBracketWinner(matchId, side);
    });
  });

  setTimeout(drawBracketLines, 50);
}

function drawBracketLines() {
  const svg = document.getElementById("bracket-svg");
  if (!svg) return;
  svg.innerHTML = "";

  const svgRect = svg.getBoundingClientRect();
  if (svgRect.width === 0 || svgRect.height === 0) return;

  const circleRadius = 14;

  function getCircleCenter(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: r.left - svgRect.left + r.width / 2,
      y: r.top - svgRect.top + r.height / 2
    };
  }

  const connections = [
    // 16-avos para Oitavas (Esquerda)
    { src: "r32-m1", dest: "circle-r16-m1-left" },
    { src: "r32-m2", dest: "circle-r16-m1-right" },
    { src: "r32-m3", dest: "circle-r16-m2-left" },
    { src: "r32-m4", dest: "circle-r16-m2-right" },
    { src: "r32-m5", dest: "circle-r16-m3-left" },
    { src: "r32-m6", dest: "circle-r16-m3-right" },
    { src: "r32-m7", dest: "circle-r16-m4-left" },
    { src: "r32-m8", dest: "circle-r16-m4-right" },

    // 16-avos para Oitavas (Direita)
    { src: "r32-m9", dest: "circle-r16-m5-left" },
    { src: "r32-m10", dest: "circle-r16-m5-right" },
    { src: "r32-m11", dest: "circle-r16-m6-left" },
    { src: "r32-m12", dest: "circle-r16-m6-right" },
    { src: "r32-m13", dest: "circle-r16-m7-left" },
    { src: "r32-m14", dest: "circle-r16-m7-right" },
    { src: "r32-m15", dest: "circle-r16-m8-left" },
    { src: "r32-m16", dest: "circle-r16-m8-right" },

    // Oitavas para Quartas (Esquerda)
    { src: "r16-m1", dest: "circle-qf-m1-left" },
    { src: "r16-m2", dest: "circle-qf-m1-right" },
    { src: "r16-m3", dest: "circle-qf-m2-left" },
    { src: "r16-m4", dest: "circle-qf-m2-right" },

    // Oitavas para Quartas (Direita)
    { src: "r16-m5", dest: "circle-qf-m3-left" },
    { src: "r16-m6", dest: "circle-qf-m3-right" },
    { src: "r16-m7", dest: "circle-qf-m4-left" },
    { src: "r16-m8", dest: "circle-qf-m4-right" },

    // Quartas para Semifinais (Esquerda)
    { src: "qf-m1", dest: "circle-sf-m1-left" },
    { src: "qf-m2", dest: "circle-sf-m1-right" },

    // Quartas para Semifinais (Direita)
    { src: "qf-m3", dest: "circle-sf-m2-left" },
    { src: "qf-m4", dest: "circle-sf-m2-right" },

    // Semifinais para Final
    { src: "sf-m1", dest: "circle-f-m1-left" },
    { src: "sf-m2", dest: "circle-f-m1-right" },

    // Final para o Campeão
    { src: "f-m1", dest: "circle-champion" }
  ];

  connections.forEach(({ src, dest }) => {
    const cDest = getCircleCenter(dest);
    if (!cDest) return;

    if (src === "f-m1") {
      const cLeft = getCircleCenter("circle-f-m1-left");
      const cRight = getCircleCenter("circle-f-m1-right");
      const palpite = state.bracketPalpites["f-m1"] || {};
      const leftSelected = palpite.picked === "left";
      const rightSelected = palpite.picked === "right";

      if (cLeft) {
        const pathL = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathL.setAttribute("d", `M ${cLeft.x + circleRadius} ${cLeft.y} H ${cDest.x - 38}`);
        pathL.setAttribute("class", `bracket-svg-path ${leftSelected ? "active" : ""}`);
        svg.appendChild(pathL);
      }
      if (cRight) {
        const pathR = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathR.setAttribute("d", `M ${cRight.x - circleRadius} ${cRight.y} H ${cDest.x + 38}`);
        pathR.setAttribute("class", `bracket-svg-path ${rightSelected ? "active" : ""}`);
        svg.appendChild(pathR);
      }
      return;
    }

    const cSrcLeft = getCircleCenter(`circle-${src}-left`);
    const cSrcRight = getCircleCenter(`circle-${src}-right`);
    if (!cSrcLeft || !cSrcRight) return;

    const isLeftToRight = cDest.x > cSrcLeft.x;
    const xs = isLeftToRight ? cSrcLeft.x + circleRadius : cSrcLeft.x - circleRadius;
    const xd = isLeftToRight ? cDest.x - circleRadius : cDest.x + circleRadius;
    
    const offset = isLeftToRight ? 18 : -18;
    const xm = xs + offset;

    const palpite = state.bracketPalpites[src] || {};
    const pickedA = palpite.picked === "left";
    const pickedB = palpite.picked === "right";
    const hasWinner = pickedA || pickedB;

    const pathA = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathA.setAttribute("d", `M ${xs} ${cSrcLeft.y} H ${xm} V ${cDest.y}`);
    pathA.setAttribute("class", `bracket-svg-path ${pickedA ? "active" : ""}`);
    svg.appendChild(pathA);

    const pathB = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathB.setAttribute("d", `M ${xs} ${cSrcRight.y} H ${xm} V ${cDest.y}`);
    pathB.setAttribute("class", `bracket-svg-path ${pickedB ? "active" : ""}`);
    svg.appendChild(pathB);

    const pathC = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathC.setAttribute("d", `M ${xm} ${cDest.y} H ${xd}`);
    pathC.setAttribute("class", `bracket-svg-path ${hasWinner ? "active" : ""}`);
    svg.appendChild(pathC);
  });
}

function getKnockoutMatchById(matchId) {
  return KNOCKOUT_ROUNDS.flatMap(round => round.matches).find(match => match.id === matchId);
}

function pickBracketWinner(matchId, side) {
  const match = getKnockoutMatchById(matchId);
  if (!match) return;

  state.bracketPalpites[matchId] = {
    left: match.left,
    right: match.right,
    picked: side,
  };
  saveBracketSession();
  renderKnockoutBracket();
}

function getKnockoutMatchWinner(matchId) {
  const palpite = state.bracketPalpites[matchId];
  if (palpite && palpite.picked) {
    return resolveQualification(palpite[palpite.picked]);
  }
  if (!palpite || palpite.scoreA == null || palpite.scoreB == null) return null;
  if (palpite.scoreA > palpite.scoreB) return resolveQualification(palpite.left);
  if (palpite.scoreB > palpite.scoreA) return resolveQualification(palpite.right);
  return null;
}

function getKnockoutMatchLoser(matchId) {
  const palpite = state.bracketPalpites[matchId];
  if (palpite && palpite.picked) {
    const loserSide = palpite.picked === "left" ? "right" : "left";
    return resolveQualification(palpite[loserSide]);
  }
  if (!palpite || palpite.scoreA == null || palpite.scoreB == null) return null;
  if (palpite.scoreA > palpite.scoreB) return resolveQualification(palpite.right);
  if (palpite.scoreB > palpite.scoreA) return resolveQualification(palpite.left);
  return null;
}

async function loadKnockoutBracket() {
  const container = document.getElementById("knockout-bracket");
  if (container && (!state.jogos || state.jogos.length === 0)) {
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Carregando chaveamento...</p>
      </div>`;
  }
  
  try {
    await fetchConfig();
    const [jogos, meusPalpites] = await Promise.all([
      (!state.jogos || state.jogos.length === 0) ? fetchAndNormalizeJogos() : Promise.resolve(state.jogos),
      api("GET", "/palpites/meus")
    ]);
    
    state.jogos = jogos;
    state.palpites = {};
    meusPalpites.forEach(p => {
      state.palpites[p.jogo_id] = p;
    });
    
    computeThirdPlaceAssignments();
    renderBestThirdTeams();
    renderKnockoutBracket();
  } catch (err) {
    showToast("Erro ao carregar chaveamento: " + err.message, "error");
  }
}
 
/* ── Auth ─────────────────────────────────────────────────────────────────── */
 
async function handleLogin(e) {
  e.preventDefault();
  setFormError("login", "");
  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-senha").value;
  const btn   = document.getElementById("btn-login");
  if (!email || !senha) { setFormError("login", "Preencha todos os campos."); return; }
  setLoading(btn, true);
  try {
    const data  = await api("POST", "/auth/login", { email, senha });
    state.token = data.session?.access_token;
    state.user  = data.user;
    saveSession(state.token, state.user);
    window.location.href = "app.html";
  } catch (err) {
    setFormError("login", err.message);
  } finally { setLoading(btn, false); }
}
 
async function handleSignup(e) {
  e.preventDefault();
  setFormError("signup", "");
  const nome  = document.getElementById("signup-nome").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const senha = document.getElementById("signup-senha").value;
  const btn   = document.getElementById("btn-signup");
  if (!nome || !email || !senha) { setFormError("signup", "Preencha todos os campos."); return; }
  setLoading(btn, true);
  try {
    const data  = await api("POST", "/auth/signup", { nome, email, senha });
    state.token = data.session?.access_token;
    state.user  = data.user;
    if (!state.token) {
      showToast(
        "Cadastro realizado! Verifique seu e-mail para confirmar a conta e depois faça login.",
        "info",
        7000
      );
      return;
    }
    saveSession(state.token, state.user);
    window.location.href = "app.html";
  } catch (err) {
    setFormError("signup", err.message);
  } finally { setLoading(btn, false); }
}
 
function handleLogout() {
  clearSession();
  window.location.href = "login.html";
}
 

 
/* ── Ranking ──────────────────────────────────────────────────────────────── */
 
async function loadRanking() {
  const tbodyEl = document.getElementById("ranking-tbody");
  const loadEl  = document.getElementById("ranking-loading");
  const emptyEl = document.getElementById("ranking-empty");
  const tableEl = document.getElementById("ranking-table-wrap");
  const podiumEl = document.getElementById("ranking-podium");
 
  tableEl.hidden = true;
  if (podiumEl) podiumEl.hidden = true;
  emptyEl.hidden = true;
  loadEl.hidden  = false;
 
  try {
    const ranking = await api("GET", "/ranking");
    loadEl.hidden = true;
 
    if (!Array.isArray(ranking) || ranking.length === 0) {
      emptyEl.hidden = false; return;
    }

    // Render podium
    if (podiumEl) {
      const p1 = ranking[0];
      const p2 = ranking.length > 1 ? ranking[1] : null;
      const p3 = ranking.length > 2 ? ranking[2] : null;
      
      const isMe1 = state.user && p1.usuario_id === state.user.id;
      const isMe2 = p2 && state.user && p2.usuario_id === state.user.id;
      const isMe3 = p3 && state.user && p3.usuario_id === state.user.id;

      podiumEl.innerHTML = `
        ${p2 ? `
        <div class="podium-col podium-col--2 ${isMe2 ? 'is-me' : ''}">
          <div class="podium-avatar-wrap">
            <span class="podium-medal">🥈</span>
            <div class="podium-avatar">${esc(p2.nome.slice(0, 2).toUpperCase())}</div>
          </div>
          <div class="podium-name" title="${esc(p2.nome)}">${esc(p2.nome.split(" ")[0])}</div>
          <div class="podium-pts">${p2.pontos_totais ?? 0} pts</div>
          <div class="podium-pedestal">2º</div>
        </div>` : '<div class="podium-col-placeholder"></div>'}

        <div class="podium-col podium-col--1 ${isMe1 ? 'is-me' : ''}">
          <div class="podium-crown">👑</div>
          <div class="podium-avatar-wrap">
            <span class="podium-medal">🥇</span>
            <div class="podium-avatar">${esc(p1.nome.slice(0, 2).toUpperCase())}</div>
          </div>
          <div class="podium-name" title="${esc(p1.nome)}">${esc(p1.nome.split(" ")[0])}</div>
          <div class="podium-pts">${p1.pontos_totais ?? 0} pts</div>
          <div class="podium-pedestal">1º</div>
        </div>

        ${p3 ? `
        <div class="podium-col podium-col--3 ${isMe3 ? 'is-me' : ''}">
          <div class="podium-avatar-wrap">
            <span class="podium-medal">🥉</span>
            <div class="podium-avatar">${esc(p3.nome.slice(0, 2).toUpperCase())}</div>
          </div>
          <div class="podium-name" title="${esc(p3.nome)}">${esc(p3.nome.split(" ")[0])}</div>
          <div class="podium-pts">${p3.pontos_totais ?? 0} pts</div>
          <div class="podium-pedestal">3º</div>
        </div>` : '<div class="podium-col-placeholder"></div>'}
      `;
      podiumEl.hidden = false;
    }
 
    // Render all in table
    const tableParticipants = ranking;
    if (tableParticipants.length > 0) {
      tbodyEl.innerHTML = tableParticipants.map((r, i) => {
        const idx = i;
        const isMe   = state.user && r.usuario_id === state.user.id;
        const rowCls = isMe ? "is-me" : "";
        const badgeClass = idx === 0 ? "gold" : (idx === 1 ? "silver" : (idx === 2 ? "bronze" : "normal"));
        
        // Deterministic trend indicator based on usuario_id char codes
        const trends = ["up", "down", "same"];
        const trend = trends[(r.usuario_id.charCodeAt(0) + r.usuario_id.charCodeAt(r.usuario_id.length - 1)) % 3];
        const trendHtml = trend === "up" 
          ? `<span class="trend-indicator trend--up" title="Subiu de posição">▲</span>` 
          : (trend === "down" 
            ? `<span class="trend-indicator trend--down" title="Caiu de posição">▼</span>` 
            : `<span class="trend-indicator trend--same" title="Manteve a posição">▬</span>`);
            
        return `
          <tr class="${rowCls}" style="animation-delay:${i*0.04}s">
            <td><span class="rank-badge ${badgeClass}">${idx + 1}</span></td>
            <td class="nome-participante">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="user-avatar-sml">${esc(r.nome.slice(0, 2).toUpperCase())}</div>
                <span>${esc(r.nome)}</span>
                ${trendHtml}
              </div>
            </td>
            <td><span class="pontos-val">${r.pontos_totais ?? 0} pts</span></td>
          </tr>`;
      }).join("");
      tableEl.hidden = false;
    } else {
      tbodyEl.innerHTML = "";
      tableEl.hidden = true;
    }
  } catch (err) {
    loadEl.hidden = true;
    showToast("Erro ao carregar ranking: " + err.message, "error");
  }
}
 
/* ── Dashboard ────────────────────────────────────────────────────────────── */

let dashboardTimerInterval = null;

function startDashboardTimer() {
  if (dashboardTimerInterval) clearInterval(dashboardTimerInterval);
  
  const timerEl = document.getElementById("countdown-timer");
  const matchContainer = document.getElementById("highlight-match-container");
  if (!timerEl || !matchContainer) return;
  
  function updateTimer() {
    if (!state.jogos || state.jogos.length === 0) {
      matchContainer.innerHTML = `<p class="dash-empty-txt">Nenhuma partida cadastrada.</p>`;
      timerEl.textContent = "00:00:00";
      return;
    }
    
    const now = new Date();
    // find next match in the future
    const futureMatches = state.jogos
      .filter(j => new Date(j.data_hora) > now)
      .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
      
    if (futureMatches.length === 0) {
      timerEl.textContent = "ENCERRADO";
      // show the last match
      const lastMatch = state.jogos[state.jogos.length - 1];
      renderHighlightMatch(lastMatch);
      return;
    }
    
    const nextMatch = futureMatches[0];
    renderHighlightMatch(nextMatch);
    
    const diff = new Date(nextMatch.data_hora) - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    
    let timeStr = "";
    if (days > 0) {
      timeStr += `${days}d `;
    }
    timeStr += `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    timerEl.textContent = timeStr;
  }
  
  updateTimer();
  dashboardTimerInterval = setInterval(updateTimer, 1000);
}

function renderHighlightMatch(jogo) {
  const container = document.getElementById("highlight-match-container");
  if (!container) return;
  
  if (container.dataset.gameId === String(jogo.id)) return;
  container.dataset.gameId = jogo.id;
  
  const status = getGameStatus(jogo);
  const palpite = state.palpites[jogo.id];
  const valA = palpite != null ? palpite.palpite_gols_a : "";
  const valB = palpite != null ? palpite.palpite_gols_b : "";
  
  const timeAFlag = getTeamFlagHtml(jogo.time_a);
  const timeBFlag = getTeamFlagHtml(jogo.time_b);
  const dateStr = formatDate(jogo.data_hora);
  
  const locked = status !== "aberto";
  
  container.innerHTML = `
    <div class="highlight-match-card">
      <div class="hm-info">
        <span class="hm-date">📅 ${dateStr}</span>
        <span class="hm-stadium">🏟️ ${esc(ESTADIOS_COPA[jogo.id % ESTADIOS_COPA.length].estadio)} - ${esc(ESTADIOS_COPA[jogo.id % ESTADIOS_COPA.length].cidade)}</span>
      </div>
      <div class="hm-teams-row">
        <div class="hm-team">
          ${timeAFlag}
          <span class="hm-team-name">${esc(jogo.time_a)}</span>
        </div>
        
        <div class="hm-score-wrap">
          <input type="number" min="0" id="hm-gols-a-${jogo.id}" class="hm-score-input" value="${valA}" ${locked ? 'disabled' : ''} placeholder="-">
          <span class="hm-vs">x</span>
          <input type="number" min="0" id="hm-gols-b-${jogo.id}" class="hm-score-input" value="${valB}" ${locked ? 'disabled' : ''} placeholder="-">
        </div>
        
        <div class="hm-team">
          ${timeBFlag}
          <span class="hm-team-name">${esc(jogo.time_b)}</span>
        </div>
      </div>
      ${!locked ? `<button class="btn-primary btn-hm-save" onclick="handleDashboardSave(${jogo.id})">Salvar Palpite</button>` : `<div class="hm-locked-badge">🔒 Palpites encerrados</div>`}
    </div>
  `;
}

async function handleDashboardSave(jogoId) {
  const inputA = document.getElementById(`hm-gols-a-${jogoId}`);
  const inputB = document.getElementById(`hm-gols-b-${jogoId}`);
  if (!inputA || !inputB) return;
  if (inputA.value === "" || inputB.value === "") {
    showToast("Por favor, preencha ambos os placares.", "info");
    return;
  }
  
  const gols_a = parseInt(inputA.value, 10);
  const gols_b = parseInt(inputB.value, 10);
  
  if (isNaN(gols_a) || isNaN(gols_b) || gols_a < 0 || gols_b < 0) {
    showToast("Os gols devem ser números ≥ 0.", "error");
    return;
  }
  
  try {
    await api("POST", "/palpites", { jogo_id: jogoId, palpite_gols_a: gols_a, palpite_gols_b: gols_b });
    state.palpites[jogoId] = { jogo_id: jogoId, palpite_gols_a: gols_a, palpite_gols_b: gols_b };
    
    showToast("Palpite salvo com sucesso! ⚽", "success");
    triggerConfettiAroundElement(inputA);
    loadDashboard();
  } catch (err) {
    showToast("Erro ao salvar palpite: " + err.message, "error");
  }
}

async function loadDashboard() {
  const rankEl = document.getElementById("dash-my-rank");
  const pointsEl = document.getElementById("dash-my-points");
  const remainingEl = document.getElementById("dash-remaining-games");
  const betsEl = document.getElementById("dash-bets-made");
  const totalUsersEl = document.getElementById("dash-total-users");
  
  const rankTbody = document.getElementById("dashboard-ranking-tbody");
  
  const statEfficiency = document.getElementById("stat-efficiency");
  const statHits = document.getElementById("stat-hits");
  const statOutcomeHits = document.getElementById("stat-outcome-hits");
  const statMisses = document.getElementById("stat-misses");
  
  try {
    // 1. Fetch ranking
    const ranking = await api("GET", "/ranking");
    
    // Find my position and points
    if (state.user && Array.isArray(ranking)) {
      const myRankIndex = ranking.findIndex(r => r.usuario_id === state.user.id);
      if (myRankIndex !== -1) {
        rankEl.textContent = `${myRankIndex + 1}º`;
        pointsEl.textContent = `${ranking[myRankIndex].pontos_totais ?? 0} pts`;
      } else {
        rankEl.textContent = "—";
        pointsEl.textContent = "0 pts";
      }
      totalUsersEl.textContent = ranking.length;
    }
    
    // Render Top 5 in dashboard
    if (Array.isArray(ranking)) {
      const top5 = ranking.slice(0, 5);
      rankTbody.innerHTML = top5.map((r, i) => {
        const isMe = state.user && r.usuario_id === state.user.id;
        const rowCls = isMe ? "is-me" : "";
        const badgeClass = i === 0 ? "gold" : (i === 1 ? "silver" : (i === 2 ? "bronze" : "normal"));
        return `
          <tr class="${rowCls}">
            <td><span class="rank-badge ${badgeClass}">${i + 1}</span></td>
            <td class="nome-participante">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="user-avatar-sml" style="width:24px; height:24px; font-size:0.65rem;">${esc(r.nome.slice(0, 2).toUpperCase())}</div>
                <span>${esc(r.nome.split(" ")[0])}</span>
              </div>
            </td>
            <td style="text-align: right; font-weight: 600; color: var(--c-gold);">${r.pontos_totais ?? 0}</td>
          </tr>
        `;
      }).join("");
    }
    
    // 2. Fetch matches and user guesses
    const [jogos, meusPalpites] = await Promise.all([
      fetchAndNormalizeJogos(),
      api("GET", "/palpites/meus")
    ]);
    
    state.jogos = jogos;
    state.palpites = {};
    meusPalpites.forEach(p => {
      state.palpites[p.jogo_id] = p;
    });
    
    // Calculate statistics
    let totalGames = state.jogos.length;
    let playedGames = state.jogos.filter(j => j.gols_a !== null && j.gols_b !== null).length;
    let remainingGames = totalGames - playedGames;
    remainingEl.textContent = remainingGames;
    
    let betsMadeCount = 0;
    state.jogos.forEach(j => {
      const p = state.palpites[j.id];
      if (p && p.palpite_gols_a !== null && p.palpite_gols_b !== null) {
        betsMadeCount++;
      }
    });
    betsEl.textContent = `${betsMadeCount}/${totalGames}`;
    
    // Calculate hits, misses, etc.
    let exactHits = 0;
    let partialHits = 0;
    let incorrects = 0;
    let ratedGames = 0;
    
    const sortedPlayedGames = state.jogos
      .filter(j => j.gols_a !== null && j.gols_b !== null)
      .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
      
    let currentStreak = 0;
    let maxStreak = 0;
    
    sortedPlayedGames.forEach(j => {
      const p = state.palpites[j.id];
      if (!p || p.palpite_gols_a === null || p.palpite_gols_b === null) {
        incorrects++;
        ratedGames++;
        currentStreak = 0;
        return;
      }
      
      const pgA = p.palpite_gols_a;
      const pgB = p.palpite_gols_b;
      const gA = j.gols_a;
      const gB = j.gols_b;
      
      ratedGames++;
      
      if (pgA === gA && pgB === gB) {
        exactHits++;
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else if (Math.sign(pgA - pgB) === Math.sign(gA - gB)) {
        partialHits++;
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        incorrects++;
        currentStreak = 0;
      }
    });
    
    statHits.textContent = exactHits;
    statOutcomeHits.textContent = partialHits;
    statMisses.textContent = incorrects;
    
    const efficiency = ratedGames > 0 ? Math.round(((exactHits + partialHits) / ratedGames) * 100) : 0;
    statEfficiency.textContent = `${efficiency}%`;
    
    // Update Achievements visually
    const achFirst = document.getElementById("ach-first");
    const achKing = document.getElementById("ach-king");
    const achStreak = document.getElementById("ach-streak");
    const achMaster = document.getElementById("ach-master");
    
    if (exactHits > 0 || partialHits > 0) {
      achFirst.classList.remove("locked");
      achFirst.classList.add("unlocked");
    } else {
      achFirst.classList.add("locked");
      achFirst.classList.remove("unlocked");
    }
    
    if (exactHits >= 5) {
      achKing.classList.remove("locked");
      achKing.classList.add("unlocked");
    } else {
      achKing.classList.add("locked");
      achKing.classList.remove("unlocked");
    }
    
    if (maxStreak >= 3) {
      achStreak.classList.remove("locked");
      achStreak.classList.add("unlocked");
    } else {
      achStreak.classList.add("locked");
      achStreak.classList.remove("unlocked");
    }
    
    if (efficiency >= 50 && ratedGames > 0) {
      achMaster.classList.remove("locked");
      achMaster.classList.add("unlocked");
    } else {
      achMaster.classList.add("locked");
      achMaster.classList.remove("unlocked");
    }
    
    // Render Host Cities showcase
    renderHostCitiesShowcase();

    // Start countdown
    startDashboardTimer();
    
  } catch (err) {
    showToast("Erro ao carregar Dashboard: " + err.message, "error");
  }
}

function renderHostCitiesShowcase() {
  const container = document.getElementById("host-cities-container");
  if (!container) return;

  const cities = [
    { name: "Cidade do México", stadium: "Estádio Azteca", country: "mx", flag: "🇲🇽", countryName: "México" },
    { name: "Guadalajara", stadium: "Estádio Akron", country: "mx", flag: "🇲🇽", countryName: "México" },
    { name: "Monterrey", stadium: "Estádio BBVA", country: "mx", flag: "🇲🇽", countryName: "México" },
    { name: "Vancouver", stadium: "BC Place", country: "ca", flag: "🇨🇦", countryName: "Canadá" },
    { name: "Toronto", stadium: "BMO Field", country: "ca", flag: "🇨🇦", countryName: "Canadá" },
    { name: "Los Angeles", stadium: "SoFi Stadium", country: "us", flag: "🇺🇸", countryName: "EUA" },
    { name: "Nova York/NJ", stadium: "MetLife Stadium", country: "us", flag: "🇺🇸", countryName: "EUA" },
    { name: "Dallas", stadium: "AT&T Stadium", country: "us", flag: "🇺🇸", countryName: "EUA" },
    { name: "Miami", stadium: "Hard Rock Stadium", country: "us", flag: "🇺🇸", countryName: "EUA" },
    { name: "Atlanta", stadium: "Mercedes-Benz Stadium", country: "us", flag: "🇺🇸", countryName: "EUA" },
    { name: "Houston", stadium: "NRG Stadium", country: "us", flag: "🇺🇸", countryName: "EUA" },
    { name: "Kansas City", stadium: "Arrowhead Stadium", country: "us", flag: "🇺🇸", countryName: "EUA" },
    { name: "Seattle", stadium: "Lumen Field", country: "us", flag: "🇺🇸", countryName: "EUA" },
    { name: "San Francisco", stadium: "Levi's Stadium", country: "us", flag: "🇺🇸", countryName: "EUA" },
    { name: "Boston", stadium: "Gillette Stadium", country: "us", flag: "🇺🇸", countryName: "EUA" },
    { name: "Filadélfia", stadium: "Lincoln Financial", country: "us", flag: "🇺🇸", countryName: "EUA" }
  ];

  container.innerHTML = cities.map(c => `
    <div class="city-card country-${c.country}">
      <span class="city-card__flag">${c.flag}</span>
      <div class="city-card__name" title="${esc(c.name)}">${esc(c.name)}</div>
      <div class="city-card__stadium" title="${esc(c.stadium)}">${esc(c.stadium)}</div>
      <span class="city-card__country-tag">${c.countryName}</span>
    </div>
  `).join("");
}

/* ── Init ─────────────────────────────────────────────────────────────────── */
 
function initApp() {
  showScreen("app-screen");
  const greet = document.getElementById("user-greeting");
  if (greet && state.user?.nome) greet.textContent = `Olá, ${state.user.nome.split(" ")[0]}!`;
  loadBracketSession();
  showSection("dashboard");
  loadDashboard();
}
 
function checkPageAccess() {
  const isLoginPage = document.getElementById("auth-screen") !== null;
  const isAppPage = document.getElementById("app-screen") !== null;
  const hasToken = loadSession() && state.token;

  if (isAppPage && !hasToken) {
    window.location.href = "login.html";
    return false;
  }

  if (isLoginPage && hasToken) {
    window.location.href = "app.html";
    return false;
  }

  return true;
}

function bootstrap() {
  if (!checkPageAccess()) return;

  const isAppPage = document.getElementById("app-screen") !== null;

  if (isAppPage) {
    initApp();
  }

  // Tabs (Login / Signup)
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const tab = btn.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b === btn));
      document.querySelectorAll(".auth-form").forEach(f => f.classList.toggle("active", f.id === `form-${tab}`));
      setFormError("login",""); setFormError("signup","");
      const recForm = document.getElementById("form-recovery");
      if (recForm) recForm.classList.remove("active");
    });
  });
 
  // Toggle senha
  document.querySelectorAll(".toggle-pw").forEach(btn => {
    btn.addEventListener("click", () => {
      const inp = document.getElementById(btn.dataset.target);
      if (!inp) return;
      inp.type = inp.type === "password" ? "text" : "password";
      btn.textContent = inp.type === "password" ? "👁" : "🙈";
    });
  });

  // Help links and simulated recovery handlers
  const linkForgot = document.getElementById("link-forgot-pw");
  const linkToSignup = document.getElementById("link-to-signup");
  const linkToLogin = document.getElementById("link-to-login");
  const btnBackToLogin = document.getElementById("btn-back-to-login");
  const formRecovery = document.getElementById("form-recovery");
  const formLogin = document.getElementById("form-login");
  const formSignup = document.getElementById("form-signup");
  
  if (linkForgot) {
    linkForgot.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
      if (formRecovery) formRecovery.classList.add("active");
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    });
  }
  
  if (btnBackToLogin) {
    btnBackToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
      if (formLogin) formLogin.classList.add("active");
      const loginTabBtn = document.querySelector('.tab-btn[data-tab="login"]');
      if (loginTabBtn) loginTabBtn.classList.add("active");
    });
  }
  
  if (linkToSignup) {
    linkToSignup.addEventListener("click", (e) => {
      e.preventDefault();
      const signupTabBtn = document.querySelector('.tab-btn[data-tab="signup"]');
      if (signupTabBtn) signupTabBtn.click();
    });
  }
  
  if (linkToLogin) {
    linkToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      const loginTabBtn = document.querySelector('.tab-btn[data-tab="login"]');
      if (loginTabBtn) loginTabBtn.click();
    });
  }
  
  if (formRecovery) {
    formRecovery.addEventListener("submit", async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("recovery-email");
      const btnRecovery = document.getElementById("btn-recovery");
      const successEl = document.getElementById("recovery-success");
      const errorEl = document.getElementById("recovery-error");
      
      if (!emailInput || !emailInput.value.trim()) {
        if (errorEl) {
          errorEl.textContent = "Por favor, digite seu e-mail.";
          errorEl.hidden = false;
        }
        return;
      }
      
      if (errorEl) errorEl.hidden = true;
      if (successEl) successEl.hidden = true;
      setLoading(btnRecovery, true);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1200));
        if (successEl) {
          successEl.textContent = "Instruções de recuperação enviadas para o e-mail!";
          successEl.hidden = false;
        }
        emailInput.value = "";
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = err.message;
          errorEl.hidden = false;
        }
      } finally {
        setLoading(btnRecovery, false);
      }
    });
  }
 
  const formLoginEl = document.getElementById("form-login");
  if (formLoginEl) formLoginEl.addEventListener("submit", handleLogin);
  const formSignupEl = document.getElementById("form-signup");
  if (formSignupEl) formSignupEl.addEventListener("submit", handleSignup);
  const btnLogoutEl = document.getElementById("btn-logout");
  if (btnLogoutEl) btnLogoutEl.addEventListener("click", handleLogout);
 
  // Alternar tema
  const btnThemeToggle = document.getElementById("btn-theme-toggle");
  if (btnThemeToggle) {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    btnThemeToggle.textContent = currentTheme === "light" ? "🌙" : "☀️";
    btnThemeToggle.title = currentTheme === "light" ? "Mudar para modo escuro" : "Mudar para modo claro";
    
    btnThemeToggle.addEventListener("click", () => {
      const theme = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("bolao-theme", theme);
      btnThemeToggle.textContent = theme === "light" ? "🌙" : "☀️";
      btnThemeToggle.title = theme === "light" ? "Mudar para modo escuro" : "Mudar para modo claro";
      showToast(`Modo ${theme === "light" ? "claro" : "escuro"} ativado! 🎨`, "info", 2000);
      
      const isMataMataActive = document.getElementById("section-matamata")?.classList.contains("active");
      if (isMataMataActive) {
        setTimeout(drawBracketLines, 50);
      }
    });
  }
 
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const s = btn.dataset.section;
      showSection(s);
      if (s === "dashboard") {
        loadDashboard();
      } else if (s === "grupos") {
        loadGroupStandings();
      } else if (s === "matamata") {
        loadKnockoutBracket();
      } else if (s === "ranking") {
        loadRanking();
      }
    });
  });
 
  const btnRefresh = document.getElementById("btn-refresh-ranking");
  if (btnRefresh) btnRefresh.addEventListener("click", () => {
    loadRanking();
  });
  
  const btnDashToRanking = document.getElementById("btn-dashboard-to-ranking");
  if (btnDashToRanking) {
    btnDashToRanking.addEventListener("click", () => {
      showSection("ranking");
      loadRanking();
    });
  }
  


  window.addEventListener("resize", () => {
    const isMataMataActive = document.getElementById("section-matamata")?.classList.contains("active");
    if (isMataMataActive) {
      drawBracketLines();
    }
  });



  const btnResetBracket = document.getElementById("btn-reset-bracket");
  if (btnResetBracket) {
    btnResetBracket.addEventListener("click", () => {
      state.bracketPalpites = {};
      localStorage.removeItem("bolao_bracket");
      showToast("Chaveamento limpo com sucesso! 🧹", "success");
      renderKnockoutBracket();
    });
  }
}
 
document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", bootstrap)
  : bootstrap();