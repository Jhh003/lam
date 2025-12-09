// 应用配置文件
// 用户可以在这里修改各种配置参数

const config = {
  // 排行榜API配置
  ranking: {
    // 阿里云FC Web函数的API地址
    // 请将以下地址替换为您部署的阿里云FC函数地址
    // 格式示例: https://<your-fc-endpoint>.<region>.fc.aliyuncs.com/2016-08-15/proxy/<service-name>-
    // 例如: https://1234567890.cn-beijing.fc.aliyuncs.com/2016-08-15/proxy/limbus-ranking/
    apiUrl: 'https://limbus-service-sbqqgqwpja.cn-beijing.fcapp.run'
  }
};

// 导出配置
try {
  module.exports = config;
} catch (e) {
  // 如果在浏览器环境中，将配置挂载到window对象
  window.appConfig = config;
}