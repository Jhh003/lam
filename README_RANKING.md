# 单通时间排行榜功能说明与部署指南

## 功能概述

本项目为计时器弹窗添加了"上传到单通时间排行榜"功能，使用阿里云的云数据库Tair（兼容Redis产品）作为存储，实现了用时越少排名越靠前的排行榜系统。

### 主要功能

1. **计时器功能**：原有计时器的开始、暂停、重置功能
2. **排行榜上传**：将单通时间上传到排行榜，包含昵称和备注信息
3. **排行榜查询**：查看当前排行榜数据，按用时从少到多排序
4. **响应式设计**：适配桌面端和移动端设备

## 前端代码说明

### 文件结构

```
├── index.html          # 主页面，包含计时器弹窗
├── config.js           # 配置文件，用于设置API地址
├── css/
│   └── common.css      # 公共样式文件
└── js/
    └── common.js       # 核心功能实现，包含计时器和排行榜功能
```

### 主要修改点

1. **index.html**
   - 在计时器弹窗中添加了排行榜功能的表单和按钮
   - 添加了`config.js`的引用

2. **config.js**
   - 新增配置文件，用于设置排行榜API地址
   - 支持浏览器和Node.js环境

3. **js/common.js**
   - 新增排行榜上传功能
   - 新增排行榜查询功能
   - 新增排行榜弹窗展示功能
   - 从配置文件读取API地址

### 前端功能实现

1. **上传到排行榜**
   - 收集用户昵称、单通时间和备注信息
   - 发送POST请求到后端API
   - 显示上传结果提示

2. **查看排行榜**
   - 发送GET请求到后端API获取排行榜数据
   - 格式化排行榜数据为HTML
   - 显示排行榜弹窗

3. **排行榜弹窗**
   - 响应式设计，适配不同屏幕尺寸
   - 显示排名、昵称、用时和备注信息
   - 支持关闭弹窗

## 后端FC函数部署说明

### 文件结构

```
└── aliyun-fc-ranking-function/
    ├── index.js        # FC函数主代码
    ├── package.json    # 依赖配置
    └── README.md       # FC函数详细说明
```

### 部署步骤

