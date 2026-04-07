import axios from 'axios';

export default async function handler(req, res) {
    const { canal } = req.query;
    res.setHeader('Access-Control-Allow-Origin', '*');

    // O site "mãe" onde o 1DM achou esse link
    // Exemplo: se foi no 'canais.online', colocamos a URL dele aqui
    const SITE_FONTE = "https://redecanais.li/canais/globo-sp.html"; 

    try {
        const response = await axios.get(SITE_FONTE, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Moto G(8))'
            }
        });

        const html = response.data;

        // REGEX NINJA: Procura por padrões que tenham 'cloudfront' e terminem em '.txt' ou '.m3u8'
        const regexCloudfront = /https?:\/\/[\w\.-]+cloudfront-net\.online\/token\/[\w]+\/[\w\.-]+\.(txt|m3u8)/g;
        
        const matches = html.match(regexCloudfront);

        if (matches) {
            // O bot pegou o link igual o 1DM faria!
            return res.json({ url: matches[0] });
        }

        return res.status(404).json({ 
            erro: "O Token mudou e o bot não encontrou no HTML",
            debug: "Tente atualizar a fonte no código" 
        });

    } catch (error) {
        return res.status(500).json({ erro: "Erro ao acessar o servidor da fonte" });
    }
}
