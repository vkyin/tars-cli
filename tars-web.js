#! /usr/bin/env node

var program = require('commander')

program
  .version('0.0.1')
  .option('-v, --verbose', '是否打印相信错误信息')
program
  .command('patch <app> <module>')
  .option('-u, --url <url>', 'tars web端的url，用于访问接口')
  .action(function (app, moduleName, cmd) {
    require('./lib/patch')({ app, module: moduleName, url: cmd.url }).then(() => {
      process.exit(0)
    }).catch(err => {
      if (cmd.verbose) {
        console.error(err)
      } else {
        console.error(err.message)
      }
      process.exit(-1)
    })
  })

program.command('patchRemote <app> <module>')
  .option('-r, --remote <hostname>', '远端编译机hostname')
  .action(function (app, moduleName, cmd) {
    require('./lib/patchRemote')(app, moduleName, cmd.remote).then(() => {
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
    require('./lib/deploy')(servername, cmd.remote).then(() => {
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
    require('./lib/server')(port, url).then(() => {
      console.log('listening', port, url)
    }).catch(err => {
      if (cmd.verbose) {
        console.error(err)
      } else {
        console.error(err.message)
      }
      process.exit(-1)
    })
  })

program.on('command:*', function () {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '))
  process.exit(1)
})
program.parse(process.argv)
