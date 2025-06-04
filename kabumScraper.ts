import axios from 'axios';
import { JSDOM } from "jsdom";
import { pool } from './db';

function calculatePriceChange(oldPrice: number, newPrice: number) {
    const diff = newPrice - oldPrice;
    const percent = (diff / oldPrice) * 100;
    return {
        change: diff,
        percentage: percent.toFixed(2),
        direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'
    };
}

export async function scrapeKabum(query: string, page: number = 1) {
    const searchUrl = `https://www.kabum.com.br/busca/${encodeURIComponent(query)}?page_number=${page}`;

    try {
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Referer': 'https://www.google.com/',
                'DNT': '1',
                'Connection': 'keep-alive'
            }
        });

        const html = response.data;
        const dom = new JSDOM(html);
        const document = dom.window.document;

        const scriptTag = document.querySelector('#__NEXT_DATA__');
        if (!scriptTag || !scriptTag.textContent) {
            throw new Error('Não foi possível encontrar os dados');
        }

        const jsonData = JSON.parse(scriptTag.textContent);

        const dataStr = jsonData?.props?.pageProps?.data;

        if (!dataStr) {
            throw new Error('Dados não encontrados');
        }

        let dataObj;

        if (typeof dataStr === 'string') {
            try {
                dataObj = JSON.parse(dataStr);
            } catch (e) {
                if (e instanceof Error) {
                    throw new Error('Erro ao fazer JSON.parse de pageProps.data: ' + e.message);
                } else {
                    throw new Error('Erro desconhecido ao fazer JSON.parse de pageProps.data');
                }
            }
        } else if (typeof dataStr === 'object' && dataStr !== null) {
            dataObj = dataStr;
        } else {
            throw new Error('Formato inesperado de pageProps.data: nem string nem objeto');
        }

        const produtos = dataObj?.catalogServer?.data;

        if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
            return [];
        }

        const dataAtual = new Date().toISOString().split('T')[0];

        const resultado = produtos.map(prod => ({
            productName: prod.name,
            price: prod.price,
            productImageURL: prod.image,
            amountReviews: prod.ratingCount,
            rating: prod.rating,
            data: dataAtual
        }));

        const results = [];

        for (const item of resultado) {
            const currentPrice = item.price;
            const today = new Date().toISOString().split('T')[0];

            const { rows } = await pool.query(
                'SELECT current_price FROM products WHERE product_name = $1',
                [item.productName]
            );

            let changeInfo = null;

            if (rows.length > 0) {
                const oldPrice = parseFloat(rows[0].current_price);
                changeInfo = calculatePriceChange(oldPrice, currentPrice);

                await pool.query(
                    'UPDATE products SET current_price = $1, product_image_url = $2, amount_reviews = $3, rating = $4, last_updated = $5 WHERE product_name = $6',
                    [currentPrice, item.productImageURL, item.amountReviews, item.rating, today, item.productName]
                );
            } else {
                await pool.query(
                    'INSERT INTO products (product_name, current_price, product_image_url, amount_reviews, rating, last_updated) VALUES ($1, $2, $3, $4, $5, $6)',
                    [item.productName, currentPrice, item.productImageURL, item.amountReviews, item.rating, today]
                );
            }

            const existingHistory = await pool.query(
                'SELECT 1 FROM product_price_history WHERE product_name = $1 AND date = $2',
                [item.productName, today]
            );

            if (existingHistory.rowCount === 0) {
                await pool.query(
                    'INSERT INTO product_price_history (product_name, price, date) VALUES ($1, $2, $3)',
                    [item.productName, currentPrice, today]
                );
            }

            results.push({
                productName: item.productName,
                currentPrice: `R$ ${currentPrice.toFixed(2).replace('.', ',')}`,
                productImageURL: item.productImageURL,
                amountReviews: item.amountReviews,
                rating: item.rating,
                priceChange: changeInfo
            });
        }
        return results;
    } catch (error: any) {
        throw new Error(`Erro ao buscar produtos: ${error.message}`);
    }
}
