const fs = require('fs')
const path = require('path')
const util = require('util')
const extract = util.promisify(require('extract-zip'))
const mkdirp = util.promisify(require('mkdirp'))
const rimraf = require('rimraf')
const { exec } = require('./../util')

const TarsDeploy = async function (ctx, { tempDir }, {
  serverName, codeZipPkg
}) {
  const filename = serverName + '.zip'
  const codePkgPath = path.resolve(tempDir, filename)
  const decompressDir = path.resolve(path.dirname(codePkgPath), path.basename(codePkgPath, '.zip'))
  ctx.print('正在创建代码目录')
  await mkdirp(path.dirname(codePkgPath))
  ctx.print('正在转换压缩包: ', filename)
  fs.writeFileSync(codePkgPath, codeZipPkg)
  ctx.print('正在解压压缩包: ', filename)
  await extract(codePkgPath, {
    dir: decompressDir
  })
  ctx.print('正在执行tars-deploy脚本')
  const cmd = `${path.resolve(__dirname, './../node_modules/.bin/tars-deploy')} ${serverName}`
  await exec(cmd, decompressDir, ctx)
  const tgzPath = path.resolve(decompressDir, `${serverName}.tgz`)
  ctx.print('编译成功。', tgzPath)
  ctx.send('SaveFile', {
    fileName: `${serverName}.tgz`,
    filebuff: fs.readFileSync(tgzPath)
  })
}
const SaveFile = async function (ctx, { distDir }, data) {
  const dist = path.resolve(distDir, data.fileName)
  fs.writeFileSync(dist, data.filebuff)
  console.log('文件下载成功')
}
const Print = async function (ctx, state, data) {
  console.log(data.data)
}

const Clear = async function (ctx, { tempDir }, data) {
  rimraf.sync(tempDir)
}

const Done = async function (ctx, { tempDir }, data) {
  ctx.done()
}

module.exports = {
  TarsPatch: require('./TarsPatch'), TarsDeploy, SaveFile, Print, Clear, Done
}
