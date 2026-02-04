## ScrollController迁移指南

### 概述

本指南说明如何从旧的 `scrolls.js` 模块迁移到新的 `ScrollController` 架构。这是重构项目的关键一步，涉及滚动和选择系统的核心逻辑。

### 关键变化

#### 旧架构问题
- ❌ 全局变量污染：`window.isSinnerScrolling`、`window.isPersonaScrolling`
- ❌ 直接DOM操作：散乱在各处
- ❌ 耦合严重：与其他模块直接调用
- ❌ 状态管理混乱：多个数据源

#### 新架构优势
- ✅ 中央状态管理：AppState为单一数据源
- ✅ 事件驱动：通过EventBus与其他模块通信
- ✅ 类封装：清晰的接口和职责
- ✅ 零全局变量：完全消除window污染
- ✅ **关键保护**：highlightSelectedItem函数已验证通过，保持原样

### 关键保护项

#### highlightSelectedItem 函数
```javascript
/**
 * 【受保护】此函数已修复并验证通过
 * - 支持1个罪人的边界情况
 * - 支持12个罪人的完整场景
 * - 使用dataset.originalIndex直接匹配
 * - 不能修改！
 */
highlightSelectedItem(scrollContainer, selectedIndex) {
    const items = scrollContainer.querySelectorAll('.scroll-item');
    items.forEach(item => {
        const itemOriginalIndex = parseInt(item.dataset.originalIndex) || 0;
        if (itemOriginalIndex === selectedIndex) {
            item.classList.add('selected');
        }
    });
}
```

### 分阶段迁移计划

#### 第一阶段：兼容层（已完成）
- ✅ 创建ScrollController（新架构）
- ✅ 创建scrolls-compat.js（向后兼容层）
- ✅ 保持现有scrolls.js不变（暂时）
- ✅ 允许新旧代码共存

#### 第二阶段：逐个迁移调用点（规划中）
需要在以下文件中进行迁移：
- main.js（主程序入口）
- common.js（如果有滚动相关代码）
- 其他需要创建滚动列表的地方

#### 第三阶段：删除旧代码（后续）
- 确认所有调用点已迁移
- 删除scrolls.js
- 删除scrolls-compat.js

### API映射表

| 旧API | 新API | 说明 |
|------|------|------|
| `initScrollModule(domElements, globalState)` | `scrollController.initDOM(domElements)` | 初始化DOM元素 |
| `createSinnerScrollList(items)` | `scrollController.createSinnerScrollList(items)` | 创建罪人列表 |
| `createPersonaScrollList(items)` | `scrollController.createPersonaScrollList(items)` | 创建人格列表 |
| `startSinnerScroll()` | `scrollController.startSinnerScroll()` | 开始罪人滚动 |
| `stopSinnerScroll()` | `scrollController.stopSinnerScroll()` | 停止罪人滚动 |
| `startPersonaScroll()` | `scrollController.startPersonaScroll()` | 开始人格滚动 |
| `stopPersonaScroll()` | `scrollController.stopPersonaScroll()` | 停止人格滚动 |
| `highlightSelectedItem()` | `scrollController.highlightSelectedItem()` | 高亮选中项 |

### 状态映射表

| 旧全局变量 | 新AppState路径 | 说明 |
|----------|--------------|------|
| `window.isSinnerScrolling` | `appState.get('game.isScrolling')` | 滚动状态 |
| `window.isPersonaScrolling` | `appState.get('game.isScrolling')` | 滚动状态 |
| `window.currentSelectedSinner` | `appState.get('game.selectedSinner')` | 选中的罪人 |
| `window.currentSelectedPersona` | `appState.get('game.selectedPersona')` | 选中的人格 |
| `window.sinnerScrollInterval` | 内部变量（不需要外部访问） | 罪人滚动定时器 |
| `window.personaScrollInterval` | 内部变量（不需要外部访问） | 人格滚动定时器 |

### 事件映射表

| 新事件 | 数据 | 说明 |
|------|------|------|
| `SINNER_SELECTED` | `{ sinner, isAutoSelected, itemsLength }` | 罪人被选中 |
| `PERSONA_SELECTED` | `{ persona, sinner, itemsLength }` | 人格被选中 |
| `SCROLL_START` | `{ type: 'sinner'\|'persona' }` | 滚动开始 |
| `RESULT_DISPLAY_UPDATE` | `{ selectedSinner, sinnerCount }` | 结果显示更新 |
| `CHECK_EASTER_EGG` | `{ sinner, persona }` | 检查彩蛋 |

### 迁移代码示例

#### 例1：初始化

**旧代码：**
```javascript
import Scrolls from './scrolls.js';

// 在某处初始化
Scrolls.initScrollModule(domElements, {
    sinnerItems: filteredSinners,
    itemHeight: 50
});

// 创建列表
Scrolls.createSinnerScrollList(filteredSinners);
```

**新代码：**
```javascript
import { ScrollController } from './controllers/scrollController.js';
import { appState, eventBus, logger } from './core/index.js';

// 在应用启动时初始化一次
const scrollController = new ScrollController(appState, eventBus, logger, modal);
scrollController.initDOM(domElements);

// 需要时调用
scrollController.createSinnerScrollList(filteredSinners);
```

