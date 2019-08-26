const util = require('util')
const zipdir = util.promisify(require('zip-dir'))
const { getClient } = require('./lib/server')

module.exports = async (server, compileHost) => {
  const ctx = await getClient(compileHost).init()
  const buffer = await zipdir('./', { filter: (path, stat) => !/node_modules/.test(path) })

  ctx.send('TarsDeploy', {
    serverName: server,
    codeZipPkg: buffer
  }, 'Clear', 'Done')
}
