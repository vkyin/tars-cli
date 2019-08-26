const { getClient } = require('../lib/server')
getClient('127.0.0.1:8080').init().then(ctrl => {
  ctrl.print('123412341234adsfsd')
})
