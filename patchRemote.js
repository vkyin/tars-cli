const util = require('util')
const zipdir = util.promisify(require('zip-dir'))
const { getClient } = require('./lib/server')
const readline = require('readline')

const hostname = require('os').hostname()

module.exports = async (app, server, compileHost) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const patcher = await new Promise(resolve => {
    // question方法
    rl.question(`输入发布人名字，5s后使用（${hostname}）`, function (answer) {
      const _patcher = answer.trim() || hostname
      resolve(_patcher)
      rl.close()
    })
    setTimeout(() => {
      resolve(hostname)
      rl.close()
    }, 5000)
  })

  console.log('\n发布人：', patcher)

  const ctx = await getClient(compileHost).init()
  const buffer = await zipdir('./', { filter: (path, stat) => !/node_modules/.test(path) })
  console.log(app, server, compileHost, buffer.length)

  ctx.send('TarsPatch', {
    appName: app,
    serverName: server,
    codeZipPkg: buffer,
    patcher
  }, 'Clear', 'Done')
}
