# Amazon Scrap API

Projeto desenvolvido para processo seletivo. Consiste em uma API estruturada com Express, que faz um Web Scraping na página de busca de produtos da [Amazon](https://www.amazon.com/), da Kabum e da Terabyte. A lógica de scrape foi desenvolvida utilizando Axios para realizar a requisição a página de busca, e JSDOM para extrair o HTML e adquirir as informações desejadas.

Os preços dos produtos são coletados e guardados em um banco de dados, e quando são pesquisados novamente, ele compara os preços e diz se houve um aumento, uma diminuição ou se manteve o mesmo preço da consulta anterior.

Att: A lógica de scrape foi alterada para a utilização do puppeter, na intenção de simular o acesso real e evitar o bloqueio em algumas requisições.

## Configurações :wrench:

Para instalar as dependências do projeto, abra o terminal dentro da pasta do projeto e escreva o seguinte comando:

```bash
bun install
```

Para rodar o projeto:

```bash
bun run start
```

## Tabelas do banco

Tabela Produtos:
```bash
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    product_name TEXT UNIQUE NOT NULL,
    current_price NUMERIC NOT NULL,
    product_image_url TEXT,
    amount_reviews TEXT,
    rating TEXT,
    last_updated DATE NOT NULL
);
```

Tabela Histórico de preços:
```bash
CREATE TABLE product_price_history (
    id SERIAL PRIMARY KEY,
    product_name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    date DATE NOT NULL
);
```

## Rotas :construction:

| Endpoint   |      Função      |  Parâmetros |
|----------|:-------------:|------:|
| api/scrape |  Realiza o scrape dos produtos das 3 lojas e retorna o nome do produto, o rating, número de reviews, preço e imagem | busca (obrigatório) / page (opcional) |
| api/scrape/kabum |  Realiza o scrape dos produtos da kabum e retorna o nome do produto, o rating, número de reviews, preço e imagem | busca (obrigatório) / page (opcional) |
| api/scrape/amazon |  Realiza o scrape dos produtos da amazon e retorna o nome do produto, o rating, número de reviews, preço e imagem | busca (obrigatório) / page (opcional) |
| api/scrape/terabyte |  Realiza o scrape dos produtos da terabyte e retorna o nome do produto, o rating, número de reviews, preço e imagem | busca (obrigatório)|