#### 例2：处理选择事件

**旧代码：**
```javascript
// 直接访问全局变量
if (window.currentSelectedSinner && window.currentSelectedPersona) {
    const sinner = window.currentSelectedSinner;
    const persona = window.currentSelectedPersona;
    // 做某事...
}
```

**新代码：**
```javascript
// 通过事件系统
eventBus.subscribe('PERSONA_SELECTED', (data) => {
    const { sinner, persona, itemsLength } = data;
    // 做某事...
});

// 或直接从AppState查询
const sinner = appState.get('game.selectedSinner');
const persona = appState.get('game.selectedPersona');
```

#### 例3：检查滚动状态

**旧代码：**
```javascript
if (!window.isSinnerScrolling) {
    // 启动滚动
}
```

**新代码：**
```javascript
// 通过AppState
const isScrolling = appState.get('game.isScrolling');

// 或通过事件系统订阅
eventBus.subscribe('SCROLL_START', () => {
    // 滚动已开始
});
```

### 向后兼容层使用（过渡期）

如果你希望快速迁移但保持兼容，可以使用 `scrolls-compat.js`：

```javascript
import { initScrollCompat, getScrollController } from './scrolls-compat.js';

// 在初始化阶段
initScrollCompat(appState, eventBus, logger, modal);

// 之后所有旧调用继续工作
const scrollController = getScrollController();
scrollController.createSinnerScrollList(items);
```

### 测试检查表

迁移完成后，请验证以下场景：

#### 基础功能
- [ ] 1个罪人时，自动选中并显示高亮
- [ ] 12个罪人时，滚动正常且高亮正确
- [ ] 罪人选中后，人格列表正确更新
- [ ] 1个人格时，自动选中并显示高亮
- [ ] 多个人格时，滚动正常且高亮正确

#### 事件系统
- [ ] 罪人被选中时，`SINNER_SELECTED`事件正确触发
- [ ] 人格被选中时，`PERSONA_SELECTED`事件正确触发
- [ ] 滚动开始时，`SCROLL_START`事件正确触发
- [ ] 所有订阅者都收到正确的数据

#### 状态管理
- [ ] AppState中的`game.selectedSinner`正确更新
- [ ] AppState中的`game.selectedPersona`正确更新
- [ ] AppState中的`game.isScrolling`正确反映滚动状态
- [ ] 刷新页面后，状态从localStorage恢复正确

#### 边界情况
- [ ] 没有选择任何罪人时，提示用户
- [ ] 选定的罪人没有人格时，显示"请先选择罪人"
- [ ] 过滤时罪人列表更新，人格列表正确清空
- [ ] 快速连续点击启动按钮，不会重复启动滚动

### 常见问题

**Q: highlightSelectedItem函数是否需要修改？**
A: **不需要！** 这个函数已经过完整测试和验证，支持所有边界情况。新ScrollController中保持原样。

**Q: 旧代码中的 `window.filteredSinnerData` 怎么办？**
A: 在新架构中，应该用 `appState.get('filters.sinners')` 替代，它返回一个Set。如果需要数组形式，使用 `Array.from(appState.get('filters.sinners'))`。

**Q: 旧代码中的定时器ID变量还需要保存吗？**
A: 不需要！新ScrollController内部管理定时器，外部代码不需要访问它们。

**Q: 如何在新架构中检查彩蛋？**
A: ScrollController会在选中人格时自动触发 `CHECK_EASTER_EGG` 事件。你可以订阅这个事件来处理彩蛋逻辑：
```javascript
eventBus.subscribe('CHECK_EASTER_EGG', ({ sinner, persona }) => {
    // 检查并播放彩蛋视频
});
```

**Q: 过渡期间能否同时使用旧的scrolls.js和新的ScrollController？**
A: 可以，但要小心。使用scrolls-compat.js作为兼容层。建议尽快完全迁移以避免混淆。

### 迁移时间表

| 阶段 | 任务 | 预计时间 |
|------|------|--------|
| Phase 1 | ✅ ScrollController开发 | 已完成 |
| Phase 1 | ✅ scrolls-compat.js开发 | 已完成 |
| Phase 2 | ⏳ main.js中的调用迁移 | 1-2天 |
| Phase 2 | ⏳ 事件订阅者迁移 | 1-2天 |
| Phase 3 | ⏳ 完整功能测试 | 1天 |
| Phase 4 | ⏳ 删除旧代码 | 0.5天 |

### 后续相关任务

- Task 8: SettingsController（设置管理）
- Task 9: 拆分common.js（676行）
- Task 10: 简化main.js（入口点）
- Task 11: 重构UI层（ui.js, modal.js）
- Task 12: 完整测试
- Task 13: 文档完善

### 更多资源

- [AppState文档](../core/appState.js)
- [EventBus文档](../core/eventBus.js)
- [Logger文档](../core/logger.js)
- [FilterController迁移指南](./FILTERS_MIGRATION_GUIDE.md)

---

**最后修改：** 2024年
**状态：** 已完成（ScrollController + 兼容层）
**下一步：** 更新main.js以使用新架构
