const WebSocket = require('ws')
const uuid = require('uuid')
const path = require('path')
const cmdHandler = require('./commandsHandler')
const { EventEmitter } = require('events')
const Command = require('./protocol/command').Command
const { TarsInputStream, BinBuffer } = require('@tars/stream')

const deserialize = function (nodebuffer) {
  const binBuffer = new BinBuffer(nodebuffer)
  const is = new TarsInputStream(binBuffer)
  const d = Command.BatchCommand.create(is)
  const batchCommand = d.toObject()

  const { commands, datas } = batchCommand

  return {
    commands,
    datas: datas.map((data, i) => {
      const command = commands[i]
      const Class = Command[command]
      if (Class) {
        const binBuffer = new BinBuffer(data)
        const is = new TarsInputStream(binBuffer)
        const d = Class.create(is)
        return d.toObject()
      } else {
        return {}
      }
    })
  }
}

const serialize = function (...args) {
  const commands = []
  const datas = []
  for (let i = 0; i < args.length;) {
    const command = args[i]
    let data = {}
    if (typeof command === 'string' && typeof args[i + 1] !== 'string') {
      data = args[i + 1]
      i += 2
    } else {
      i++
    }
    const CommandDataClass = Command[command]
    let buffer = Buffer.from([])
    if (CommandDataClass) {
      const c = new CommandDataClass()
      c.readFromObject(data)
      buffer = c.toBinBuffer().toNodeBuffer()
    }
    commands.push(command)
    datas.push(buffer)
  }
  const batchCommand = new Command.BatchCommand()
  batchCommand.readFromObject({
    commands, datas
  })
  return batchCommand.toBinBuffer().toNodeBuffer()
}
class RemoteControler extends EventEmitter {
  constructor (ws, conf) {
    super()
    if (typeof ws === 'string') {
      ws = new WebSocket(ws)
    }
    Reflect.defineProperty(this, 'ws', {
      value: ws
    })
    Reflect.defineProperty(this, 'requestId', {
      value: uuid()
    })
    Reflect.defineProperty(this, 'state', {
      value: {}
    })
    Reflect.defineProperty(this, 'conf', {
      value: conf
    })
    this.state.tempDir = path.resolve(process.cwd(), './tarscli', `./${this.requestId}`)
    this.state.distDir = path.resolve(process.cwd())
    this.isInit = false
    this.jobPointer = Promise.resolve()
  }

  enqueue (job, data) {
    this.jobPointer = this.jobPointer.then(() => job(this, this.state, data))
  }

  init () {
    const self = this
    const ws = this.ws
    return new Promise((resolve, reject) => {
      if (this.isInit) {
        resolve(self)
      } else {
        this.isInit = true
        ws.on('message', async function (message) {
          try {
            const { commands, datas } = deserialize(message)
            commands.forEach((cmd, i) => {
              self.enqueue(cmdHandler[cmd], datas[i])
            })
          } catch (error) {
            self.print(error.toString())
            self.done()
          }
        })
        ws.on('error', err => {
          self.print(err)
          self.done()
        })
        ws.on('open', () => {
          // 对于客户端，则需要等待链接打开
          resolve(self)
        })
        ws.on('close', () => {
          console.log('链接关闭')
        })
        // 对于服务端，init之前ws已经是open状态，所以绑定完事件后就可以resolve了
        if (ws.readyState === 1) {
          resolve(self)
        }
      }
    })
  }

  send (...args) {
    const msg = serialize(...args)
    this.ws.send(msg)
  }

  print (data) {
    this.send('Print', {
      data: typeof data === 'string' ? data : JSON.stringify(data)
    })
  }

  done () {
    this.ws.close()
  }
}

module.exports = RemoteControler
