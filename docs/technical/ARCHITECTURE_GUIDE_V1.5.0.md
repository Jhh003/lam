## LAM 重构项目 - 完整架构指南

### 项目概述

**LAM** 是一个现代化的、事件驱动的网页应用，使用清晰的分层架构。这份指南介绍完全重构后的架构设计和实现细节。

**版本:** 1.5.0+  
**完成日期:** 2024年  
**状态:** ✅ 架构重构完成

---

## 核心架构

### 4层分层架构

```
┌─────────────────────────────────────────┐
│         HTML/CSS (展现层)               │
│    • index.html                         │
│    • ranking.html                       │
│    • 样式文件 (*.css)                   │
└──────────────────┬──────────────────────┘
                   │
                   ▼ DOM事件
┌─────────────────────────────────────────┐
│         EventBus (事件驱动层)           │
│    • 发布-订阅事件系统                  │
│    • 优先级事件队列                      │
│    • 类型安全的事件处理                  │
└──────────────────┬──────────────────────┘
                   │
                   ▼ 事件驱动
┌─────────────────────────────────────────┐
│         Controllers (业务逻辑层)        │
│    • FilterController                   │
│    • ScrollController                   │
│    • SettingsController                 │
│    • TimerController                    │
│    • AnimationController                │
│    • RankingApiController               │
│    • UploadController                   │
│    • UIController                       │
└──────────────────┬──────────────────────┘
                   │
                   ▼ 状态操作
┌─────────────────────────────────────────┐
│         AppState (状态管理层)           │
│    • 中央状态存储                       │
│    • Getter/Setter API                  │
│    • 状态变化通知                       │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│         Data Layer (数据层)             │
│    • characters.js (罪人数据)           │
│    • config.js (配置)                   │
│    • localStorage (用户数据)            │
│    • JSON文件 (排行榜)                  │
└─────────────────────────────────────────┘
```

---

## 核心模块详解

### 1. AppState - 中央状态管理

**文件:** `js/core/appState.js`
**行数:** ~620
**职责:** 管理应用的所有状态，提供原子化的读写操作

**API:**

```javascript
const appState = new AppState();

// 获取状态
const value = appState.get('path.to.state', defaultValue);

// 设置状态
appState.set('path.to.state', value);

// 获取全部状态
const allState = appState.getState();

// 监听状态变化（通过EventBus）
eventBus.subscribe('STATE_CHANGED', (data) => {
    console.log('状态已更改:', data.path, data.newValue);
});
```

**状态树结构:**

```javascript
{
    // 筛选状态
    filters: {
        sinners: Set,           // 选中的罪人ID
        personalities: Map      // 选中的人格 {sinnerId -> {personaIndex -> bool}}
    },
    
    // 游戏状态
    game: {
        selectedSinner: Object,     // 当前选中的罪人
        selectedPersona: Object,    // 当前选中的人格
        isScrolling: Boolean        // 是否正在滚动
    },
    
    // 计时器状态
    timer: {
        elapsedSeconds: Number,     // 已用时间
        isRunning: Boolean,         // 是否运行中
        lastUpdateTime: Number      // 最后更新时间戳
    },
    
    // 应用状态
    app: {
        hasUnsavedChanges: Boolean,
        isInitialized: Boolean,
        filteredSinnerData: Array   // 当前筛选的罪人列表
    }
}
```

**设计优点:**
- ✅ 单一真理来源（SSOT）
- ✅ 可预测的状态变化
- ✅ 易于调试和追踪
- ✅ 零全局变量污染

---

### 2. EventBus - 事件系统

**文件:** `js/core/eventBus.js`
**行数:** ~570
**职责:** 实现发布-订阅模式，支持优先级队列

**API:**

```javascript
const eventBus = new EventBus();

// 订阅事件
const unsubscribe = eventBus.subscribe('EVENT_NAME', (data) => {
    console.log('事件数据:', data);
}, { priority: 10 }); // 优先级越高越先执行

// 发送事件
eventBus.emit('EVENT_NAME', { /* 数据 */ });

// 一次性订阅
eventBus.once('EVENT_NAME', handler);

// 取消订阅
unsubscribe();

// 监听所有事件（调试）
eventBus.subscribe('*', (eventName, data) => {
    console.log('事件:', eventName, data);
});
```

