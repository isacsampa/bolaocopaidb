const https = require("https");

https.get("https://bolaocopa2026-delta.vercel.app/", (res) => {
  console.log("Status Code:", res.statusCode);
  console.log("Headers:", res.headers);
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    console.log("Body length:", data.length);
    console.log("Body snippet:", data.substring(0, 500));
  });
}).on("error", (err) => {
  console.error("Error fetching URL:", err.message);
});
