const util = require('util')
const zipdir = util.promisify(require('zip-dir'))
const { getClient } = require('./lib/server')

const hostname = require('os').hostname()

module.exports = async (app, server, compileHost) => {
  console.log('\n发布人：', hostname)

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
