import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import axios from 'axios';

export default async function handler(req, res) {
    // Configurações do Navegador Fantasma
    const browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
    });

    const page = await browser.newPage();
    
    // 1. O Bot entra no site (ex: Rede Canais)
    await page.goto('https://redecanais.li/canais/globo-sp.html', { waitUntil: 'networkidle2' });

    // 2. Ele "espera" o link aparecer no tráfego de rede (igual o 1DM faz)
    const linkCapturado = await page.evaluate(() => {
        // Aqui dentro o bot procura no código-fonte o link .m3u8 ou .txt
        return document.querySelector('video')?.src || "Link não achado";
    });

    await browser.close();

    // 3. ENVIAR PARA O TELEGRAM (O seu "Banco de Dados")
    const TELEGRAM_TOKEN = "SEU_TOKEN_AQUI";
    const CHAT_ID = "ID_DO_SEU_CANAL";
    const msg = `CANAL: GLOBO | LINK: ${linkCapturado}`;

    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: CHAT_ID,
        text: msg
    });

    res.json({ status: "Link capturado e salvo no Telegram!", link: linkCapturado });
                                        }
        