1. **登录阿里云控制台**
   - 访问 [阿里云控制台](https://www.aliyun.com/) 并登录

2. **创建Tair实例**
   - 进入 [Tair产品页](https://www.aliyun.com/product/tair)
   - 创建Tair实例，选择"兼容Redis 6.0"版本
   - 启用公网访问，设置密码
   - 配置白名单，允许FC函数的IP访问

3. **创建FC函数**
   - 进入 [函数计算FC控制台](https://fcnext.console.aliyun.com/)
   - 创建服务，命名为 `limbus-ranking-service`
   - 在服务中创建函数，配置如下：
     - 函数名称：`single-pass-ranking`
     - 运行时：`Node.js 18`
     - 函数类型：`Web函数`
     - 处理器：`index.handler`

4. **配置环境变量**
   - 在FC函数配置页面，添加以下环境变量：
     | 环境变量名 | 值 |
     |------------|-----|
     | TAIR_HOST | `r-2zek8qti0tuhf2wuspd.redis.rds.aliyuncs.com` |
     | TAIR_PORT | `6379` |
     | TAIR_PASSWORD | `rxi4gSzwcJQn!TqR3w&$_LxW3*D` |
     | TAIR_DB | `0` |

5. **上传代码**
   - 进入aliyun-fc-ranking-function目录
   - 将目录下的所有文件打包为ZIP格式
   - 在FC控制台上传ZIP包

6. **配置触发器**
   - 类型：`HTTP触发器`
   - 路径：`/ranking`
   - 允许的HTTP方法：`GET, POST, OPTIONS`
   - 认证方式：`匿名访问`

7. **获取API地址**
   - 触发器创建完成后，复制生成的公网访问地址
   - 格式示例：`https://<your-fc-endpoint>.<region>.fc.aliyuncs.com/2016-08-15/proxy/limbus-ranking-service/single-pass-ranking/`

## 前端配置

1. **修改config.js**
   - 打开 `config.js` 文件
   - 将 `apiUrl` 值替换为您的FC函数公网访问地址

2. **测试功能**
   - 打开网页，点击"单通时间计时"按钮
   - 测试上传和查看排行榜功能

## 阿里云Tair数据库配置

### 数据结构

- **排行榜数据**：使用Redis的Sorted Set存储
  - 键名：`single_pass_ranking`
  - 分数：单通时间（秒）
  - 成员：记录ID

- **记录详细信息**：使用Redis的Hash存储
  - 键名：记录ID（格式：`record_${timestamp}_${random}`）
  - 字段：nickname, time, comment, timestamp

### 白名单配置

为了确保安全，建议在Tair控制台配置白名单，只允许FC函数的IP访问：

1. 登录阿里云Tair控制台
2. 找到您的Tair实例
3. 进入"连接管理"页面
4. 在"白名单设置"中添加FC函数的IP地址

## 配置文件说明

项目根目录下的`config.js`文件用于配置排行榜API地址：

```javascript
const config = {
  // 排行榜API配置
  ranking: {
    // 阿里云FC Web函数的API地址
    // 请将以下地址替换为您部署的阿里云FC函数地址
    // 格式示例: https://<your-fc-endpoint>.<region>.fc.aliyuncs.com/2016-08-15/proxy/<service-name>/<function-name>/
    apiUrl: 'https://your-aliyun-fc-endpoint.rg-cn-beijing.fc.aliyuncs.com/2016-08-15/proxy/limbus-ranking-service/single-pass-ranking/'
  }
};
```

**修改步骤**：
1. 打开`config.js`文件
2. 将`apiUrl`的值替换为您部署的阿里云FC函数的地址
3. 保存文件

## 使用示例

### 1. 上传单通时间

1. 打开网页，点击计时器按钮
2. 使用计时器记录单通时间
3. 完成计时后，在计时器弹窗中找到"上传到排行榜"功能
4. 输入昵称和备注信息
5. 点击"上传到排行榜"按钮
6. 等待上传结果提示

### 2. 查看排行榜

1. 打开网页，点击计时器按钮
2. 在计时器弹窗中找到"查看排行榜"按钮
3. 点击按钮，查看当前排行榜数据
4. 排行榜按用时从少到多排序，显示排名、昵称、用时和备注信息

## 前端API调用

### 上传排行榜记录

**请求URL**：`{apiUrl}/upload`
**请求方法**：POST
**请求参数**：

```json
{
  "nickname": "玩家昵称",
  "time": 150,
  "comment": "备注信息"
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

### 查询排行榜

**请求URL**：`{apiUrl}/query`
**请求方法**：GET
**请求参数**：

| 参数名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| page | number | 1 | 页码 |
| pageSize | number | 10 | 每页记录数 |

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

## 常见问题解决

### 1. 上传失败

- 检查网络连接是否正常
- 确认API地址配置正确
- 检查阿里云FC函数是否正常运行
- 检查Tair数据库连接是否正常

### 2. 查看排行榜失败

- 检查网络连接是否正常
- 确认API地址配置正确
- 检查阿里云FC函数是否正常运行
- 检查Tair数据库连接是否正常

### 3. 样式问题

- 检查CSS文件是否正确加载
- 确认浏览器支持CSS Grid布局
- 清除浏览器缓存后重试

### 4. 移动端适配问题

- 项目已实现响应式设计，适配移动端设备
- 确认`common.css`中的媒体查询设置正确

## 技术栈

- **前端**：HTML5, CSS3, JavaScript (ES6+)
- **后端**：Node.js 18, 阿里云函数计算（FC）
- **数据库**：阿里云Tair（兼容Redis）
- **依赖**：ioredis (Redis客户端)

## 许可证

MIT License