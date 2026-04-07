import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import axios from 'axios';

export default async function handler(req, res) {
    const { canal } = req.query;
    
const browser = await puppeteer.launch({
    args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // Crucial para economizar memória na Vercel
        '--disable-gpu'
    ],
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
});
    
    

    try {
        const page = await browser.newPage();
        
        // Simula um celular para o site não desconfiar
        await page.setUserAgent('Mozilla/5.0 (Linux; Android 10; Moto G(8))');

        // Vai para o site (Exemplo: Rede Canais)
        // O link do site pode vir via parâmetro ou fixo
        const urlAlvo = "https://redecanais.li/canais/globo-sp.html";
        await page.goto(urlAlvo, { waitUntil: 'domcontentloaded', timeout: 60000 });
        

        // A MÁGICA: Ele "escuta" as requisições de rede para achar o .m3u8 ou .txt
        // Igual o 1DM faz no log de agente
        const linkM3U8 = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            for (const s of scripts) {
                const match = s.innerText.match(/(https?[:\/\w\.-]+\.(m3u8|txt)[^"'\s]*)/);
                if (match) return match[0];
            }
            return null;
        });

        await browser.close();

        if (linkM3U8) {
            // ENVIAR PARA O TELEGRAM (Seu Banco de Dados)
            // Em vez de colar o número aqui, use o processo abaixo:
const TOKEN = process.env.TELEGRAM_TOKEN;
const ID_CANAL = process.env.TELEGRAM_CHAT_ID;
            
            
            await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
                chat_id: ID_CANAL,
                text: `✅ BOT CAPTUROU:\nCanal: ${canal || 'Globo'}\nLink: ${linkM3U8}`
            });

            return res.status(200).json({ status: "Link salvo no Telegram", url: linkM3U8 });
        }

        return res.status(404).json({ erro: "Bot entrou mas não achou o link" });

    } catch (error) {
        if (browser) await browser.close();
        return res.status(500).json({ erro: error.message });
    }
}
