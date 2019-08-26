const WebSocket = require('ws')
const byt = require('byt')
const RemoteControler = require('./RemoteControler')

const runServer = (port, url) => {
  const wss = new WebSocket.Server({ port: +port,
    maxPayload: byt('1gb')
  })

  wss.on('connection', function connection (ws) {
    console.log('on connection')
    let remoteControler = new RemoteControler(ws, {
      'tarswebUrl': url
    })
    remoteControler.init().then(() => {
      remoteControler.print('已建立链接')
    })
  })
}

const getClient = compilerHost => {
  console.log(`正在与编译机 ${compilerHost} 建立链接`)
  const remoteControler = new RemoteControler(`ws://${compilerHost}/`)
  return remoteControler
}

module.exports = { runServer, getClient }
