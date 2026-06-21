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
        let inputQuery = req.query.q;
        if (!inputQuery) return res.status(400).send("No search query provided.");

        inputQuery = inputQuery.trim();
        let targetUrl = inputQuery;

        if (!inputQuery.includes('.') || inputQuery.includes(' ')) {
            targetUrl = 'https://google.com' + encodeURIComponent(inputQuery);
        } else if (!inputQuery.startsWith('http://') && !inputQuery.startsWith('https://')) {
            targetUrl = 'https://' + inputQuery;
        }

        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
