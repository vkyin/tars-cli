#! /usr/bin/env node

var program = require('commander')
const { runServer } = require('./lib/server')

program
  .version('0.0.1')
  .option('-v, --verbose', '是否打印相信错误信息')

program.command('patchRemote <app> <module>')
  .option('-r, --remote <hostname>', '远端编译机hostname')
  .action(function (app, moduleName, cmd) {
    require('./patchRemote')(app, moduleName, cmd.remote).then(() => {
      // process.exit(0)
    }).catch(err => {
      if (cmd.verbose) {
        console.error(err)
      } else {
        console.error(err.message)
      }
      process.exit(-1)
    })
  })

program.command('patch <app> <module>')
  .option('-r, --remote <hostname>', '远端编译机hostname')
  .action(function (app, moduleName, cmd) {
    require('./patchRemote')(app, moduleName, cmd.remote).then(() => {
      // process.exit(0)
    }).catch(err => {
      if (cmd.verbose) {
        console.error(err)
      } else {
        console.error(err.message)
      }
      process.exit(-1)
    })
  })

program.command('deploy <servername>')
  .option('-r, --remote <hostname>', '远端编译机hostname')
  .action(function (servername, cmd) {
    require('./deploy')(servername, cmd.remote).then(() => {
      // process.exit(0)
    }).catch(err => {
      if (cmd.verbose) {
        console.error(err)
      } else {
        console.error(err.message)
      }
      process.exit(-1)
    })
  })

program.command('runServer <port> <url>')
  .action(function (port, url, cmd) {
    runServer(port, url)
  })

program.on('command:*', function () {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '))
  process.exit(1)
})
program.parse(process.argv)
