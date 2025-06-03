import axios from 'axios';
import { JSDOM } from "jsdom";

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

        return resultado;
    } catch (error: any) {
        throw new Error(`Erro ao buscar produtos: ${error.message}`);
    }
}
