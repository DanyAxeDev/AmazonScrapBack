import puppeteer from 'puppeteer';

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

    await browser.close();
    return products;
}