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

program.on('command:*', function () {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '))
  process.exit(1)
})
program.parse(process.argv)
