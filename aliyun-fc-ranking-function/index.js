const Redis = require('ioredis');

// 从FC环境变量读取Redis配置（需在FC控制台配置）
const REDIS_HOST = process.env.REDIS_HOST || process.env.TAIR_HOST;
const REDIS_PORT = process.env.REDIS_PORT || process.env.TAIR_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || process.env.TAIR_PASSWORD || '';
const REDIS_DB = process.env.REDIS_DB || process.env.TAIR_DB || 0;

// 创建Redis连接
const redis = new Redis({
  host: REDIS_HOST,
  port: parseInt(REDIS_PORT),
  password: REDIS_PASSWORD,
  db: parseInt(REDIS_DB),
  connectTimeout: 5000, // 连接超时时间
  // 配置Tair特定参数
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// 处理Redis连接错误
redis.on('error', (err) => {
  console.error('Redis连接失败:', err);
});

// 排行榜键名
const RANKING_KEY = 'single_pass_time';

/**
 * 处理排行榜上传请求
 * @param {Object} data 上传数据，包含userId, time
 * @returns {Promise<Object>} 处理结果
 */
async function handleUpload(data) {
  try {
    const { userId, time, nickname, comment } = data;
    
    // 验证数据
    if (!userId || !time) {
      return { code: 400, message: '缺少参数：userId或time' };
    }
    
    // 确保时间是数字
    const timeValue = parseFloat(time);
    if (isNaN(timeValue)) {
      return { code: 400, message: '时间格式不正确' };
    }
    
    // 生成唯一ID（使用时间戳+随机数）
    const recordId = `record_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // 保存详细信息到Hash（兼容原有格式）
    await redis.hset(recordId, {
      userId,
      nickname: nickname || userId,
      time: timeValue,
      comment: comment || '',
      timestamp: Date.now()
    });
    
    // 添加到排行榜（ZADD，分数为时间值，因为要按时间越少排名越靠前）
    await redis.zadd(RANKING_KEY, timeValue, recordId);
    
    // 获取排名（ZREVRANK返回的是0-based索引，所以加1）
    const rank = await redis.zrank(RANKING_KEY, recordId);
    
    return {
      code: 200,
      message: '上传成功',
      data: {
        rank: rank + 1,
        recordId
      }
    };
  } catch (error) {
    console.error('上传失败:', error);
    return { code: 500, message: '服务器内部错误' };
  }
}

/**
 * 处理排行榜查询请求
 * @param {Object} params 查询参数，包含limit, offset
 * @returns {Promise<Object>} 查询结果
 */
async function handleQuery(params) {
  try {
    const limit = parseInt(params.limit || 10);
    const offset = parseInt(params.offset || 0);
    const page = Math.floor(offset / limit) + 1;
    const pageSize = limit;
    
    // 验证参数
    if (limit < 1 || limit > 100) {
      return { code: 400, message: '参数不正确' };
    }
    
    // 计算起始和结束索引
    const start = offset;
    const end = offset + limit - 1;
    
    // 获取总记录数
    const total = await redis.zcard(RANKING_KEY);
    
    // 查询排行榜（ZREVRANGE返回的是按分数从高到低的顺序，所以需要使用ZRANGE）
    const recordIds = await redis.zrange(RANKING_KEY, start, end);
    
    // 获取详细信息
    const records = [];
    for (let i = 0; i < recordIds.length; i++) {
      const recordId = recordIds[i];
      const info = await redis.hgetall(recordId);
      
      if (info) {
        records.push({
          rank: start + i + 1,
          recordId,
          userId: info.userId || info.nickname,
          nickname: info.nickname || info.userId,
          time: parseFloat(info.time),
          comment: info.comment || '',
          timestamp: parseInt(info.timestamp)
        });
      }
    }
    
    // 兼容原有格式和新格式
    return {
      code: 200,
      message: '查询成功',
      data: records,
      success: true, // 兼容原有格式
      data: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        records
      }
    };
  } catch (error) {
    console.error('查询失败:', error);
    return { code: 500, message: '服务器内部错误' };
  }
}

/**
 * 阿里云FC函数入口
 * @param {Object} event FC事件对象
 * @param {Object} context FC上下文对象
 * @returns {Promise<Object>} HTTP响应
 */
exports.handler = async (event, context, callback) => {
  // 解析HTTP请求（FC的event中包含请求信息）
  const request = event.httpMethod ? event : { ...event, httpMethod: event.method, path: event.path || '/' };
  const { httpMethod: method, path, queryStringParameters = {}, body = '' } = request;
  
  // 解析请求体
  let requestBody = {};
  try {
    requestBody = JSON.parse(body || '{}');
  } catch (error) {
    // 如果解析失败，尝试解析为表单数据
    try {
      const querystring = require('querystring');
      requestBody = querystring.parse(body || '');
    } catch (e) {
      requestBody = {};
    }
  }
  
  // 设置跨域响应头（允许前端域名访问）
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOW_ORIGIN || '*', // 前端域名，开发环境可临时设为*
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  // 处理OPTIONS请求（跨域预请求）
  if (method === 'OPTIONS') {
    const response = {
      statusCode: 204,
      headers,
      body: ''
    };
    
    // 兼容callback和Promise两种方式
    if (callback) {
      return callback(null, response);
    }
    return response;
  }
  
  try {
    let result;
    
    // 兼容原有路径和新路径
    if ((path === '/upload' || path === '/ranking') && method === 'POST') {
      // 处理上传请求
      result = await handleUpload(requestBody);
    } else if ((path === '/query' || path === '/ranking') && method === 'GET') {
      // 处理查询请求，从queryStringParameters获取参数
      result = await handleQuery(queryStringParameters);
    } else {
      // 无效路径
      result = { code: 404, message: '接口不存在' };
    }
    
    // 设置状态码
    const statusCode = result.code || (result.success ? 200 : 400);
    
    const response = {
      statusCode,
      headers,
      body: JSON.stringify(result)
    };
    
    // 兼容callback和Promise两种方式
    if (callback) {
      return callback(null, response);
    }
    return response;
    
  } catch (err) {
    console.error('处理请求失败:', err);
    
    const result = { code: 500, message: '服务器内部错误' };
    
    const response = {
      statusCode: 500,
      headers,
      body: JSON.stringify(result)
    };
    
    // 兼容callback和Promise两种方式
    if (callback) {
      return callback(null, response);
    }
    return response;
  }
};

// 本地测试用（如果直接运行该文件）
if (require.main === module) {
  console.log('阿里云FC排行榜函数代码已加载');
  console.log('请部署到阿里云FC环境中运行');
}