**优先级系统:**

```javascript
// 高优先级订阅 - 最先执行
eventBus.subscribe('DATA_UPDATE', handler, { priority: 100 });

// 普通优先级 - 默认
eventBus.subscribe('DATA_UPDATE', handler);

// 低优先级 - 最后执行
eventBus.subscribe('DATA_UPDATE', handler, { priority: 1 });
```

**核心事件列表:**

```
应用事件:
  'APP_READY'              - 应用启动完成
  'APP_ERROR'              - 应用错误

游戏事件:
  'SINNER_SELECTED'        - { sinner, filteredPersonas }
  'PERSONA_SELECTED'       - { sinner, persona }
  'EASTER_EGG_DETECTED'    - { sinner, persona }

滚动事件:
  'SCROLLING_STARTED'      - { type: 'sinner'|'persona' }
  'SCROLLING_STOPPED'      - { type: 'sinner'|'persona', selected }

计时器事件:
  'TIMER_STARTED'          - {}
  'TIMER_PAUSED'           - {}
  'TIMER_RESET'            - {}
  'TIMER_UPDATED'          - { elapsedSeconds }

筛选事件:
  'FILTERS_CHANGED'        - { sinners, personalities }
  'FILTERS_APPLIED'        - {}

排行榜事件:
  'RANKING_SAVED_LOCAL'    - { sinner, persona, time }
  'RANKING_UPLOADED'       - { issueUrl }

UI事件:
  'UI_LOADING_START'       - { message }
  'UI_LOADING_END'         - {}
  'UI_ERROR'               - { message }
  'UI_NOTIFICATION'        - { message, type }
```

---

### 3. Logger - 日志系统

**文件:** `js/core/logger.js`
**行数:** ~350
**职责:** 结构化日志记录和调试支持

**API:**

```javascript
const logger = new Logger();

// 基础日志方法
logger.debug('消息', data);     // 调试信息
logger.info('消息', data);      // 普通信息
logger.warn('消息', data);      // 警告信息
logger.error('消息', data);     // 错误信息

// 查看日志
logger.showLog();                // 在控制台显示所有日志

// 获取日志
const logs = logger.getLogs();   // 返回日志数组
const recent = logger.getRecent(10); // 获取最近10条
```

**日志级别:**

```javascript
LEVEL.DEBUG = 1    // 调试信息
LEVEL.INFO  = 2    // 普通信息
LEVEL.WARN  = 3    // 警告
LEVEL.ERROR = 4    // 错误
```

---

## Controllers - 业务逻辑

### 4. FilterController

**文件:** `js/controllers/filterController.js`
**行数:** ~280
**职责:** 管理罪人和人格的筛选逻辑

**主要方法:**

```javascript
class FilterController {
    // 初始化
    initDOM(domElements)
    
    // 创建UI
    createSinnerFilter()
    
    // 应用筛选
    applyFilters()
    
    // 筛选操作
    toggleSinner(sinnerId, enabled)
    togglePersonality(sinnerId, personaIndex, enabled)
    toggleAllSinners(enabled)
    toggleAllPersonalities(sinnerId, enabled)
    invertSelection(type)
}
```

**事件:**

```javascript
// 订阅
'FILTERS_APPLIED'  // 筛选已应用

// 发送
eventBus.emit('FILTERS_APPLIED', {
    sinners: Set,
    personalities: Map
});
```

---

### 5. ScrollController

**文件:** `js/controllers/scrollController.js`
**行数:** ~780
**职责:** 管理罪人和人格的滚动动画和选择

**主要方法:**

```javascript
class ScrollController {
    // DOM初始化
    initDOM(domElements)
    
    // 创建滚动列表
    createSinnerScrollList(sinnerList)
    createPersonaScrollList(personaList)
    
    // 滚动控制
    startSinnerScroll()
    stopSinnerScroll()
    startPersonaScroll()
    stopPersonaScroll()
    
    // 内部方法（保护）
    highlightSelectedItem(element)  // ✨ 关键修复：无闪烁
    updateScrollLists(sinnerList)
}
```

**关键修复 - highlightSelectedItem:**

这个方法在重构过程中得到了保护和改进：

