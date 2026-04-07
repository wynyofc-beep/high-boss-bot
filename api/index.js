import axios from 'axios';

export default async function handler(req, res) {
    const { canal } = req.query;

    const FONTES = {
        "globo": "https://redecanais.li/canais/globo-sp.html",
        "sportv": "https://redecanais.li/canais/sportv.html",
        "premiere": "https://redecanais.li/canais/premiere.html"
    };

    const urlAlvo = FONTES[canal];
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!urlAlvo) return res.status(404).json({ erro: "Canal não configurado" });

    try {
        // Simulando um navegador real de forma mais convincente
        const response = await axios.get(urlAlvo, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Moto G(8)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                'Referer': 'https://www.google.com/',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            timeout: 8000 // Aumentamos para 8 segundos (sites de stream são lentos)
        });

        const html = response.data;
        
        // Regex aprimorada: busca links que terminam em .m3u8 mas ignoram lixo eletrônico
        const regexM3U8 = /(https?[:\/\w\.-]+\.(m3u8|txt)[^"'\s]*)/g;
        const matches = html.match(regexM3U8);

        if (matches) {
            // Filtra para pegar o link que realmente parece um vídeo (geralmente o mais longo ou com 'playlist')
            const linkReal = matches.find(l => l.includes("playlist") || l.includes("m3u8")) || matches[0];
            return res.json({ url: linkReal });
        }

        return res.status(404).json({ erro: "Site acessado, mas link .m3u8 sumiu" });

    } catch (error) {
        // Se cair aqui, o site bloqueou o IP da Vercel
        return res.status(500).json({ 
            erro: "Site alvo bloqueou o robô", 
            detalhe: error.message 
        });
    }
}
