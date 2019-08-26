const fs = require('fs')
const path = require('path')

const util = module.exports = {
  hasPackageJson (dir) {
    try {
      fs.accessSync(path.resolve(dir, './package.json'))
      return true
    } catch (error) {
      return false
    }
  },
  checkPackageJson (dir) {
    if (!util.hasPackageJson(process.cwd())) {
      console.error('this dir has no package.json file')
      process.exit(-1)
    }
  },
  async exec (cmd, cwd, ctx) {
    const { exec } = require('child_process')
    return new Promise((resolve, reject) => {
      const subProcess = exec(cmd, {
        cwd
      }, (err, stdout, stderr) => {
        if (err) reject(err)
        resolve()
      })
      subProcess.stdout.on('data', (chunk) => {
        ctx.print(chunk)
      })
      subProcess.stderr.on('data', (chunk) => {
        ctx.print(chunk)
      })
    })
  },
  async wait (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

}
