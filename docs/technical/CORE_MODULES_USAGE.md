# LAM 新架构核心模块使用说明

## 📦 模块概览

LAM项目的新核心架构由三个主要模块组成：

### 1. **AppState** (`js/core/appState.js`)
- **目标**: 中央应用状态管理
- **大小**: ~620 行
- **功能**: 
  - 统一管理所有应用状态
  - 提供getter/setter方法
  - 自动localStorage持久化
  - 状态变化通知

### 2. **EventBus** (`js/core/eventBus.js`)
- **目标**: 事件驱动的模块通信
- **大小**: ~570 行
- **功能**:
  - 发布-订阅模式
  - 事件优先级管理
  - 中间件支持
  - 事件历史跟踪

### 3. **Logger** (`js/core/logger.js`)
- **目标**: 应用日志和调试
- **大小**: ~350 行
- **功能**:
  - 多级别日志记录
  - 本地存储日志
  - 日志导出（JSON/CSV）
  - 调试工具集

---

## 🚀 快速开始

### 基础导入

```javascript
import { appState } from './core/appState.js';
import { eventBus, GameEvents } from './core/eventBus.js';
import { logger } from './core/logger.js';
```

### 初始化应用

```javascript
// 连接AppState和EventBus
appState.setEventBus(eventBus);

// 设置事件错误处理
eventBus.onError(({ error, eventName }) => {
    logger.error(`事件错误 (${eventName}):`, error);
});

// 标记应用已初始化
appState.set('app.isInitialized', true);
eventBus.emit(GameEvents.APP_INITIALIZED);
```

---

## 📊 AppState 详细使用

### 状态结构

```
AppState包含以下主要部分：

- app: { currentPage, hasUnsavedChanges, isInitialized }
- game: { selectedSinner, selectedPersona, isScrolling, easterEggTriggered }
- filters: { sinner, persona }
- settings: { personality, theme, language }
- timer: { isRunning, elapsedSeconds, totalSeconds, startTime, pausedTime }
- ranking: { localRecords, globalRecords, lastUpdateTime }
```

### 常用方法

```javascript
// 获取状态
const sinner = appState.getSinner();
const seconds = appState.getElapsedSeconds();
const sinnerFilters = appState.getSinnerFilters();

// 设置状态
appState.setSinner(sinnerObj);
appState.setPersona(personaObj);
appState.setElapsedSeconds(120);

// 批量设置
appState.setMultiple({
    'game.selectedSinner': sinner,
    'game.selectedPersona': persona
});

// 通用getter/setter
const value = appState.get('game.selectedSinner');
appState.set('game.selectedSinner', newValue);

// 检查启用状态
const enabled = appState.isSinnerEnabled(sinnerId);

// 添加本地记录
appState.addLocalRecord({
    sinner: sinnerObj,
    persona: personaObj,
    elapsedSeconds: 7200
});

// 订阅状态变化
const unsubscribe = appState.subscribe(({ path, newValue }) => {
    console.log(`状态变化: ${path}`, newValue);
});

// 取消订阅
unsubscribe();
```

### localStorage持久化

```javascript
// 自动保存以下内容：
- filters.sinner (Set)
- filters.persona (Map)
- settings.personality (Map)
- ranking.localRecords (Array)

// 自动从localStorage恢复
// 清除持久化数据
appState.clearStorage();

// 重置所有状态
appState.reset();

// 获取统计信息
const stats = appState.getStats();
// { selectedSinner: true, selectedPersona: false, enabledSinners: 12, ... }
```

---

## 🎯 EventBus 详细使用

### 事件常量

```javascript
GameEvents = {
    // 应用事件
    APP_INITIALIZED: 'app:initialized',
    APP_READY: 'app:ready',
    PAGE_CHANGED: 'app:page-changed',
    
    // 游戏事件
    SINNER_SELECTED: 'sinner:selected',
    PERSONA_SELECTED: 'persona:selected',
    SCROLL_START: 'scroll:start',
    SCROLL_STOP: 'scroll:stop',
    
    // 过滤器事件
    SINNER_FILTER_CHANGED: 'filter:sinner-changed',
    PERSONA_FILTER_CHANGED: 'filter:persona-changed',
    
    // 计时器事件
    TIMER_START: 'timer:start',
    TIMER_STOP: 'timer:stop',
    TIMER_TICK: 'timer:tick',
    TIMER_RESET: 'timer:reset',
    
    // 排行榜事件
    RANKING_UPDATED: 'ranking:updated',
    RECORD_SUBMITTED: 'ranking:record-submitted',
    
    // 媒体事件
    EASTER_EGG_TRIGGERED: 'game:easter-egg-triggered',
    VIDEO_PLAY: 'media:video-play'
}
```

