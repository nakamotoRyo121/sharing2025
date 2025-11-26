const WebSocket = require('ws');
const PORT = process.env.PORT || 7071;
const wss = new WebSocket.Server({ port: PORT });
const clients = new Map();

wss.on('connection', (ws) => {
  const id = uuidv4();
  const color = Math.floor(Math.random() * 360);
  const metadata = { id, color };
  clients.set(ws, metadata);

  ws.on('message', (messageAsString) => {
    const message = JSON.parse(messageAsString);
    const metadata = clients.get(ws);
    message.sender = metadata.id;
    message.color = metadata.color;
    [...clients.keys()].forEach((client) => {
      client.send(JSON.stringify(message));
    });
  });

  ws.on('close', () => clients.delete(ws));
});

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

console.log(`WebSocket server running on ${PORT}`);
