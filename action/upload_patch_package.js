module.exports = () => {
  var fs = require('fs')
  var request = require('request')

  var options = { method: 'POST',
    url: 'http://dev.tarsproxy.tencentyun.com/pages/server/api/upload_patch_package',
    headers:
   { 'Postman-Token': '8cb8068c-a753-421a-ae62-8927a8f383af',
     'cache-control': 'no-cache',
     'Content-Type': 'application/json',
     'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
    formData:
   { application: 'Test',
     module_name: 'HelloServer',
     task_id: '123412341234',
     suse:
      { value: 'fs.createReadStream("/Users/yinyongqi/workspace/god-ident-tars/testHttp/VkTest.tgz")',
        options:
         { filename: '/Users/yinyongqi/workspace/god-ident-tars/testHttp/VkTest.tgz',
           contentType: null } } } }

  request(options, function (error, response, body) {
    if (error) throw new Error(error)

    console.log(body)
  })
}
