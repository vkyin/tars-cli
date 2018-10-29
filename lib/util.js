const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { CONF_NAME } = require('./constants')

const rl = readline.createInterface(process.stdin, process.stdout)
const ask = (q) => new Promise((resolve, reject) => {
  rl.question(q, a => resolve(a.trim()))
})

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
  async setConf () {
    util.checkPackageJson()
    const conf = {}
    conf.url = await ask('enter url\n')
    conf.app = await ask('enter application\n')
    conf.module = await ask('enter module name\n')
    fs.writeFileSync(CONF_NAME, JSON.stringify(conf, '', 2))
    console.log('conf saved as "tarsweb.json"')
    return conf
  },
  async getConf () {
    try {
      fs.accessSync(CONF_NAME, fs.constants.R_OK)
      const conf = fs.readFileSync(CONF_NAME).toString()
      return JSON.parse(conf)
    } catch (err) {
      return util.setConf()
    }
  }
}