```javascript
/**
 * 高亮显示列表中选定的项
 * 重要：处理边界情况（单项列表）防止闪烁
 */
highlightSelectedItem(element) {
    if (!element) return;
    
    const items = element.querySelectorAll('.scroll-item');
    if (items.length === 0) return;
    
    // 移除所有高亮
    items.forEach(item => item.classList.remove('highlighted'));
    
    // 为中心项高亮（防止单项闪烁）
    const centerIndex = Math.floor(items.length / 2);
    const centerItem = items[centerIndex];
    
    if (centerItem) {
        centerItem.classList.add('highlighted');
        // 可选：平滑滚动到视图
        centerItem.scrollIntoView({ block: 'nearest' });
    }
}
```

---

### 6. SettingsController

**文件:** `js/controllers/settingsController.js`
**行数:** ~580
**职责:** 管理用户设置和人格配置

**主要方法:**

```javascript
class SettingsController {
    // 初始化
    initDOM(domElements)
    
    // 创建设置UI
    createPersonalitySettings()
    
    // 设置操作
    togglePersonalityCheckbox(sinnerId, personaIndex)
    selectAllPersonalities(sinnerId)
    deselectAllPersonalities(sinnerId)
    invertPersonalities(sinnerId)
}
```

---

### 7. TimerController

**文件:** `js/controllers/timerController.js`
**行数:** ~130
**职责:** 管理计时器逻辑和时间显示

**主要方法:**

```javascript
class TimerController {
    initDOM(domElements)
    
    // 计时器控制
    startTimer()
    pauseTimer()
    resetTimer()
    
    // 工具方法
    formatTime(seconds)           // 格式化时间为 HH:MM:SS
    getElapsedSeconds()           // 获取已用秒数
    getTotalMilliseconds()        // 获取总毫秒数
}
```

**事件:**

```javascript
'TIMER_STARTED'   // 计时器启动
'TIMER_PAUSED'    // 计时器暂停
'TIMER_RESET'     // 计时器重置
'TIMER_UPDATED'   // 时间更新 { elapsedSeconds }
```

---

### 8. AnimationController

**文件:** `js/controllers/animationController.js`
**行数:** ~100
**职责:** 管理倒计时动画和视觉效果

**主要方法:**

```javascript
class AnimationController {
    initDOM(domElements)
    
    // 倒计时
    initCountdown(targetDate)
    updateCountdown()
    createAnimatedText(text)
}
```

---

### 9. RankingApiController

**文件:** `js/controllers/rankingApiController.js`
**行数:** ~150
**职责:** 管理本地排行榜API

**主要方法:**

```javascript
class RankingApiController {
    // 本地排行榜
    saveToLocalRanking(sinner, persona, time, note)
    getLocalRecords(type = 'time')  // 获取排序后的记录
    deleteLocalRecord(index)
    
    // 工具
    viewRanking()                   // 打开排行榜页面
    getCurrentTime()                // 获取当前时间字符串
    isValidUrl(url)                 // 验证URL格式
}
```

**localStorage结构:**

```javascript
// 本地排行榜
{
    "local_ranking": [
        {
            timestamp: "2024-01-01 12:34:56",
            sinner: "Don_Quixote",
            persona: "Peccatia",
            time: 7234,
            ego: "Level3",
            note: "通关了！"
        },
        // ... 更多记录
    ]
}
```

---

### 10. UploadController

**文件:** `js/controllers/uploadController.js`
**行数:** ~280
**职责:** 管理全球排行榜上传逻辑

**主要方法:**

```javascript
class UploadController {
    // 上传流程
    uploadToGlobalRanking()
    showUploadModal()
    submitFullRecord(data)
    submitFloorOnlyRecord(data)
    
    // 工具方法
    validateFormData(data)
    generateGithubIssueUrl(formData)
    getSubmissionBody(formData)     // 生成GitHub Issue body
}
```

**事件:**

```javascript
'RANKING_UPLOADED'  // { issueUrl }
```

---

### 11. UIController

**文件:** `js/controllers/uiController.js`
**行数:** ~400
**职责:** 管理视图更新和用户反馈

**主要方法:**

