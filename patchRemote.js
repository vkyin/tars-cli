const util = require('util')
const zipdir = util.promisify(require('zip-dir'))
const { getClient } = require('./lib/server')

module.exports = async (app, server, compileHost) => {
  const ctx = await getClient(compileHost).init()
  const buffer = await zipdir('./', { filter: (path, stat) => !/node_modules/.test(path) })
  console.log(app, server, compileHost, buffer.length)

  ctx.send('TarsPatch', {
    appName: app,
    serverName: server,
    codeZipPkg: buffer
  }, 'Clear', 'Done')
}
