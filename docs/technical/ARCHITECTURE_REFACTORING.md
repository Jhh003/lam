# LAM项目架构重构设计文档

## 📋 目标概述

**目标**: 完全重构LAM项目的底层代码架构，改进代码质量、可维护性和可扩展性，同时保持所有用户可见的功能完全相同。

**约束条件**:
- ✅ 所有用户功能必须保持不变
- ✅ 最近修复的highlightSelectedItem逻辑必须保护
- ✅ 不能破坏现有的localStorage数据格式（若无必要）
- ✅ 支持增量迁移（不需要一次性全部替换）

---

## 🏗️ 新架构设计

### 核心原则

1. **中央状态管理** - 所有应用状态集中在AppState
2. **事件驱动** - 模块通过事件总线通信，而非直接函数调用
3. **关注点分离** - 业务逻辑与UI层分离
4. **模块化设计** - 每个模块只负责一个功能域
5. **依赖注入** - 通过参数传递依赖，而非全局变量

### 模块分层架构

```
┌─────────────────────────────────────────────────────┐
│                  UI Layer (展现层)                   │
│  UIRenderer, ModalManager, TimerDisplay, etc       │
└─────────────────────────────────────────────────────┘
                          ▲
                          │ 事件驱动
                          ▼
┌─────────────────────────────────────────────────────┐
│              Business Logic Layer (业务层)            │
│  GameController, ScrollManager, FilterManager,      │
│  SettingsManager, TimerController, RankingManager   │
└─────────────────────────────────────────────────────┘
                          ▲
                          │ EventBus (发布-订阅)
                          ▼
┌─────────────────────────────────────────────────────┐
│            State Management Layer (状态层)           │
│  AppState, EventBus, Logger, Cache                 │
└─────────────────────────────────────────────────────┘
                          ▲
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│             Data Layer (数据层)                      │
│  characters.js, personaManager.js, helpers.js       │
└─────────────────────────────────────────────────────┘
```

### 状态管理（AppState）

```javascript
// 应用全局状态结构
{
  app: {
    currentPage: 'main' | 'ranking' | 'settings',
    hasUnsavedChanges: boolean,
    isInitialized: boolean
  },
  game: {
    selectedSinner: Sinner | null,
    selectedPersona: Persona | null,
    isScrolling: boolean,
    easterEggTriggered: boolean | null
  },
  filters: {
    sinner: Set<number>,          // 选中的罪人ID集合
    persona: Map<number, Set<number>> // 罪人ID -> 人格索引集合
  },
  settings: {
    personality: Map<number, Set<number>>, // 人格偏好设置
    theme: string,
    language: string
  },
  timer: {
    isRunning: boolean,
    elapsedSeconds: number,
    startTime: number | null,
    pausedTime: number | null
  },
  ranking: {
    localRecords: Record[],
    globalRecords: Record[],
    lastUpdateTime: number | null
  }
}
```

### 事件流定义

```javascript
// 应用事件类型常量
const GameEvents = {
  // 应用生命周期
  APP_INITIALIZED: 'app:initialized',
  PAGE_CHANGED: 'app:page-changed',
  
  // 滚动系统
  SCROLL_START: 'scroll:start',
  SCROLL_STOP: 'scroll:stop',
  SINNER_SELECTED: 'sinner:selected',
  PERSONA_SELECTED: 'persona:selected',
  
  // 过滤器
  FILTER_CHANGED: 'filter:changed',
  SINNER_FILTER_CHANGED: 'filter:sinner-changed',
  PERSONA_FILTER_CHANGED: 'filter:persona-changed',
  
  // 设置
  SETTINGS_CHANGED: 'settings:changed',
  PERSONALITY_TOGGLED: 'settings:personality-toggled',
  
  // 计时器
  TIMER_START: 'timer:start',
  TIMER_STOP: 'timer:stop',
  TIMER_TICK: 'timer:tick',
  TIMER_RESET: 'timer:reset',
  
  // 排行榜
  RANKING_LOADED: 'ranking:loaded',
  RANKING_UPDATED: 'ranking:updated',
  RECORD_SUBMITTED: 'ranking:record-submitted',
  
  // 彩蛋
  EASTER_EGG_TRIGGERED: 'game:easter-egg-triggered',
  VIDEO_PLAY: 'media:video-play'
};
```

---

## 📁 新文件结构

### 新增的核心文件

