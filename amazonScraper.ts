import puppeteer from 'puppeteer';

export async function scrapeAmazon(query: string, page: number = 1) {
  const searchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(query)}&page=${page}`;

  try {
    const browser = await puppeteer.launch({ headless: true });

    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9',
    });

    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    await page.waitForSelector('div[data-component-type="s-search-result"]', { timeout: 10000 });


    const products = await page.evaluate(() => {
      const items: any[] = [];
      const productEls = document.querySelectorAll('div[data-component-type="s-search-result"]');

      productEls.forEach((el) => {
        const productName = el.querySelector('a h2 span')?.textContent?.trim() || null;
        const priceWhole = el.querySelector('.a-price-whole')?.textContent?.trim();
        const priceFraction = el.querySelector('.a-price-fraction')?.textContent?.trim();
        const price = priceWhole && priceFraction ? `R$ ${priceWhole}${priceFraction}` : null;
        const productImageURL = el.querySelector('img.s-image')?.getAttribute('src') || null;
        const rating = el.querySelector('span.a-icon-alt')?.textContent?.trim() || null;
        const amountReviews = el.querySelector('span.a-size-base.s-underline-text')?.textContent?.trim() || null;

        const data = new Date().toISOString().split('T')[0];

        if (productName && price && productImageURL && amountReviews && rating) {
          items.push({
            productName,
            price,
            productImageURL,
            amountReviews,
            rating,
            data
          });
        }
      });
      return items;
    });
    return products;
  } catch (error: any) {
    throw new Error(`Erro ao buscar produtos: ${error.message}`);
  }
}
