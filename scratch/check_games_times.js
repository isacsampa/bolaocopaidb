require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function run() {
  const { data: jogos, error } = await supabase
    .from("jogos")
    .select("id, time_a, time_b, data_hora")
    .order("data_hora");

  if (error) {
    console.error("❌ Erro:", error);
    return;
  }

  console.log("=== LISTA DE JOGOS E SUAS DATAS ===");
  jogos.forEach(j => {
    const date = new Date(j.data_hora);
    const options = { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" };
    const localStr = date.toLocaleString("pt-BR", options);
    
    // Check if the local date is June 13, 2026
    const isLocalJune13 = localStr.includes("13/06/2026");
    const isUTCJune13 = j.data_hora.startsWith("2026-06-13");
    
    if (isLocalJune13 || isUTCJune13) {
      console.log(`[${isLocalJune13 ? "LOCAL" : ""}${isLocalJune13 && isUTCJune13 ? "/" : ""}${isUTCJune13 ? "UTC" : ""}] ID: ${j.id} | ${j.time_a} x ${j.time_b} | UTC: ${j.data_hora} | Local (SP): ${localStr}`);
    }
  });
}

run();
