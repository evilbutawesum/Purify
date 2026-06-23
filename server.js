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

        // Handle raw text phrases and auto-route them into DuckDuckGo queries smoothly
        if (!targetUrl.includes('.') || targetUrl.includes(' ') || !targetUrl.startsWith('http')) {
            targetUrl = 'https://duckduckgo.com' + encodeURIComponent(targetUrl);
        }

        // Fetching with arraybuffer ensures raw layout file binaries remain completely unbroken
        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://duckduckgo.com'
            },
            validateStatus: () => true
        });

        let contentType = response.headers['content-type'] || 'text/html';
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            // Convert the arraybuffer back into a readable text string for processing
            let htmlData = response.data.toString('utf8');
            const parsedUrl = new URL(targetUrl);
            const originUrl = parsedUrl.protocol + '//' + parsedUrl.hostname;

            // Inject Base Tag framework
            const baseTag = `<head><base href="${originUrl}/">`;
            htmlData = htmlData.replace('<head>', baseTag);

            // Dynamically translate all asset routing paths to utilize our local proxy handler
            const rewriteRegex = /(href|src|action)=["'](?!https?:\/\/|\/\/)([^"']+)["']/g;
            htmlData = htmlData.replace(rewriteRegex, (match, attribute, relativePath) => {
                let absoluteUrl = relativePath.startsWith('/') ? originUrl + relativePath : originUrl + '/' + relativePath;
                return `${attribute}="/scram/service?url=${encodeURIComponent(absoluteUrl)}"`;
            });

            res.send(htmlData);
        } else {
            // Deliver unbroken raw media assets, stylesheet frameworks, or scripting blocks directly
            res.send(response.data);
        }
    } catch (err) {
        res.status(500).send("Proxy transmission error: " + err.message);
    }
});

server.listen(PORT, () => {
    console.log(`Purify server operating smoothly on port ${PORT}`);
});
