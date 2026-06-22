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
        let inputQuery = req.query.q || req.query.url;
        if (!inputQuery) return res.status(400).send("No search query provided.");

        inputQuery = inputQuery.trim().toLowerCase();

        // Scrub browser string remnants
        inputQuery = inputQuery.replace('imtured', '').replace('say', '').trim();

        if (!inputQuery) {
            inputQuery = '://duckduckgo.com';
        }

        let targetUrl = inputQuery;

        // Route plain search queries smoothly through DuckDuckGo's lightweight html engine
        if (!inputQuery.includes('.') || inputQuery.includes(' ')) {
            targetUrl = 'https://://duckduckgo.com/html/?q=' + encodeURIComponent(inputQuery);
        } else if (!inputQuery.startsWith('http://') && !inputQuery.startsWith('https://')) {
            targetUrl = 'https://' + inputQuery;
        }

        try {
            new URL(targetUrl);
        } catch (_) {
            targetUrl = 'https://://duckduckgo.com/html/?q=' + encodeURIComponent(inputQuery);
        }

        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            validateStatus: () => true
        });

        res.writeHead(response.status, response.headers);
        response.data.pipe(res);
    } catch (err) {
        res.status(500).send("Proxy error: " + err.message);
    }
});

server.listen(PORT, () => {
    console.log(`Purify running smoothly on port ${PORT}`);
});
