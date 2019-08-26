const { BatchCommand, Print } = require('../lib/protocol/command').Command
const { TarsInputStream, BinBuffer } = require('@tars/stream')
// 序列化

const p1 = new Print()
p1.readFromObject({
  data: 'asdfasdf'
})

const p2 = new Print()
p2.readFromObject({
  data: 'zxcvzxcvz'
})

const b = new BatchCommand()

b.readFromObject({
  commands: ['Print', 'Print'],
  data: [p1.toBinBuffer().toNodeBuffer(), p2.toBinBuffer().toNodeBuffer()]
})

const buffer = b.toBinBuffer().toNodeBuffer()

console.log(buffer)

const binBuffer = new BinBuffer(buffer)
const is = new TarsInputStream(binBuffer)

const deBatchCommand = BatchCommand.create(is)

console.log(deBatchCommand.toObject())
