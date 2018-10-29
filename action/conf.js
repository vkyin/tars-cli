const util = require('../lib/util')
module.exports = () => {
  util.setConf().then(() => {
    process.exit(0)
  }).catch(err => {
    console.log(err)
    process.exit(1)
  })
}
