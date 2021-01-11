const util = require('util')
const zipdir = util.promisify(require('zip-dir'))
const { getClient } = require('./lib/server')
const os = require('os')

function getIPAdress() {
  const interfaces = os.networkInterfaces();　　
  for (let devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
}

module.exports = async (app, server, compileHost) => {
  console.log('\n发布人：', `${getIPAdress()}|${os.hostname()}`)

  const ctx = await getClient(compileHost).init()
  const buffer = await zipdir('./', { filter: (path, stat) => !/node_modules/.test(path) })
  console.log(app, server, compileHost, buffer.length)

  ctx.send('TarsPatch', {
    appName: app,
    serverName: server,
    codeZipPkg: buffer,
    patcher: hostname
  }, 'Clear', 'Done')
}
