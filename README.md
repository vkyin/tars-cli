# tars-web

## usage

在编译机(如: 10.1.1.12)上运行服务端
```bash
tars-web runServer 8080 http://yourtarsweb.com
```

在客户端执行

```bash
# 发布到测试环境
tars-web patch TestApp TestModule -r 10.1.1.12:8080

# 打包
tars-web deploy TestModule -r 10.1.1.12:8080
```