```
js/
├── core/
│   ├── appState.js           // 🆕 中央状态管理
│   ├── eventBus.js           // 🆕 事件系统
│   └── logger.js             // 🆕 日志系统
├── controllers/
│   ├── gameController.js     // 🆕 游戏主控制器
│   ├── scrollController.js   // 🆕 滚动控制器
│   ├── filterController.js   // 🆕 过滤控制器
│   ├── settingsController.js // 🆕 设置控制器
│   ├── timerController.js    // 🆕 计时器控制器
│   └── rankingController.js  // 🆕 排行榜控制器
├── ui/
│   ├── uiRenderer.js         // 🆕 UI渲染管理器
│   ├── modalManager.js       // 🆕 模态框管理
│   ├── timerDisplay.js       // 🆕 计时器显示
│   └── scrollRenderer.js     // 🆕 滚动列表渲染
├── main.js                   // 📝 简化的应用启动
├── common.js                 // 📝 逐步迁移旧功能
├── filters.js                // 📝 逐步迁移
├── scrolls.js                // 📝 保护highlightSelectedItem
├── settings.js               // 📝 逐步迁移
├── ui.js                     // 📝 逐步迁移
└── modal.js                  // 📝 逐步迁移
```

### 修改的文件

- `main.js` - 精简为应用初始化入口
- `common.js` - 拆分为多个模块
- `filters.js` - 改用AppState和EventBus
- `scrolls.js` - 保护highlightSelectedItem逻辑，改进依赖注入
- `settings.js` - 改用AppState和EventBus
- `ui.js` - 改为UI工具函数集合
- `modal.js` - 保持现有API

---

## 🔄 重构流程

### 第1阶段：基础设施 (核心模块)

**任务**:
1. 创建 `js/core/appState.js` - 中央状态管理
2. 创建 `js/core/eventBus.js` - 事件系统
3. 创建 `js/core/logger.js` - 日志系统

**成功标志**:
- [ ] AppState可以存储和获取应用状态
- [ ] EventBus可以订阅和发布事件
- [ ] Logger可以输出调试信息

---

### 第2阶段：控制器层

**任务**:
1. 创建各个控制器（gameController, scrollController等）
2. 每个控制器负责一个功能域的业务逻辑
3. 控制器通过AppState管理状态，通过EventBus通信

**成功标志**:
- [ ] ScrollController可以管理滚动列表
- [ ] FilterController可以管理过滤逻辑
- [ ] TimerController可以管理计时器

---

### 第3阶段：UI层重构

**任务**:
1. 创建UIRenderer管理所有UI更新
2. 分离UI逻辑和业务逻辑
3. UI只负责显示，通过事件通知业务层用户交互

**成功标志**:
- [ ] UI更新驱动于事件
- [ ] UI与业务逻辑完全分离
- [ ] 支持多种UI框架集成

---

### 第4阶段：迁移现有模块

**任务**:
1. 逐个迁移现有模块到新架构
2. 保护已修复的bug（highlightSelectedItem）
3. 逐步过渡，保证功能持续可用

**步骤顺序**:
1. `filters.js` → `FilterController` + `AppState`
2. `settings.js` → `SettingsController` + `AppState`
3. `scrolls.js` → `ScrollController` (保护highlightSelectedItem)
4. `common.js` → 拆分为多个控制器
5. 最后: `main.js` → 统一的应用启动

---

## 🛡️ 保护现有功能

### highlightSelectedItem 高亮显示逻辑

**当前实现** (已修复):
```javascript
function highlightSelectedItem(scrollContainer, selectedIndex, scrollOffset = null, itemsLength = null) {
    clearHighlight(scrollContainer);
    const items = scrollContainer.querySelectorAll('.scroll-item');
    
    if (!items.length || itemsLength === null || itemsLength === 0) return;
    
    // 简化逻辑：直接匹配originalIndex
    items.forEach(item => {
        const itemOriginalIndex = parseInt(item.dataset.originalIndex) || 0;
        if (itemOriginalIndex === selectedIndex) {
            item.classList.add('selected');
        }
    });
}
```

**保护策略**:
- ✅ 在ScrollController中保留原函数
- ✅ 通过单元测试验证功能不变
- ✅ 支持1个罪人和12个罪人的所有场景

---

## 📊 数据流示例

### 用户选择罪人的流程

```
1. 用户点击开始滚动按钮
   ↓
2. UI.handleStartScroll() 事件监听器触发
   ↓
3. ScrollController.startScroll() 被调用
   ↓
4. ScrollController 发出 SCROLL_START 事件
   ↓
5. ScrollRenderer 监听事件，开始动画
   ↓
6. 用户点击停止按钮
   ↓
7. ScrollController.stopScroll() 被调用
   ↓
8. 计算选中的罪人
   ↓
9. AppState.setSelectedSinner(sinner)
   ↓
10. AppState 发出 SINNER_SELECTED 事件
    ↓
11. ScrollRenderer 监听事件，高亮显示
    ↓
12. UIRenderer 监听事件，更新显示文本
    ↓
13. PersonaController 监听事件，准备人格列表
    ↓
14. 完成！
```

---

## 🧪 测试策略

### 单元测试

