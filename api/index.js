import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
    const { canal } = req.query;
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Domínios que o bot vai testar sozinho se um cair
    const bases = ['wf', 'la', 'ch', 'li'];
    let linkFinal = null;

    try {
        for (let ext of bases) {
            const url = `https://www.redecanais.${ext}/bra/${canal || 'globo-sp'}.html`;
            
            try {
                const { data } = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Moto G(8) Power Lite) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36',
                        'Accept-Language': 'pt-BR,pt;q=0.9',
                        'Referer': 'https://www.google.com/'
                    },
                    timeout: 5000
                });

                const $ = cheerio.load(data);
                
                // Busca profunda: olha em todos os scripts o link do streaming
                $('script').each((i, el) => {
                    const code = $(el).html();
                    const match = code.match(/(https?[:\/\w\.-]+cloudfront[^\s"'`]+(\.m3u8|\.txt)[^\s"'`]*)/);
                    if (match && !linkFinal) linkFinal = match[0];
                });

                if (linkFinal) break; 
            } catch (err) { continue; }
        }

        if (linkFinal) {
            // Manda pro Telegram (O "Cérebro" do seu App)
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: `🛡️ BYPASS SUCESSO!\nCanal: ${canal}\nLink: ${linkFinal}`
            });

            return res.status(200).json({ url: linkFinal });
        }

        return res.status(404).json({ erro: "Proteção do site muito forte para raspagem simples." });

    } catch (error) {
        return res.status(500).json({ erro: "Erro no servidor da Vercel" });
    }
}
