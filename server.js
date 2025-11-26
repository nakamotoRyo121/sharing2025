// server.js
const express = require('express');
const { Server } = require('ws');

const PORT = process.env.PORT || 5001;
const app = express();
app.use(express.static(__dirname + '/public'));
const server = app.listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });
let nextId = 1;
const clients = new Map();

wss.on('connection', (ws) => {
  const senderId = String(nextId++);
  const color = Math.floor(Math.random() * 360);
  clients.set(ws, { senderId, color });

  // 公式IDを接続直後に返す
  ws.send(JSON.stringify({ type: 'hello', sender: senderId, color }));

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    const meta = clients.get(ws);
    if (!meta) return;

    // メッセージタイプで分岐
    if (msg.type === 'start' || msg.type === 'move') {
      const outgoing = {
        type: msg.type,
        sender: meta.senderId,
        device: msg.device,
        x: msg.x, y: msg.y
      };
      broadcast(outgoing);
    } else if (msg.type === 'end') {
      broadcast({ type: 'end', sender: meta.senderId });
    }
  });

  ws.on('close', () => {
    const meta = clients.get(ws);
    if (meta) {
      // 切断時にも確実に終端メッセージ
      broadcast({ type: 'end', sender: meta.senderId });
      clients.delete(ws);
    }
  });
});

function broadcast(obj) {
  const payload = JSON.stringify(obj);
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) client.send(payload);
  });
}
