const http = require("http");

http.get("http://localhost:3000/api/ranking", (res) => {
  let data = "";
  res.on("data", (chunk) => { data += chunk; });
  res.on("end", () => {
    try {
      const ranking = JSON.parse(data);
      console.log(`=== Ranking API Response (${ranking.length} users) ===`);
      ranking.forEach((r, idx) => {
        console.log(`${idx + 1}. Nome: ${r.nome} | Pts: ${r.pontos_totais} | ID: ${r.usuario_id} | PE: ${r.acertos_exatos} | RT: ${r.acertos_resultados}`);
      });
    } catch (err) {
      console.error("Erro ao fazer parse do JSON:", err.message);
      console.log("Resposta bruta:", data);
    }
  });
}).on("error", (err) => {
  console.error("Erro na requisição:", err.message);
});
