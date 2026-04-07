import axios from 'axios';

export default async function handler(req, res) {
    const { canal } = req.query;

    // Tente usar estas fontes (RedeCanais é mais fácil de raspar)
    const FONTES = {
        "globo": "https://redecanais.li/canais/globo-sp.html",
        "sportv": "https://redecanais.li/canais/sportv.html",
        "premiere": "https://redecanais.li/canais/premiere.html"
    };

    const urlAlvo = FONTES[canal];
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!urlAlvo) return res.status(404).json({ erro: "Canal não configurado" });

    try {
        const response = await axios.get(urlAlvo, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': urlAlvo // Isso ajuda a burlar bloqueios simples
            },
            timeout: 5000 // Se o site demorar mais de 5s, ele pula
        });

        const html = response.data;
        // Regex mais forte para pegar links m3u8
        const regexM3U8 = /(https?[:\/\w\.-]+\.(m3u8|txt|mpd)[^"'\s]*)/g;
        const matches = html.match(regexM3U8);

        if (matches) {
            const linkFresco = matches.find(l => l.includes("playlist") || l.includes("token") || l.includes("m3u8")) || matches[0];
            return res.json({ url: linkFresco });
        }

        return res.status(404).json({ erro: "Link não encontrado no código do site" });
    } catch (error) {
        return res.status(500).json({ erro: "Site alvo fora do ar ou bloqueado" });
    }
                                            }
    
