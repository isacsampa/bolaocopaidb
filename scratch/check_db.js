require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function check() {
  const { data, error } = await supabase.from("jogos").select("id, time_a, time_b, data_hora");
  if (error) {
    console.error("Erro:", error);
    return;
  }
  console.log("Total de jogos no banco:", data.length);
  
  // Agrupa para ver duplicados
  const counts = {};
  data.forEach(j => {
    const key = `${j.time_a} vs ${j.time_b} @ ${j.data_hora}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  
  const duplicates = Object.entries(counts).filter(([_, count]) => count > 1);
  if (duplicates.length > 0) {
    console.log("⚠️ Jogos duplicados encontrados:");
    duplicates.forEach(([key, count]) => {
      console.log(`- ${key}: ${count} vezes`);
    });
  } else {
    console.log("✅ Nenhum jogo duplicado no banco.");
  }
}

check();
