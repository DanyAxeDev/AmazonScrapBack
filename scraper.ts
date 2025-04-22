import axios from 'axios';
import { JSDOM } from "jsdom";

export async function scrapeAmazon(query: string, page: number = 1) {
  const searchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(query)}&page=${page}`;

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
    const products: any[] = [];

    const productEls = document.querySelectorAll('div[data-component-type="s-search-result"]');

    productEls.forEach((el) => {
        const productName = el.querySelector('a h2 span')?.textContent?.trim() || null;
        const priceWhole = el.querySelector('.a-price-whole')?.textContent?.trim();
        const priceFraction = el.querySelector('.a-price-fraction')?.textContent?.trim();
        const price = priceWhole && priceFraction ? `R$ ${priceWhole}${priceFraction}` : null;
        const productImageURL = el.querySelector('img.s-image')?.getAttribute('src') || null;
        const rating = el.querySelector('span.a-icon-alt')?.textContent?.trim() || null;
        const amountReviews = el.querySelector('span.a-size-base.s-underline-text')?.textContent?.trim() || null;

        if (productName && price && productImageURL && amountReviews && rating) {
            products.push({
              productName,
              price,
              productImageURL,
              amountReviews,
              rating
            });
        }
    })

    return products;
  } catch (error: any) {
    throw new Error(`Erro ao buscar produtos: ${error.message}`);
  }
}
