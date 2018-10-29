#! /usr/bin/env node
// 读取配置
const fs = require('fs')
const path = require('path')
const conf = require('./tarsweb.js')
require('request')
var request = require('request-promise-native')
// run @tars-deploy
main().catch(err => {
  console.log(err)
})
async function main () {
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
  console.log('编译成功。正在上传发布包')

  const packageInfo = await new Promise((resolve, reject) => {
    request({ method: 'POST',
      url: 'http://dev.tarsproxy.tencentyun.com/pages/server/api/upload_patch_package',
      headers:
   { 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
      formData:
   { application: conf.app,
     module_name: conf.module,
     task_id: Date.now(),
     comment: '脚本上传的包',
     suse:
      { value: fs.createReadStream(path.resolve(process.cwd(), `./${conf.module}.tgz`)),
        options:
         { filename: path.resolve(process.cwd(), `./${conf.module}.tgz`),
           contentType: null } } } }, function (error, response, body) {
      if (error) reject(error)

      body = JSON.parse(body)
      if (body.ret_code === 200) {
        resolve(body.data)
      } else {
        reject(body)
      }
    })
  })

  console.log('上传发布包成功', packageInfo)
  console.log('正在删除本地包文件')
  fs.unlinkSync(path.resolve(process.cwd(), `./${conf.module}.tgz`))
  console.log('正在拉取服务信息')

  const serverlist = await new Promise((resolve, reject) => {
    request({ method: 'GET', url: 'http://dev.tarsproxy.tencentyun.com/pages/tree' }, function (error, response, body) {
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

  console.log('拉取服务信息成功', app.id)

  let d = await request({
    method: 'post',
    url: 'http://dev.tarsproxy.tencentyun.com/pages/server/api/server_list',
    json: true,
    qs: {
      'tree_node_id': app.id
    }
  })
  if (d.ret_code !== 200) {
    throw d
  }
  const serverListIds = d.data.map(o => o.id)

  console.log('正在创建发布任务', serverListIds)
  const task = await new Promise((resolve, reject) => {
    request({
      method: 'post',
      url: 'http://dev.tarsproxy.tencentyun.com/pages/server/api/add_task',
      headers: {
        'content-type': 'application/json'
      },
      json: true,
      body: {
        'serial': true, // 是否串行
        'items': serverListIds.map(id => {
          return {
            'server_id': id, // 服务
            'command': 'patch_tars', // 命令字
            'parameters': {
              patch_id: packageInfo.id, // 版本号
              update_text: '发布自脚本', // 备注
              bak_flag: true // 备机标识，true：备机，false：主机
            }
          }
        }).concat(serverListIds.map(id => {
          return {
            'server_id': id, // 服务
            'command': 'restart'
          }
        }))
      }
    }, (err, res, body) => {
      if (err) reject(err)
      console.log(body)
      if (body.ret_code === 200) {
        resolve(body.data)
      } else {
        reject(body)
      }
    })
  })
  console.log('发布任务创建成功', task)
  await new Promise((resolve, reject) => {
    const a = setInterval(() => {
      request({
        method: 'post',
        url: 'http://dev.tarsproxy.tencentyun.com/pages/server/api/task',
        headers: {
          'content-type': 'application/json'
        },
        json: true,
        qs: {
          'task_no': task.task_no
        }
      }, (err, res, body) => {
        if (err) reject(err)
        console.log(body)
        if (body.data.status === 2) {
          resolve()
          clearInterval(a)
        }
      })
    }, 1500)
  })
  console.log('发布成功')
}