### 基础用法

```javascript
// 订阅事件
const unsubscribe = eventBus.subscribe(
    GameEvents.SINNER_SELECTED,
    (sinner) => {
        console.log('罪人被选择:', sinner.name);
    },
    10  // 优先级 (可选，默认0)
);

// 一次性订阅
eventBus.once(GameEvents.APP_INITIALIZED, () => {
    console.log('应用初始化完成');
});

// 发出事件
eventBus.emit(GameEvents.SINNER_SELECTED, {
    id: 1,
    name: '断头台'
});

// 异步发出事件（等待所有处理器完成）
await eventBus.emitAsync(GameEvents.RECORD_SUBMITTED, record);

// 取消订阅
unsubscribe();

// 获取订阅者数量
const count = eventBus.listenerCount(GameEvents.SINNER_SELECTED);

// 移除所有订阅者
eventBus.removeAllListeners(GameEvents.SINNER_SELECTED);
```

### 高级用法

```javascript
// 中间件 - 在事件发布前修改数据
eventBus.use((eventName, data) => {
    console.log(`事件: ${eventName}`);
    // 可以修改数据
    return {
        ...data,
        timestamp: Date.now()
    };
});

// 错误处理
eventBus.onError(({ message, error, eventName, data }) => {
    console.error(`[${eventName}] ${message}:`, error);
    // 上报到错误跟踪系统
});

// 调试模式
eventBus.enableDebug();  // 启用调试日志
eventBus.disableDebug(); // 禁用调试日志

// 获取事件历史
const history = eventBus.getEventHistory(20);  // 最近20个事件

// 获取统计信息
const stats = eventBus.getStats();
// { eventCount: 5, totalListeners: 12, middlewareCount: 1, ... }
```

---

## 📝 Logger 详细使用

### 日志级别

```javascript
LogLevel.DEBUG   // 调试信息（最详细）
LogLevel.INFO    // 一般信息
LogLevel.WARN    // 警告信息
LogLevel.ERROR   // 错误信息
LogLevel.NONE    // 不记录任何信息
```

### 基础用法

```javascript
// 不同级别的日志
logger.debug('调试信息', { detail: 'value' });
logger.info('应用初始化完成');
logger.warn('某个值超出范围', { value: 100 });
logger.error('发生错误', new Error('Something went wrong'));

// 计时
const timer = logger.time('操作标签');
// ... 执行操作 ...
timer();  // 记录耗时

// 获取日志
const allLogs = logger.getLogs();
const debugLogs = logger.getLogsByLevel(LogLevel.DEBUG);
const errorLogs = logger.getLogsByPattern(/error/i);

// 导出日志
const jsonStr = logger.exportAsJSON();
const csvStr = logger.exportAsCSV();

// 下载日志文件
logger.downloadLogs('json');   // 下载为JSON文件
logger.downloadLogs('csv');    // 下载为CSV文件

// 清除日志
logger.clear();

// 设置日志级别
logger.setLevel(LogLevel.WARN);  // 只显示WARN和ERROR

// 获取统计信息
const stats = logger.getStats();
// { total: 142, byLevel: { DEBUG: 50, INFO: 60, WARN: 25, ERROR: 7 } }
```

### 配置选项

```javascript
// 创建自定义logger实例
import Logger, { LogLevel } from './core/logger.js';

const customLogger = new Logger({
    level: LogLevel.DEBUG,        // 最小日志级别
    maxLogs: 1000,                // 最多保存1000条日志
    storageKey: 'my_logs',        // localStorage的key
    useStorage: true,             // 是否使用localStorage
    useConsole: true              // 是否输出到控制台
});
```

---

## 🔄 集成示例：过滤器系统

以下是如何将AppState、EventBus和Logger整合在一起的完整示例：

