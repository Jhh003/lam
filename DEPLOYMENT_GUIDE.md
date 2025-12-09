# 排行榜功能部署指南

本指南将帮助您在阿里云函数计算（FC）上部署排行榜功能，并配置与Redis（或Tair）的连接。

## 前置条件

1. 已拥有阿里云账号
2. 已创建Tair/Redis实例（公网或内网）
3. 已安装Node.js环境（用于本地开发和依赖安装）

## 后端部署（阿里云FC）

### 1. 安装依赖

在`aliyun-fc-ranking-function`目录下执行：

```bash
npm install ioredis
```

### 2. 打包代码

将以下文件/文件夹打包为zip文件：
- `index.js`
- `package.json`
- `package-lock.json`（可选）
- `node_modules/`（包含ioredis依赖）

### 3. 创建FC函数

1. 登录[阿里云FC控制台](https://fc.console.aliyun.com/)
2. 创建服务（如`limbus-ranking-service`）
3. 在服务下创建函数：
   - 函数名称：如`ranking-function`
   - 运行环境：Node.js 14.x或更高版本
   - 函数入口：`index.handler`
   - 代码上传方式：选择"ZIP包上传"，上传刚才打包的zip文件

### 4. 配置环境变量

在函数配置页面，添加以下环境变量：

| 环境变量名 | 说明 | 示例值 |
|-----------|------|-------|
| `REDIS_HOST` | Redis/Tair主机地址 | `` |
| `REDIS_PORT` | Redis/Tair端口 | `` |
| `REDIS_PASSWORD` | Redis/Tair密码 | `` |
| `REDIS_DB` | 使用的数据库编号 | `` |
| `ALLOW_ORIGIN` | 允许的前端域名（开发环境可设为`*`） | `https://your-frontend.com`或`*` |

> 注：如果使用Tair，也可以使用旧的环境变量名（`TAIR_HOST`、`TAIR_PORT`等），代码已兼容。

### 5. 配置HTTP触发器

在函数页面，添加HTTP触发器：

- 触发路径：`/ranking`
- 请求方法：`GET, POST, OPTIONS`
- 认证方式：根据需求选择（前端公开访问可设为"匿名"）

### 6. 测试API

部署完成后，您可以使用以下方式测试API：

#### 上传成绩
```bash
curl -X POST "https://<your-fc-endpoint>/ranking" \
  -H "Content-Type: application/json" \
  -d '{"userId":"player1","time":120}'
```

#### 查询排行榜
```bash
curl "https://<your-fc-endpoint>/ranking?limit=10&offset=0"
```

## 前端配置

### 1. 配置API地址

在前端代码中，修改`config.js`文件，设置正确的FC API地址：

```javascript
window.appConfig = {
  ranking: {
    apiUrl: 'https://<your-fc-endpoint>/ranking' // 替换为您的FC函数地址
  }
};
```

### 2. 部署前端代码

将前端代码部署到GitHub Pages或其他静态网站托管服务。

## 关键注意事项

### 1. 跨域问题

- 确保在FC控制台配置了正确的`ALLOW_ORIGIN`环境变量
- 开发环境可以临时设为`*`，生产环境建议设置为具体的前端域名

### 2. Redis网络可达

- 如果Redis/Tair部署在阿里云VPC内，需在FC函数配置中开启**VPC访问**
- 如果使用公网Redis，需确保Redis实例已开启公网访问，并配置了正确的白名单

### 3. 参数说明

#### 上传接口（POST /ranking）

请求体参数：
- `userId`：用户ID（必填）
- `time`：时间（秒，必填）
- `nickname`：用户昵称（可选，兼容旧版本）
- `comment`：备注（可选）

响应格式：
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "rank": 1,
    "recordId": "record_1234567890"
  }
}
```

#### 查询接口（GET /ranking）

查询参数：
- `limit`：每页数量（默认10）
- `offset`：偏移量（默认0）

响应格式：
```json
{
  "code": 200,
  "message": "查询成功",
  "data": [
    {
      "rank": 1,
      "recordId": "record_1234567890",
      "userId": "player1",
      "nickname": "玩家1",
      "time": 120,
      "comment": "第一次通关",
      "timestamp": 1234567890
    },
    // 更多记录...
  ]
}
```

## 兼容性说明

代码已实现向后兼容，支持：

1. 旧的API路径（`/upload`和`/query`）
2. 旧的请求参数（`nickname`代替`userId`）
3. 旧的响应格式（`success`字段代替`code`字段）
4. 旧的环境变量（`TAIR_*`代替`REDIS_*`）

## 常见问题

1. **Redis连接失败**：
   - 检查环境变量是否配置正确
   - 确保Redis实例已开启公网访问（如果使用公网）
   - 检查Redis白名单是否包含FC的IP地址

2. **跨域错误**：
   - 检查`ALLOW_ORIGIN`环境变量是否配置正确
   - 确保HTTP触发器支持OPTIONS请求

3. **请求失败**：
   - 检查API地址是否正确
   - 查看FC控制台的日志，了解具体错误信息

4. **部署失败**：
   - 确保zip包包含所有必要的文件
   - 确保Node.js版本与FC运行环境一致

## 维护建议

1. **定期备份数据**：定期备份Redis中的排行榜数据
2. **监控性能**：在FC控制台设置监控，关注函数调用次数和响应时间
3. **安全更新**：定期更新ioredis依赖版本，修复安全漏洞
4. **日志分析**：定期查看FC日志，了解系统运行情况

如有其他问题，请参考[阿里云FC文档](https://help.aliyun.com/document_detail/52837.html)或[阿里云Tair文档](https://help.aliyun.com/product/155570.html)。