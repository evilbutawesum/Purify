import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/scram/service', (req, res) => {
    try {
        const encodedUrl = req.query.url;
        if (!encodedUrl) return res.status(400).send("No URL provided.");
        
        const targetUrl = atob(encodedUrl);
        
        https.get(targetUrl, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        }).on('error', (err) => {
            res.status(500).send("Error fetching site: " + err.message);
        });
    } catch (e) {
        res.status(400).send("Invalid URL tracking requested.");
    }
});

server.listen(PORT, () => {
    console.log(`Purify running smoothly on port ${PORT}`);
});
