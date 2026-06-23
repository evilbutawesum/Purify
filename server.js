import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/scram/service', async (req, res) => {
    try {
        let targetUrl = req.query.url;
        if (!targetUrl) return res.status(400).send("No target URL specified.");

        try {
            if (targetUrl.includes('%')) {
                targetUrl = decodeURIComponent(targetUrl);
            }
        } catch (_) {}

        targetUrl = targetUrl.trim();

        // Handle raw phrases and turn them into DuckDuckGo queries automatically
        if (!targetUrl.includes('.') || targetUrl.includes(' ') || !targetUrl.startsWith('http')) {
            targetUrl = 'https://duckduckgo.com' + encodeURIComponent(targetUrl);
        }

        const response = await axios({
            method: 'get',
            url: targetUrl,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://duckduckgo.com'
            }
        });

        // If it's a webpage, inject the base tag to redirect internal paths automatically
        if (response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
            let htmlData = response.data;
            const parsedUrl = new URL(targetUrl);
            const baseUrl = parsedUrl.protocol + '//' + parsedUrl.hostname;
            
            // Injects a base element at the top of the head so clicked links know where to route
            const baseTag = `<head><base href="${baseUrl}/">`;
            htmlData = htmlData.replace('<head>', baseTag);
            
            res.send(htmlData);
        } else {
            // If it's an asset or image, route the raw stream
            const alternativeStream = await axios({ method: 'get', url: targetUrl, responseType: 'stream' });
            res.writeHead(alternativeStream.status, alternativeStream.headers);
            alternativeStream.data.pipe(res);
        }
    } catch (err) {
        res.status(500).send("Proxy transmission error: " + err.message);
    }
});

server.listen(PORT, () => {
    console.log(`Purify server operating smoothly on port ${PORT}`);
});
