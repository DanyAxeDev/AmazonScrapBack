import express from "express";
import { scrapeAmazon } from './scraper';

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/api/scrape", async (req: any, res: any) => {
  const { busca, page = "1" } = req.query;

  if (!busca || typeof busca !== "string") {
    return res.status(400).json({ error: "Parâmetro de busca é obrigatório" });
  }

  const pageNumber = parseInt(page as string) || 1;

  try {
    const results = await scrapeAmazon(busca, pageNumber);
    res.json(results);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Erro interno" });
  }
});

app.listen(PORT, () => {
  console.log(`🔥 Servidor Express rodando em http://localhost:${PORT}`);
});