```
core/
├── appState.test.js      - 状态管理测试
├── eventBus.test.js      - 事件系统测试
└── logger.test.js        - 日志系统测试

controllers/
├── scrollController.test.js     - 滚动控制测试
├── filterController.test.js     - 过滤控制测试
└── timerController.test.js      - 计时器控制测试
```

### 集成测试

```
scenarios/
├── sinner-selection.test.js     - 罪人选择流程
├── persona-selection.test.js    - 人格选择流程
├── timer-functionality.test.js  - 计时器功能
└── ranking-submission.test.js   - 排行榜提交
```

### 回归测试

```
regression/
├── highlight-with-1-sinner.test.js   - 保护修复的高亮bug
├── highlight-with-12-sinners.test.js - 完整状态测试
├── filter-combinations.test.js       - 过滤器组合测试
└── timer-accuracy.test.js            - 计时器准确性
```

---

## 📈 预期改进

### 代码质量指标

| 指标 | 当前 | 目标 | 改进 |
|------|------|------|------|
| 圈复杂度 | 高 | 低 | 模块分解 |
| 耦合度 | 高 | 低 | 事件驱动 |
| 代码重复 | 有 | 无 | 通用函数 |
| 可测试性 | 低 | 高 | 纯函数 |
| 文档完整度 | 50% | 100% | API文档 |

### 性能指标

| 指标 | 当前 | 优化 |
|------|------|------|
| 初始化时间 | ~200ms | ~150ms (延迟加载) |
| 内存占用 | ~5MB | ~4MB (更好的垃圾回收) |
| 事件响应 | ~50ms | ~20ms (优化的事件处理) |

---

## 🎯 关键决策

### 1. 为什么使用AppState而不是Redux?

**原因**:
- Redux过于复杂，LAM项目规模不需要
- AppState更轻量，更容易理解
- 可以逐步迁移，不需要全部重写
- 支持增量式的应用状态更新

### 2. 为什么使用事件总线而不是MVC?

**原因**:
- 事件总线支持多对多的通信
- 模块之间真正解耦
- 支持延迟加载和异步操作
- 容易添加中间件和插件

### 3. 为什么保护highlightSelectedItem?

**原因**:
- 这个函数包含最近修复的bug
- 已经过彻底测试
- 滚动系统的核心逻辑
- 重写可能引入新bug

### 4. 为什么增量迁移而不是全部重写?

**原因**:
- 降低风险
- 允许持续测试
- 更容易定位问题
- 可以随时回滚

---

## 📝 约定和规范

### 命名规范

- **EventBus方法**: `subscribe()`, `publish()`, `unsubscribe()`
- **Controller方法**: 动词+名词，如 `startScroll()`, `applyFilters()`
- **State getter**: `get前缀`，如 `getSelectedSinner()`
- **State setter**: `set前缀`，如 `setSelectedSinner()`
- **Event名称**: `domain:action`，如 `sinner:selected`

### 文件命名

- `*Controller.js` - 业务逻辑控制器
- `*Manager.js` - 资源/对象管理器
- `*Renderer.js` - UI渲染器
- `*Repository.js` - 数据访问层

### 注释规范

```javascript
/**
 * 功能描述 (中文)
 * 
 * @param {Type} paramName - 参数描述
 * @returns {Type} 返回值描述
 * @throws {Error} 异常情况
 * 
 * @example
 * // 使用示例
 * method(param)
 */
```

---

## 🚀 实施时间表

| 阶段 | 任务 | 预期时间 | 责任人 |
|------|------|---------|--------|
| 1 | 基础设施 (AppState, EventBus, Logger) | 2-3天 | AI |
| 2 | 控制器层 (各功能控制器) | 3-4天 | AI |
| 3 | UI层重构 | 2-3天 | AI |
| 4 | 现有模块迁移 | 3-4天 | AI |
| 5 | 测试和验证 | 2-3天 | AI/User |
| 总计 | | 12-17天 | |

---

## 📖 参考资源

- Redux官方文档: https://redux.js.org/
- Node.js EventEmitter: https://nodejs.org/api/events.html
- React-Window虚拟滚动: https://react-window.now.sh/
- JavaScript模块模式: https://www.patterns.dev/posts/module-pattern/

---

## ✅ 验收标准

1. **功能完整性**
   - [ ] 所有用户功能保持不变
   - [ ] highlightSelectedItem bug不回归
   - [ ] 所有UI交互正常工作

2. **代码质量**
   - [ ] 没有全局变量污染
   - [ ] 模块独立可测试
   - [ ] 代码注释完整

3. **性能指标**
   - [ ] 初始化时间 < 200ms
   - [ ] 事件响应 < 50ms
   - [ ] 内存占用 < 10MB

4. **文档完整**
   - [ ] API文档完整
   - [ ] 架构文档清晰
   - [ ] 集成指南可用

