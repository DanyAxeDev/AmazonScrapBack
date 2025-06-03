import express from "express";
import { scrapeAmazon } from './amazonScraper';
import { scrapeKabum } from "./kabumScraper";
import { scrapeTerabyte } from "./terabyteScraper";

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/api/scrape/amazon", async (req: any, res: any) => {
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

app.get("/api/scrape/kabum", async (req: any, res: any) => {
  const { busca, page = "1" } = req.query;

  if (!busca || typeof busca !== "string") {
    return res.status(400).json({ error: "Parâmetro de busca é obrigatório" });
  }

  const pageNumber = parseInt(page as string) || 1;

  try {
    const results = await scrapeKabum(busca, pageNumber);
    res.json(results);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Erro interno" });
  }
});

app.get("/api/scrape/terabyte", async (req: any, res: any) => {
  const { busca } = req.query;

  if (!busca || typeof busca !== "string") {
    return res.status(400).json({ error: "Parâmetro de busca é obrigatório" });
  }

  try {
    const results = await scrapeTerabyte(busca);
    res.json(results);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Erro interno" });
  }
});

app.get("/api/scrape", async (req: any, res: any) => {
  const { busca, page = "1" } = req.query;

  if (!busca || typeof busca !== "string") {
    return res.status(400).json({ error: "Parâmetro de busca é obrigatório" });
  }

  const pageNumber = parseInt(page as string) || 1;

  try {
    const results = await buscarTodosOsProdutos(busca, pageNumber);
    res.json(results);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Erro interno" });
  }
});

async function buscarTodosOsProdutos(busca: string, pageNumber: number): Promise<any[]> {
  const [kabumProdutos, amazonProdutos, terabyteProdutos] = await Promise.all([
    scrapeKabum(busca, pageNumber),
    scrapeAmazon(busca, pageNumber),
    scrapeTerabyte(busca)
  ]);

  const kabumComOrigem = kabumProdutos.map(prod => ({ ...prod, loja: 'kabum' }));
  const amazonComOrigem = amazonProdutos.map(prod => ({ ...prod, loja: 'amazon' }));
  const terabyteComOrigem = terabyteProdutos.map(prod => ({ ...prod, loja: 'terabyte' }));

  const produtosCombinados = [...kabumComOrigem, ...amazonComOrigem, ...terabyteComOrigem];

  return produtosCombinados;
}

app.listen(PORT, () => {
  console.log(`🔥 Servidor Express rodando em http://localhost:${PORT}`);
});
