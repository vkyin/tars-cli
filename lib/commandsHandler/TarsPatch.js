const fs = require('fs')
const path = require('path')
const extract = require('util').promisify(require('extract-zip'))
const mkdirp = require('util').promisify(require('mkdirp'))
const { exec, hasPackageJson, wait } = require('./../util')
const request = require('request-promise-native')

module.exports = async function (ctx, { tempDir }, {
  appName, serverName, codeZipPkg, patcher
}) {
  const filename = serverName + '.zip'
  const codePkgPath = path.resolve(tempDir, filename)
  const decompressDir = path.resolve(path.dirname(codePkgPath), path.basename(codePkgPath, '.zip'))
  ctx.print('正在创建代码目录')
  await mkdirp(path.dirname(codePkgPath))
  ctx.print('正在转换压缩包: ', filename)
  fs.writeFileSync(codePkgPath, codeZipPkg)
  ctx.print('正在解压压缩包: ', filename)
  await extract(codePkgPath, {
    dir: decompressDir
  })

  if (!hasPackageJson(decompressDir)) {
    ctx.print(`${decompressDir}目录下没有package.json`)
    return
  }

  ctx.print(`准备发布 "${appName}.${serverName}" on "${ctx.conf.tarswebUrl}"`)
  ctx.print('如果有问题，赶紧Ctrl C')
  await wait(1500)

  ctx.print('正在拉取服务信息')
  const { data: serverlist, ret_code: serverListReqCode } = await request({ method: 'GET', url: ctx.conf.tarswebUrl + '/pages/tree', json: true })

  if (serverListReqCode !== 200) {
    ctx.print('拉取服务信息失败')
    return
  }

  const app = serverlist.find(o => o.name === appName).children.find(o => o.name === serverName)
  if (!app) {
    ctx.print(`${appName}.${serverName} not found`)
    return
  }
  ctx.print('拉取服务信息成功。服务id：', app.id)

  let d = await request({
    method: 'post',
    url: ctx.conf.tarswebUrl + '/pages/server/api/server_list',
    json: true,
    qs: {
      'tree_node_id': app.id
    }
  })
  if (d.ret_code !== 200) {
    ctx.print('拉取服务信息失败')
    return
  }
  const serverListIds = d.data.map(o => o.id)
  ctx.print(JSON.stringify(serverListIds))

  ctx.print('正在编译')
  await exec(`${path.resolve(__dirname, './../../node_modules/.bin/tars-deploy')} ${serverName}`, decompressDir, ctx)
  ctx.print('编译成功。')

  ctx.print('正在上传发布包')
  let uploadPatchPackageResult = await request({
    method: 'POST',
    url: ctx.conf.tarswebUrl + '/pages/server/api/upload_patch_package',
    headers: { 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
    formData: { application: appName,
      module_name: serverName,
      task_id: Date.now(),
      comment: `${patcher} 上传的包`,
      suse: {
        value: fs.createReadStream(path.resolve(decompressDir, `./${serverName}.tgz`)),
        options: { filename: path.resolve(decompressDir, `./${serverName}.tgz`), contentType: null }
      }
    }
  })
  uploadPatchPackageResult = JSON.parse(uploadPatchPackageResult)
  if (uploadPatchPackageResult.ret_code !== 200) {
    ctx.print('上传失败')
    return
  }
  const packageInfo = uploadPatchPackageResult.data
  ctx.print('上传发布包成功。包id', packageInfo.id)

  ctx.print('正在删除本地包文件')
  fs.unlinkSync(path.resolve(decompressDir, `./${serverName}.tgz`))

  ctx.print('正在创建发布任务', serverListIds)
  const task = await createTask(serverListIds, 'patch_tars', {
    patch_id: packageInfo.id, // 版本号
    update_text: '发布自脚本', // 备注
    bak_flag: true // 备机标识，true：备机，false：主机
  })
  ctx.print('发布任务创建成功. taskNo', task.task_no)

  ctx.print('正在轮询任务状态')
  await intervalTask(task.task_no, 2)
  ctx.print('发布成功')

  ctx.print('正在添加重启任务')
  const restartTask = await createTask(serverListIds, 'restart')
  ctx.print('重启任务添加成功。')
  await intervalTask(restartTask.task_no, 2)
  ctx.print('done')

  async function createTask (serverListIds, command, param) {
    const task = await request({
      method: 'post',
      url: ctx.conf.tarswebUrl + '/pages/server/api/add_task',
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
      url: ctx.conf.tarswebUrl + '/pages/server/api/task',
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
          ctx.print(t.status)
          if (t.status === successStatus) {
            clearInterval(a)
            resolve()
          }
        }).catch(reject)
      }, 1500)
    })
  }
}
