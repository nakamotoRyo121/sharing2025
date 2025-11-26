// expressJSのリクエスト（http通信のため） + websocketのリクエスト
const express = require('express')
const { Server } = require('ws')

// 自動にポート番号が割り振られるが割り振られなかった時の5001 + index.htmlの取得
const PORT = process.env.PORT || 5001
const INDEX = '/index.html'

// expressを使ってユーザからのリクエストをindex.htmlに接続 + リクエスト先にサーバ起動
const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

//   httpの値をwebsocketで受け取れるようにする
const wss = new Server({ server })

// wssとして受け取ったhttpのリクエストの状態を判別
wss.on('connection', (ws) => {
  console.log('Client connected')
  ws.on('close', () => console.log('Client disconnected'))
});

// サーバ側でインターバル（ブロードキャストして状態を更新）
setInterval(() => {
  wss.clients.forEach((client) => {
    client.send(new Date().toTimeString())
  })
}, 1000)