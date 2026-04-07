import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
    const { canal } = req.query;
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 1. Lógica de Domínio Dinâmico (Anti-ENOTFOUND)
    const sufixos = ['wf', 'la', 'ch', 'li', 'tv'];
    let html = null;
    let urlFinal = '';

    // Tenta encontrar o site em diferentes finais (.wf, .la...)
    for (const ext of sufixos) {
        try {
            const urlTeste = `https://www.redecanais.${ext}/bra/${canal || 'globo-sp'}.html`;
            const response = await axios.get(urlTeste, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Moto G(8) Power Lite) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,webp,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Cache-Control': 'no-cache',
                    'Prerender-Control': 'no-cache',
                    // Isso ajuda a pular alguns sistemas de proteção simples:
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1'
                },
                timeout: 5000 // Se o domínio estiver morto, pula rápido pro próximo
            });
            
            if (response.status === 200) {
                html = response.data;
                urlFinal = urlTeste;
                break; 
            }
        } catch (e) { continue; }
    }

    if (!html) return res.status(404).json({ erro: "Nenhum domínio da Rede Canais respondeu." });

    try {
        const $ = cheerio.load(html);
        let linkM3U8 = null;

        // 2. Burlagem de Anti-PopUp e Extração de Script
        // Varremos o HTML procurando por links Cloudfront que o site tenta esconder
        $('script').each((i, el) => {
            const content = $(el).html();
            // Regex focado em links de streaming protegidos
            const regex = /(https?[:\/\w\.-]+cloudfront[^\s"'`]+(\.m3u8|\.txt)[^\s"'`]*)/g;
            const matches = content.match(regex);
            if (matches) linkM3U8 = matches[0];
        });

        if (linkM3U8) {
            // 3. Envio Blindado ao Telegram
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: `🛡️ SISTEMA BLINDADO\nCanal: ${canal}\nFonte: ${urlFinal}\nLink: ${linkM3U8}`
            });

            return res.status(200).json({ status: "Capturado", url: linkM3U8 });
        }

        return res.status(404).json({ erro: "Link escondido por proteção pesada (JS Challenge)" });

    } catch (error) {
        return res.status(500).json({ erro: "Falha crítica no bypass" });
    }
                }
