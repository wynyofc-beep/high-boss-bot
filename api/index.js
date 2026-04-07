import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
    const { canal } = req.query;
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Mapeamento de canais (adicione quantos quiser)
        // No seu objeto FONTES, atualize os domínios:
    const FONTES = {
    // A Rede Canais costuma alternar entre esses formatos:
    "globo": "https://www.redecanais.wf/bra/globo-sp.html", // Adicionaram /bra/ às vezes
    "sportv": "https://www.redecanais.wf/bra/sportv.html",
    "premiere": "https://www.redecanais.wf/bra/premiere.html"
};
    
    

    const urlAlvo = FONTES[canal] || FONTES["globo"];

    try {
        // 1. Baixa o HTML bruto (Rápido e leve)
        const { data } = await axios.get(urlAlvo, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Moto G(8))',
                'Referer': 'https://www.google.com/'
            },
            timeout: 8000
        });

        // 2. O Cheerio assume o controle
        const $ = cheerio.load(data);
        let linkCapturado = null;

        // 3. Procura o link nos scripts (onde o Futemax e RedeCanais escondem)
        $('script').each((i, el) => {
            const scriptContent = $(el).html();
            // Regex para pegar .m3u8 ou .txt da Cloudfront
            const match = scriptContent.match(/(https?[:\/\w\.-]+\.(m3u8|txt)[^"'\s]*)/);
            if (match && !linkCapturado) {
                linkCapturado = match[0];
            }
        });

        if (linkCapturado) {
            // 4. Manda pro seu Banco de Dados (Telegram)
            const TOKEN = process.env.TELEGRAM_TOKEN;
            const ID_CANAL = process.env.TELEGRAM_CHAT_ID;

            await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
                chat_id: ID_CANAL,
                text: `🔥 LINK CAPTURADO (CHEERIO)\nCanal: ${canal || 'Globo'}\nLink: ${linkCapturado}`
            });

            return res.json({ status: "Link enviado ao Telegram", url: linkCapturado });
        }

        return res.status(404).json({ erro: "Link não encontrado no código do site" });

    } catch (error) {
        return res.status(500).json({ erro: "Falha na raspagem leve", detalhe: error.message });
    }
                             }
