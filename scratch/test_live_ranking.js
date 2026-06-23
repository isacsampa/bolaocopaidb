const https = require("https");

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    }).on("error", reject);
  });
}

async function run() {
  console.log("📡 Testando /api/ranking em Produção...");
  const res = await getJSON("https://bolaocopa-2026.onrender.com/api/ranking");
  console.log(`Status Code: ${res.statusCode}`);
  console.log("Resposta:", typeof res.body === "object" ? JSON.stringify(res.body).slice(0, 1000) : res.body);
}

run().catch(console.error);
