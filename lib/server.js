const WebSocket = require('ws')
const byt = require('byt')
const cmdHandler = require('./commandHandle')
const Context = require('./Context')

module.exports = async (port, url) => {
  const wss = new WebSocket.Server({ port: +port,
    maxPayload: byt('1gb')
  })

  wss.on('connection', function connection (ws) {
    const ctx = new Context(ws, {
      'tarswebUrl': url
    })
    ws.on('message', async function (message) {
      try {
        const [cmd, cmdData] = cmdHandler.deserialize(ctx, message)
        await cmdHandler[cmd](ctx, ctx.state, cmdData)
      } catch (error) {
        ctx.print(error.toString())
      }
    })
    ws.on('error', err => {
      ctx.print(err)
    })
  })
}
