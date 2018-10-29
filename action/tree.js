const util = require('../lib/util')
var request = require('request')
const debug = require('debug')('tree')

module.exports = async () => {
  try {
    const conf = await util.getConf()
    debug(conf)

    var options = { method: 'GET', url: conf.url + '/pages/tree' }

    request(options, function (error, response, body) {
      if (error) throw new Error(error)
      debug(body)
      body = JSON.parse(body)
      if (body.ret_code !== 200) {
        console.error(body.ret_code)
      } else {
        console.log(JSON.stringify(body.data, '', 2))
      }
      process.exit(0)
    })
  } catch (error) {
    console.error(error)
    process.exit(-1)
  }
}
