const HOST = location.origin.replace(/^http/, 'ws');
const ws = new WebSocket(HOST);

let isActive = false;
let mySenderId = null;
const myDeviceType = detectDeviceType();

let pendingPositions = {};

ws.onmessage = (event) => {
  let msg;
  try { msg = JSON.parse(event.data); } catch { return; }

  if (msg.type === 'hello') {
    mySenderId = msg.sender; // 自分のIDを記録
    return;
  }

  if (msg.type === 'end') {
    const el = document.querySelector(`[data-sender="${msg.sender}"]`);
    if (el) el.remove();
    return;
  }

  if (msg.type === 'start' || msg.type === 'move') {
    let label = document.querySelector(`[data-sender="${msg.sender}"]`);
    if (!label) {
      label = document.createElement('div');
      label.className = 'cursor-label';
      label.setAttribute('data-sender', msg.sender);
      document.getElementById('overlay').appendChild(label);
    }

    // 自分か他人かで文面を変える
    if (msg.sender === mySenderId) {
      label.textContent = `これはあなたの${msg.device}`;
      label.style.color = "#551A8B";
    } else {
      label.textContent = `これは誰かの${msg.device}`;
      label.style.color = "blue";
    }
    pendingPositions[msg.sender] = msg;
  }
};

// 追加: 描画ループ
function render() {
  for (const sender in pendingPositions) {
    const msg = pendingPositions[sender];
    const label = document.querySelector(`[data-sender="${msg.sender}"]`);
    if (label) {
      const drawX = window.innerWidth / 2 + msg.x;
      const drawY = window.innerHeight / 2 + msg.y - 10; // 少し上にずらす
      // transformを使うと滑らか
      label.style.transform = `translate(${drawX}px, ${drawY}px)`
    }
  }
  requestAnimationFrame(render);
}
requestAnimationFrame(render);


// 追加: throttle用の変数と関数
let lastSent = 0;
function sendThrottled(type, x, y) {
  const now = Date.now();
  if (now - lastSent > 30) { // 30msごとに送信
    send(type, x, y);
    lastSent = now;
  }
}
// クリック開始
document.addEventListener('mousedown', (e) => {
  isActive = true;
  send('start', e.clientX, e.clientY);
});
document.addEventListener('mousemove', (e) => {
  if (isActive) sendThrottled('move', e.clientX, e.clientY);
});
document.addEventListener('mouseup', () => {
  isActive = false;
  send('end');
});

// タッチ操作
document.addEventListener('touchstart', (e) => {
  isActive = true;
  const t = e.touches[0];
  if (t) send('start', t.clientX, t.clientY);
});
document.addEventListener('touchmove', (e) => {
  if (!isActive) return;
  const t = e.touches[0];
  if (t) sendThrottled('move', t.clientX, t.clientY);
});
document.addEventListener('touchend', () => {
  isActive = false;
  send('end');
});

function send(type, x, y) {
  if (ws.readyState !== 1) return;
  const msg = { type, device: myDeviceType };

  msg.x = x - window.innerWidth / 2;
  msg.y = y - window.innerHeight / 2;

  ws.send(JSON.stringify(msg));
}

function detectDeviceType() {
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|iphone|ipod|android.*mobile/.test(ua)) {
    return "スマートフォン";
  } else if (/ipad|tablet|android(?!.*mobile)/.test(ua)) {
    return "タブレット";
  } else if (/windows|macintosh|linux/.test(ua)) {
    return "PC";
  } else {
    return "デバイス";
  }
}