```javascript
class UIController {
    // 初始化
    initDOM(domElements)
    
    // 显示更新
    updateSelectedSinner(sinner)
    updateSelectedPersona(persona)
    updateImageElement(element, imagePath, fallbackText, bgColor)
    updateTimerDisplay(seconds)
    updateStats(sinnerCount, personaCount)
    
    // 按钮状态
    updateScrollButtonStates(isScrolling)
    updateTimerButtonStates(state)
    setButtonState(selector, disabled)
    
    // 用户反馈
    showNotification(message, type, duration)
    showLoading(message)
    hideLoading()
    showError(message, duration)
    
    // 导航
    switchPage(pageName)
}
```

---

## 数据流

### 典型的用户交互流程

```
用户点击按钮
    ↓
HTML事件监听器触发
    ↓
Controller.method() 调用
    ↓
AppState.set() 修改状态
    ↓
EventBus.emit() 发送事件
    ↓
订阅者收到事件
    ├─ UIController 更新视图
    ├─ Logger 记录日志
    └─ 其他Controller 做出响应
    ↓
用户看到UI更新
```

### 例：选择罪人的完整流程

```javascript
// 1. 用户点击滚动"停止"按钮
document.getElementById('sinner-stop-btn').click();

// 2. ScrollController 处理停止事件
const selectedSinner = /* 获取当前选中的罪人 */;

// 3. 更新应用状态
appState.set('game.selectedSinner', selectedSinner);

// 4. 发送事件
eventBus.emit('SINNER_SELECTED', {
    sinner: selectedSinner,
    filteredPersonas: /* 该罪人的人格列表 */
});

// 5. 多个订阅者响应
// ScrollController 更新人格列表
scrollController.createPersonaScrollList(filteredPersonas);

// UIController 更新罪人显示
uiController.updateSelectedSinner(selectedSinner);

// Logger 记录这次操作
logger.debug('罪人已选择', { sinner: selectedSinner.name });

// 6. 用户看到：
//    - 罪人头像和名称显示
//    - 人格列表更新
//    - 人格可以开始滚动
```

---

## 兼容层

为了平滑过渡，保留了兼容层文件：

### 兼容层文件

| 文件 | 说明 |
|------|------|
| `filters-compat.js` | FilterController 兼容层 |
| `scrolls-compat.js` | ScrollController 兼容层 |
| `settings-compat.js` | SettingsController 兼容层 |
| `common-compat.js` | 所有常用函数兼容层 |
| `ui-compat.js` | UIController 兼容层 |
| `main-compat.js` | main.js 兼容层 |

### 兼容层使用

```html
<!-- 在index.html中 -->
<script type="module">
    import { initCommonCompat } from './js/common-compat.js';
    import { initMainCompat } from './js/main-compat.js';
    import { initUICompat } from './js/ui-compat.js';
    
    // 初始化兼容层
    window.addEventListener('DOMContentLoaded', () => {
        initCommonCompat();
        initMainCompat();
        initUICompat();
    });
</script>
```

---

## 配置文件

### characters.js

```javascript
export const sinnerData = [
    {
        id: 'don_quixote',
        name: '唐吉诃德',
        avatar: './assets/images/Don_Quixote/avatar.jpg',
        color: '#FF6B6B',
        personalities: [
            { name: 'Peccatia', avatar: './assets/images/Don_Quixote/Peccatia.jpg' },
            { name: 'Superbia', avatar: './assets/images/Don_Quixote/Superbia.jpg' },
            // ...
        ]
    },
    // ... 更多罪人
]
```

### config.js

```javascript
export const Config = {
    // 滚动配置
    SCROLL_SPEED: 200,              // ms/item
    SCROLL_ANIMATION_DURATION: 500, // ms
    
    // 计时器配置
    TIMER_UPDATE_INTERVAL: 1000,    // ms
    
    // 上传配置
    GITHUB_REPO_OWNER: 'Jhh003',
    GITHUB_REPO_NAME: 'lam',
    MIN_UPLOAD_TIME: 7200,          // 秒 (2小时)
    
    // 动画配置
    ANIMATION_DURATION: 300,        // ms
}
```

---

## localStorage 存储结构

```javascript
{
    // 筛选设置
    'filter_sinners': '[罪人ID列表JSON]',
    'filter_personalities': '[人格设置JSON]',
    
    // 本地排行榜
    'local_ranking': '[排行记录JSON]',
    'local_floor_ranking': '[层数记录JSON]',
    
    // 用户设置
    'user_preferences': '[用户偏好JSON]',
    
    // 计时器状态
    'timer_state': '[计时器状态JSON]'
}
```

