const ava = require('ava')
const util = require('./../lib/util')

ava('serialize & deserialize', async t => {
  const data = ['Print', { data: 'asdfasdf' }, 'Print', { data: '123414' }]
  const r = util.deserialize(util.serialize(...data))

  t.deepEqual(r.commands, ['Print', 'Print'])
  t.deepEqual(r.datas, [{ data: 'asdfasdf' }, { data: '123414' }])
})
