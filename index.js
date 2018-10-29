#! /usr/bin/env node

var program = require('commander')

program.version('0.0.1')
program
  .command('tree')
  .action(require('./action/tree'))

program
  .command('conf')
  .action(require('./action/conf'))

program.on('command:*', function () {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '))
  process.exit(1)
})
program.parse(process.argv)
