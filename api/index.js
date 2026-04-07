import axios from 'axios';
import * as cheerio from 'cheerio'; // Instale com: npm install cheerio

export default async function handler(req, res) {
    try {
        const { data } = await axios.get('URL_DO_SITE', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Moto G(8))' }
        });

        const $ = cheerio.load(data);
        
        // Ele varre todos os scripts procurando o link
        let linkM3U8 = "";
        $('script').each((i, el) => {
            const scriptContent = $(el).html();
            const match = scriptContent.match(/(https?[:\/\w\.-]+\.(m3u8|txt)[^"'\s]*)/);
            if (match) linkM3U8 = match[0];
        });

        return res.json({ url: linkM3U8 });
    } catch (e) {
        return res.status(500).json({ erro: e.message });
    }
}