```javascript
import { appState } from './core/appState.js';
import { eventBus, GameEvents } from './core/eventBus.js';
import { logger } from './core/logger.js';

/**
 * 过滤器管理器
 */
class FilterManager {
    constructor() {
        logger.info('FilterManager 初始化');
        
        // 订阅过滤变化事件
        eventBus.subscribe(
            GameEvents.SINNER_FILTER_CHANGED,
            this.onFilterChanged.bind(this),
            10  // 高优先级，确保最先处理
        );
    }
    
    /**
     * 更新罪人过滤器
     */
    updateSinnerFilters(sinnerIds) {
        // 计时操作
        const timer = logger.time('更新罪人过滤');
        
        try {
            // 参数验证
            if (!(sinnerIds instanceof Set)) {
                throw new Error('sinnerIds 必须是 Set 类型');
            }
            
            // 更新状态
            appState.setSinnerFilters(sinnerIds);
            
            // 发出事件通知其他模块
            eventBus.emit(GameEvents.SINNER_FILTER_CHANGED, {
                enabledCount: sinnerIds.size,
                timestamp: Date.now()
            });
            
            logger.info(`罪人过滤器已更新，启用${sinnerIds.size}个罪人`);
        } catch (error) {
            // 错误处理
            logger.error('更新过滤器失败', error);
            throw error;
        } finally {
            // 记录耗时
            timer();
        }
    }
    
    /**
     * 全选所有罪人
     */
    enableAll(sinnerIds) {
        this.updateSinnerFilters(new Set(sinnerIds));
    }
    
    /**
     * 反转选择
     */
    invertSelection(allIds) {
        const current = appState.getSinnerFilters();
        const inverted = new Set(
            allIds.filter(id => !current.has(id))
        );
        this.updateSinnerFilters(inverted);
    }
    
    /**
     * 过滤变化处理
     */
    onFilterChanged(data) {
        // 这个方法会被事件触发
        logger.debug('过滤器变化事件:', data);
        
        // 更新UI等操作
        this.updateUI();
    }
    
    /**
     * 获取过滤后的列表
     */
    getFilteredSinners(allSinners) {
        const enabled = appState.getSinnerFilters();
        return allSinners.filter(s => enabled.has(s.id));
    }
    
    updateUI() {
        // UI更新逻辑...
    }
}

// 使用
const filterManager = new FilterManager();
filterManager.enableAll([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
```

---

## 🐛 调试技巧

### 在浏览器控制台中调试

应用启动后，在`window.__LAM_DEBUG__`下有以下快捷方法：

```javascript
// 访问AppState
window.__LAM_DEBUG__.getState('game.selectedSinner')
window.__LAM_DEBUG__.setState('game.selectedSinner', sinnerObj)

// 获取统计信息
window.__LAM_DEBUG__.getStats()

// 查看日志
window.__LAM_DEBUG__.getLogs()
window.__LAM_DEBUG__.downloadLogs('json')

// 启用/禁用调试
window.__LAM_DEBUG__.enableDebug()
window.__LAM_DEBUG__.disableDebug()

// 查看事件历史
window.__LAM_DEBUG__.eventBus.getEventHistory()
```

### 常见调试场景

```javascript
// 监听所有状态变化
appState.subscribe(({ path, newValue, reason }) => {
    console.log(`[STATE] ${path} = ${JSON.stringify(newValue)}`, reason);
});

// 监听所有事件
eventBus.enableDebug();

// 获取性能数据
const timer = logger.time('操作名');
// ... 执行操作 ...
timer();

// 导出日志用于分析
const logs = logger.exportAsJSON();
console.log(logs);
```

---

## 📖 完整文档

- 详细的架构设计文档：[ARCHITECTURE_REFACTORING.md](./ARCHITECTURE_REFACTORING.md)
- 集成示例代码：[integration-guide.js](./integration-guide.js)
- AppState API: 参考源代码中的JSDoc注释
- EventBus API: 参考源代码中的JSDoc注释
- Logger API: 参考源代码中的JSDoc注释

---

## ✅ 下一步

现在核心模块已经完成，接下来的步骤是：

1. **创建控制器层** - 为各个功能模块（滚动、过滤、计时器等）创建控制器
2. **重构现有模块** - 逐步迁移现有的filters.js、scrolls.js等到新架构
3. **创建UI渲染层** - 将UI更新与业务逻辑分离
4. **测试和验证** - 确保所有功能工作正常

每个步骤都将使用这些核心模块来实现更干净、更可维护的代码。