---

## 部署指南

### 文件结构

确保部署时包含以下文件：

```
index.html
ranking.html
package.json

css/
  *.css

js/
  *.js
  controllers/
    *.js
  core/
    *.js

data/
  *.js
  utils/
    *.js

assets/
  images/
    */
  videos/
```

### GitHub Pages 部署

1. 推送代码到GitHub仓库
2. 在仓库设置中启用GitHub Pages
3. 选择 `main` 分支和 `/ (root)` 目录
4. 应用自动部署到 `https://username.github.io/lam`

### 验证部署

```javascript
// 在浏览器控制台检查
console.log(window.appState)      // 应该存在
console.log(window.eventBus)      // 应该存在
console.log(window.controllers)   // 应该存在
```

---

## 测试和调试

### 开发工具

```javascript
// 查看完整的应用状态
window.debugAppStateCompat();

// 查看事件日志
window.debugEventsCompat();

// 手动发送事件（测试）
window.eventBus.emit('SINNER_SELECTED', { 
    sinner: { id: 1, name: '测试' } 
});

// 访问特定状态
window.appState.get('game.selectedSinner');
window.appState.getState();  // 完整状态树
```

### 常见问题排查

| 症状 | 可能原因 | 解决方案 |
|------|--------|--------|
| 页面加载后无反应 | 脚本加载失败 | 检查Network标签，查看JS文件是否加载 |
| 罪人列表为空 | characters.js未加载 | 检查data/characters.js文件 |
| 计时器不工作 | TimerController未初始化 | 检查浏览器Console |
| localStorage报错 | 隐私浏览模式 | 使用普通浏览模式 |
| 样式不显示 | CSS文件未加载 | 检查css目录和link标签 |

---

## 性能优化

### 已实施的优化

1. **模块化** - 小型focused controllers
2. **事件驱动** - 减少不必要的DOM更新
3. **状态集中** - 避免状态重复
4. **延迟初始化** - 按需加载资源

### 进一步优化建议

1. **代码分割** - 将Controllers按需加载
2. **图像优化** - 使用WebP格式和懒加载
3. **缓存策略** - Service Worker支持离线
4. **预加载** - 预加载常用资源

---

## 安全性考虑

1. **输入验证** - 所有用户输入都经过验证
2. **XSS防护** - 避免innerHTML直接设置用户数据
3. **CSRF防护** - GitHub API使用OAuth令牌
4. **数据隐私** - 敏感数据不保存到localStorage

---

## 版本历史

| 版本 | 日期 | 重点 |
|------|------|------|
| 1.5.0+ | 2024年 | ✨ 完整架构重构 |
| 1.5.0 | 2024年 | 🎯 功能完整 |
| 1.4.0 | - | 排行榜系统 |
| 1.3.0 | - | 全球排行榜 |
| 1.2.0 | - | 本地计时器 |
| 1.0.0 | - | 初始版本 |

---

## 贡献指南

### 添加新功能

1. 创建新Controller（如果需要）
2. 定义新事件
3. 实现在AppState中的数据结构
4. 更新UIController以反应新状态
5. 编写测试
6. 更新文档

### 修复Bug

1. 编写重现的测试用例
2. 在相应的Controller中修复
3. 验证修复不破坏其他功能
4. 提交Pull Request

---

## 资源和参考

- [事件驱动架构](https://en.wikipedia.org/wiki/Event-driven_architecture)
- [发布-订阅模式](https://refactoring.guru/design-patterns/observer)
- [中央状态管理](https://redux.js.org/)
- [MVC架构](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)

---

## FAQ

**Q: 为什么使用事件驱动架构？**  
A: 它提供了松耦合、可扩展和可维护的代码结构。

**Q: AppState可以不用吗？**  
A: 不建议。AppState是单一真理来源，直接修改DOM会导致状态不一致。

**Q: Controllers之间如何通信？**  
A: 通过EventBus发送事件，而不是直接调用。

**Q: 可以添加新的事件类型吗？**  
A: 可以。在相应的Controller中定义并emit事件。

**Q: 兼容层可以永久保留吗？**  
A: 可以，但建议逐步迁移到新的API。

---

**最后更新:** 2024年  
**维护者:** GitHub Copilot  
**许可证:** MIT  
