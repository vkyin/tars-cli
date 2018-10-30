#! /usr/bin/env node
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const request = require('request-promise-native')
const util = require('./util')

module.exports = main
async function main (conf) {
  util.checkPackageJson(process.cwd())
  console.log('检查参数')
  assert(conf.url, '请填好配置: url ')
  assert(conf.app, '请填好配置: app')
  assert(conf.module, '请填好配置 module')
  console.log('检查参数通过。', `"${conf.app}.${conf.module}" on "${conf.url}"`)

  console.log('正在拉取服务信息')
  const serverlist = await new Promise((resolve, reject) => {
    request({ method: 'GET', url: conf.url + '/pages/tree' }, function (error, response, body) {
      if (error) reject(error)
      body = JSON.parse(body)
      if (body.ret_code === 200) {
        resolve(body.data)
      } else {
        reject(body)
      }
    })
  })
  const app = serverlist.find(o => o.name === conf.app).children.find(o => o.name === conf.module)
  if (!app) {
    throw new Error(`${conf.app}.${conf.module} not found`)
  }
  console.log('拉取服务信息成功。服务id：', app.id)

  let d = await request({
    method: 'post',
    url: conf.url + '/pages/server/api/server_list',
    json: true,
    qs: {
      'tree_node_id': app.id
    }
  })
  if (d.ret_code !== 200) {
    throw d
  }
  const serverListIds = d.data.map(o => o.id)
  console.log(serverListIds)

  console.log('正在编译')
  const { exec } = require('child_process')
  await new Promise((resolve, reject) => {
    const subProcess = exec(`tars-deploy ${conf.module}`, {
      cwd: process.cwd()
    }, (err, stdout, stderr) => {
      if (err) reject(err)
      resolve()
    })
    subProcess.stdout.pipe(process.stdout)
  })
  console.log('编译成功。')

  console.log('正在上传发布包')
  let uploadPatchPackageResult = await request({
    method: 'POST',
    url: conf.url + '/pages/server/api/upload_patch_package',
    headers: { 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
    formData: { application: conf.app,
      module_name: conf.module,
      task_id: Date.now(),
      comment: '脚本上传的包',
      suse: {
        value: fs.createReadStream(path.resolve(process.cwd(), `./${conf.module}.tgz`)),
        options: { filename: path.resolve(process.cwd(), `./${conf.module}.tgz`), contentType: null }
      }
    }
  })
  uploadPatchPackageResult = JSON.parse(uploadPatchPackageResult)
  if (uploadPatchPackageResult.ret_code !== 200) {
    throw uploadPatchPackageResult
  }
  const packageInfo = uploadPatchPackageResult.data
  console.log('上传发布包成功。包id', packageInfo.id)

  console.log('正在删除本地包文件')
  fs.unlinkSync(path.resolve(process.cwd(), `./${conf.module}.tgz`))

  console.log('正在创建发布任务', serverListIds)
  const task = await createTask(serverListIds, 'patch_tars', {
    patch_id: packageInfo.id, // 版本号
    update_text: '发布自脚本', // 备注
    bak_flag: true // 备机标识，true：备机，false：主机
  })
  console.log('发布任务创建成功. taskNo', task.task_no)

  console.log('正在轮询任务状态')
  await intervalTask(task.task_no, 2)
  console.log('发布成功')

  console.log('正在添加重启任务')
  const restartTask = await createTask(serverListIds, 'restart')
  console.log('重启任务添加成功。')
  await intervalTask(restartTask.task_no, 2)
  console.log('done')

  async function createTask (serverListIds, command, param) {
    const task = await request({
      method: 'post',
      url: conf.url + '/pages/server/api/add_task',
      headers: {
        'content-type': 'application/json'
      },
      json: true,
      body: {
        'serial': true, // 是否串行
        'items': serverListIds.map(id => {
          return {
            'server_id': id, // 服务
            'command': command, // 命令字
            'parameters': param
          }
        })
      }
    })
    if (task.ret_code === 200) {
      return task.data
    } else {
      throw task
    }
  }

  async function getTaskInfo (taskNo) {
    const task = await request({
      method: 'post',
      url: conf.url + '/pages/server/api/task',
      headers: {
        'content-type': 'application/json'
      },
      json: true,
      qs: {
        'task_no': taskNo
      }
    })
    if (task.ret_code === 200) {
      return task.data
    } else {
      throw task
    }
  }

  async function intervalTask (taskNo, successStatus) {
    return new Promise((resolve, reject) => {
      const a = setInterval(() => {
        getTaskInfo(taskNo).then(t => {
          console.log(t.status)
          if (t.status === successStatus) {
            clearInterval(a)
            resolve()
          }
        }).catch(reject)
      }, 1500)
    })
  }
}
