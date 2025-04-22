# Amazon Scrap API

Projeto desenvolvido para processo seletivo. Consiste em uma API estruturada com Express, que faz um Web Scraping na página de busca de produtos da [Amazon](https://www.amazon.com/). A lógica de scrape foi desenvolvida utilizando Axios para realizar a requisição a página de busca, e JSDOM para extrair o HTML e adquirir as informações desejadas.

## Configurações :wrench:

Para instalar as dependências do projeto, abra o terminal dentro da pasta do projeto e escreva o seguinte comando:

```bash
bun install
```

Para rodar o projeto:

```bash
bun run start
```

## Rotas :construction:

| Endpoint   |      Função      |  Parâmetros |
|----------|:-------------:|------:|
| api/scrape |  Realiza o scrape e retorna o nome do produto, o rating, número de reviews, preço e imagem | busca (obrigatório) / page (opcional) |
