const axios = require('axios');

export default async function handler(req, res) {
    const { canal } = req.query; // Pega o canal, ex: ?canal=globo

    const FONTES = {
        "globo": "https://canais.online/globo-sp-ao-vivo/",
        "sportv": "https://canais.online/sportv-ao-vivo/",
        "premiere": "https://canais.online/premiere-clubes-ao-vivo/"
    };

    const urlAlvo = FONTES[canal];

    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!urlAlvo) {
        return res.status(404).json({ erro: "Canal não configurado" });
    }

    try {
        const response = await axios.get(urlAlvo, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        const html = response.data;
        // Regex para capturar links .m3u8 ou .txt
        const regexM3U8 = /(https?[:\/\w\.-]+\.(m3u8|txt)[^"'\s]*)/g;
        const matches = html.match(regexM3U8);

        if (matches) {
            const linkFresco = matches.find(l => l.includes("playlist") || l.includes("token")) || matches[0];
            return res.json({ url: linkFresco });
        }

        res.status(404).json({ erro: "Link não capturado" });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao acessar site alvo" });
    }
          }
          
