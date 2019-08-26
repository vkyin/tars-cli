let start = Promise.resolve()

const wait = ms => new Promise(resolve => setTimeout(() => {
  console.log('wait', ms, '')
  resolve()
}, ms))

const enqueue = function (job, ...args) {
  start = start.then(() => job.apply(null, args))
}

enqueue(wait, 1001)
enqueue(wait, 1002)
enqueue(wait, 1003)
enqueue(wait, 1004)
enqueue(wait, 1005)
enqueue(wait, 1006)
enqueue(wait, 1007)
