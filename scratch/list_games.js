require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function list() {
  const { data, error } = await supabase.from("jogos").select("id, time_a, time_b, data_hora");
  if (error) {
    console.error(error);
    return;
  }
  
  // Lista todos os jogos
  data.forEach((j, index) => {
    console.log(`${index + 1}. [ID: ${j.id}] ${j.time_a} vs ${j.time_b} @ ${j.data_hora}`);
  });
}

list();
