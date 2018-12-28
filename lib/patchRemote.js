const WebSocket = require('ws')
const Context = require('./Context')
const cmdHandler = require('./commandHandle')
const util = require('util')
const zipdir = util.promisify(require('zip-dir'))

module.exports = async (app, server, compileHost) => {
  const buffer = await zipdir('./', { filter: (path, stat) => !/node_modules/.test(path) })

  console.log(buffer)
  const client = new WebSocket(`ws://${compileHost}/`)

  const ctx = new Context(client)

  client.on('message', async function (message) {
    try {
      const [cmd, cmdData] = cmdHandler.deserialize(ctx, message)
      await cmdHandler[cmd](ctx, ctx.state, cmdData)
    } catch (error) {
      console.log(error)
    }
  })

  setTimeout(() => {
    ctx.send('TarsPatch', {
      appName: app,
      serverName: server,
      codeZipPkg: buffer
    })
  }, 1000)
}
