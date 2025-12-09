# 阿里云FC函数 - 单通时间排行榜

## 功能说明

该阿里云FC Web函数用于处理单通时间排行榜的上传和查询请求，使用阿里云Tair（兼容Redis）作为数据库存储。

## 功能特性

- **排行榜上传**：将玩家的单通时间上传到排行榜
- **排行榜查询**：分页查询排行榜数据，按用时越少排名越靠前
- **CORS支持**：支持跨域请求，方便前端页面调用
- **环境变量配置**：通过环境变量配置Tair数据库连接信息

## 技术栈

- **运行时**：Node.js 18
- **Redis客户端**：ioredis
- **部署平台**：阿里云函数计算（FC）

## 快速开始

### 1. 安装依赖

```bash
cd aliyun-fc-ranking-function
npm install
```

### 2. 配置环境变量

在阿里云FC控制台中配置以下环境变量：

| 环境变量名 | 说明 | 示例值 |
|------------|------|--------|
| TAIR_HOST | Tair数据库地址 | r-bp1xxxxxxxxxx.redis.rds.aliyuncs.com |
| TAIR_PORT | Tair数据库端口 | 6379 |
| TAIR_PASSWORD | Tair数据库密码 | your_password |
| TAIR_DB | 数据库编号 | 0 |

### 3. 部署到阿里云FC

#### 方式一：使用FC CLI部署

1. 安装FC CLI：

```bash
npm install @alicloud/fc2 -g
```

2. 配置FC CLI：

```bash
fc config
```

3. 部署函数：

```bash
cd aliyun-fc-ranking-function
fc deploy
```

#### 方式二：使用阿里云控制台部署

1. 登录阿里云FC控制台
2. 创建函数：
   - 函数名称：single-pass-ranking
   - 运行时：Node.js 18
   - 函数类型：Web函数
   - 处理器：index.handler
3. 上传代码包：
   - 将当前目录下的所有文件打包为ZIP格式
   - 上传到FC控制台
4. 配置环境变量（参考步骤2）
5. 配置触发器：
   - 类型：HTTP触发器
   - 路径：/ranking
   - 允许的HTTP方法：GET, POST, OPTIONS

## API文档

### 1. 上传排行榜记录

**接口地址**：`/upload`
**请求方法**：POST
**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| nickname | string | 是 | 玩家昵称 |
| time | number | 是 | 单通时间（秒） |
| comment | string | 否 | 备注信息 |

**请求示例**：

```json
{
  "nickname": "玩家123",
  "time": 120,
  "comment": "这是一个测试记录"
}
```

**响应示例**：

```json
{
  "success": true,
  "message": "上传成功",
  "data": {
    "rank": 5,
    "recordId": "record_1234567890_123"
  }
}
```

### 2. 查询排行榜

**接口地址**：`/query`
**请求方法**：GET
**请求参数**：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 10 | 每页记录数 |

**请求示例**：

```
/query?page=1&pageSize=10
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "totalPages": 10,
    "records": [
      {
        "rank": 1,
        "recordId": "record_1234567890_123",
        "nickname": "玩家123",
        "time": 120,
        "comment": "这是一个测试记录",
        "timestamp": 1234567890
      }
    ]
  }
}
```

## 数据结构

### 排行榜数据

使用Redis的Sorted Set（有序集合）存储排行榜数据：

- **键名**：`single_pass_ranking`
- **分数**：单通时间（秒）
- **成员**：记录ID（格式：`record_${timestamp}_${random}`）

### 记录详细信息

使用Redis的Hash存储每条记录的详细信息：

- **键名**：记录ID（如`record_1234567890_123`）
- **字段**：
  - nickname：玩家昵称
  - time：单通时间（秒）
  - comment：备注信息
  - timestamp：记录创建时间（时间戳）

## 注意事项

1. 请确保Tair数据库已经开启公网访问权限（如果FC函数部署在公网）
2. 建议为Tair数据库设置白名单，只允许FC函数的IP访问
3. 定期备份Tair数据库中的排行榜数据
4. 如果排行榜数据量较大，建议设置合理的过期时间或定期清理旧数据

## 本地测试

在本地环境中测试函数：

```bash
# 设置环境变量
set TAIR_HOST=localhost
set TAIR_PORT=6379

# 运行测试脚本
node test.js
```

## 故障排除

1. **连接Tair失败**：
   - 检查环境变量配置是否正确
   - 检查Tair数据库的网络访问权限
   - 检查Tair数据库是否正常运行

2. **API调用失败**：
   - 检查请求方法和路径是否正确
   - 检查请求参数是否符合要求
   - 查看FC函数的日志信息

3. **CORS错误**：
   - 确保函数返回了正确的CORS头
   - 检查前端请求的Origin是否在允许的范围内

## 许可证

MIT License