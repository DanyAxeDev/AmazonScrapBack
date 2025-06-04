import puppeteer from 'puppeteer';
import { pool } from './db';

function parsePrice(priceStr: string): number {
    return parseFloat(priceStr.replace(/[^\d,]/g, '').replace('.', '').replace(',', '.'));
}

function calculatePriceChange(oldPrice: number, newPrice: number) {
    const diff = newPrice - oldPrice;
    const percent = (diff / oldPrice) * 100;
    return {
        change: diff,
        percentage: percent.toFixed(2),
        direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'
    };
}

export async function scrapeTerabyte(query: string) {
    const searchUrl = `https://www.terabyteshop.com.br/busca?str=${encodeURIComponent(query)}`;

    const browser = await puppeteer.launch({ headless: true });

    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'pt-BR,pt;q=0.9',
    });

    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    await page.waitForSelector('.products-grid', { timeout: 10000 });

    const products = await page.evaluate(() => {
        const items: any[] = [];
        const productEls = document.querySelectorAll('.product-item');

        productEls.forEach((el) => {
            const productName = el.querySelector('.product-item__name')?.textContent?.trim() || null;
            const price = el.querySelector('.product-item__new-price span')?.textContent?.trim() || null;
            const image = el.querySelector('.image-thumbnail')?.getAttribute('src') || null;
            const rating = el.querySelector('.product-item__ratings')?.textContent?.trim() || null;

            const data = new Date().toISOString().split('T')[0];

            if (productName && price && image) {
                items.push({ productName, price, productImageURL: image, rating, data });
            }
        });

        return items;
    });

    const results = [];

    for (const item of products) {
        const currentPrice = parsePrice(item.price);
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
    await browser.close();
    return results;
}