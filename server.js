import express from 'express';
import http from 'node:http';
import { scramjetPath } from '@mercuryworkshop/scramjet/path';
import { wispServer } from '@titaniumnetwork-dev/wisp-server-node';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use('/scram', express.static(scramjetPath));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/wisp/')) {
        wispServer(req, socket, head);
    } else {
        socket.destroy();
    }
});

server.listen(PORT, () => {
    console.log(`Purify running on port ${PORT}`);
});
