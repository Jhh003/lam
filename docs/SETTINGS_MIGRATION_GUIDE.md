## SettingsController迁移指南

### 概述

本指南说明如何从旧的 `settings.js` 模块迁移到新的 `SettingsController` 架构。该模块负责人格过滤设置的管理。

### 关键变化

#### 旧架构问题
- ❌ 全局变量污染：`window.filteredPersonalityData`
- ❌ 直接DOM操作：scattered throughout functions
- ❌ 耦合严重：与FilterController的window变量交互
- ❌ 事件处理混乱：直接操作checkbox而非事件驱动

#### 新架构优势
- ✅ 中央状态管理：AppState为单一数据源
- ✅ 事件驱动：通过EventBus与其他模块通信
- ✅ 类封装：清晰的接口和职责
- ✅ 零全局变量：完全消除window污染
- ✅ 更好的验证：内置设置验证方法

### 分阶段迁移计划

#### 第一阶段：兼容层（已完成）
- ✅ 创建SettingsController（新架构）
- ✅ 创建settings-compat.js（向后兼容层）
- ✅ 保持现有settings.js不变（暂时）
- ✅ 允许新旧代码共存

#### 第二阶段：逐个迁移调用点（规划中）
需要在以下文件中进行迁移：
- main.js（主程序入口）
- 其他需要人格设置的地方

#### 第三阶段：删除旧代码（后续）
- 确认所有调用点已迁移
- 删除settings.js
- 删除settings-compat.js

### API映射表

| 旧API | 新API | 说明 |
|------|------|------|
| `initDOM(domElements, globalState)` | `settingsController.initDOM(domElements)` | 初始化DOM元素 |
| `updatePersonalityFilter(event)` | `settingsController.updatePersonalityFilter(sinnerId, personaIndex, isChecked)` | 更新人格过滤 |
| `toggleAllPersonalities(selectAll)` | `settingsController.selectAllPersonalities()` / `deselectAllPersonalities()` | 全选/全不选 |
| `invertAllPersonalities()` | `settingsController.invertAllPersonalities()` | 反选所有 |
| `toggleSinnerPersonalities(sinnerId, selectAll)` | `settingsController.selectSinnerPersonalities()` / `deselectSinnerPersonalities()` | 特定罪人操作 |
| `invertSinnerPersonalities(sinnerId)` | `settingsController.invertSinnerPersonalities(sinnerId)` | 特定罪人反选 |
| `createPersonalitySettings()` | `settingsController.createPersonalitySettings()` | 创建设置UI |

### 状态映射表

| 旧全局变量 | 新AppState路径 | 说明 |
|----------|--------------|------|
| `window.filteredPersonalityData` | `appState.get('filters.personalities')` | 人格过滤状态Map |
| `window.hasUnsavedChanges` | `appState.get('app.hasUnsavedChanges')` | 是否有未保存的更改 |

### 事件映射表

| 新事件 | 数据 | 说明 |
|------|------|------|
| `PERSONALITY_FILTER_CHANGED` | `{ sinnerId, personaIndex, isChecked }` | 单个人格过滤已更改 |
| `PERSONALITIES_SELECTED_ALL` | `{ count }` | 全选所有人格 |
| `PERSONALITIES_DESELECTED_ALL` | `{}` | 取消所有人格 |
| `PERSONALITIES_INVERTED` | `{}` | 反选所有人格 |
| `SINNER_PERSONALITIES_SELECTED` | `{ sinnerId, count }` | 特定罪人全选 |
| `SINNER_PERSONALITIES_DESELECTED` | `{ sinnerId, count }` | 特定罪人取消 |
| `SINNER_PERSONALITIES_INVERTED` | `{ sinnerId, count }` | 特定罪人反选 |

### 数据结构

#### 旧结构
```javascript
// 旧全局变量
window.filteredPersonalityData = {
    1: {     // 罪人ID
        0: true,   // 人格索引 => 是否启用
        1: false,
        2: true
    },
    2: {
        0: true,
        1: true
    }
};
```

#### 新结构
```javascript
// 新AppState结构
appState.get('filters.personalities') // Map
Map {
    1 => Map { 0 => true, 1 => false, 2 => true },
    2 => Map { 0 => true, 1 => true }
}

// 转换方法
const oldFormat = window.filteredPersonalityData;
const newFormat = new Map(
    Object.entries(oldFormat).map(([sinnerId, personas]) => [
        parseInt(sinnerId),
        new Map(Object.entries(personas).map(([idx, enabled]) => [parseInt(idx), enabled]))
    ])
);
```

### 迁移代码示例

#### 例1：初始化

**旧代码：**
```javascript
import * as Settings from './settings.js';

// 在某处初始化
Settings.createPersonalitySettings();
```

**新代码：**
```javascript
import { SettingsController } from './controllers/settingsController.js';
import { appState, eventBus, logger } from './core/index.js';

// 在应用启动时初始化一次
const settingsController = new SettingsController(appState, eventBus, logger);
settingsController.initDOM(domElements);

// 需要时调用
settingsController.createPersonalitySettings();
```

#### 例2：处理人格过滤变更

**旧代码：**
```javascript
// 直接访问全局变量
if (window.filteredPersonalityData[sinnerId][personaIndex]) {
    // 该人格被启用
}
```

**新代码：**
```javascript
// 通过事件系统
eventBus.subscribe('PERSONALITY_FILTER_CHANGED', (data) => {
    const { sinnerId, personaIndex, isChecked } = data;
    if (isChecked) {
        // 该人格被启用
    }
});

// 或直接从AppState查询
const filters = appState.get('filters.personalities');
const isChecked = filters.get(sinnerId)?.get(personaIndex) ?? true;
```

#### 例3：验证设置

**旧代码：**
```javascript
// 手动检查
let hasAnySelected = false;
for (let sinnerId in window.filteredPersonalityData) {
    for (let idx in window.filteredPersonalityData[sinnerId]) {
        if (window.filteredPersonalityData[sinnerId][idx]) {
            hasAnySelected = true;
            break;
        }
    }
    if (hasAnySelected) break;
}
```

**新代码：**
```javascript
// 直接使用内置方法
const isValid = settingsController.validateSettings();
```

### 向后兼容层使用（过渡期）

如果你希望快速迁移但保持兼容，可以使用 `settings-compat.js`：

```javascript
import { initSettingsCompat, getSettingsController } from './settings-compat.js';

// 在初始化阶段
initSettingsCompat(appState, eventBus, logger);

// 之后所有旧调用继续工作
const settingsController = getSettingsController();
settingsController.createPersonalitySettings();
```

### 测试检查表

迁移完成后，请验证以下场景：

#### 基础功能
- [ ] 创建人格设置UI正常显示
- [ ] 选中/取消选中单个人格时，AppState正确更新
- [ ] 全选按钮能够选中所有人格
- [ ] 全不选按钮能够取消所有人格
- [ ] 反选按钮能够反转所有人格状态

#### 罪人级操作
- [ ] 特定罪人的全选功能正常
- [ ] 特定罪人的全不选功能正常
- [ ] 特定罪人的反选功能正常
- [ ] 页面切换时，每个罪人的设置正确保存

#### 事件系统
- [ ] 人格过滤变更时，`PERSONALITY_FILTER_CHANGED`事件正确触发
- [ ] 全选时，`PERSONALITIES_SELECTED_ALL`事件正确触发
- [ ] 所有事件订阅者都收到正确的数据

#### 状态管理
- [ ] AppState中的`filters.personalities`正确更新
- [ ] 刷新页面后，设置从localStorage恢复正确
- [ ] 与FilterController的交互正常（过滤罪人时，人格设置正确更新）

### 常见问题

**Q: 如何从旧的全局变量迁移到新的AppState？**
A: 使用过渡方法：
```javascript
// 将旧数据迁移到新格式
const oldData = window.filteredPersonalityData || {};
const newData = new Map(
    Object.entries(oldData).map(([sinnerId, personas]) => [
        parseInt(sinnerId),
        new Map(Object.entries(personas).map(([idx, enabled]) => [parseInt(idx), enabled]))
    ])
);
appState.set('filters.personalities', newData);
```

**Q: 旧的checkbox事件处理怎么办？**
A: 新架构在SettingsController内部自动处理。所有checkbox变更都会：
1. 更新AppState
2. 触发事件
3. 同步相关UI

你只需要订阅事件即可：
```javascript
eventBus.subscribe('PERSONALITY_FILTER_CHANGED', handleFilterChange);
```

**Q: 如何在新架构中进行设置验证？**
A: 使用内置的validateSettings方法：
```javascript
if (settingsController.validateSettings()) {
    // 设置有效，继续
} else {
    // 设置无效，提示用户
    console.warn('没有选中任何人格');
}
```

**Q: 需要访问所有选中的人格吗？**
A: 使用getSelectedSinners方法和AppState：
```javascript
const selectedSinners = settingsController.getSelectedSinners();
const filters = appState.get('filters.personalities');

selectedSinners.forEach(sinner => {
    sinner.personalities.forEach((persona, index) => {
        if (filters.get(sinner.id)?.get(index)) {
            // 该人格被选中
        }
    });
});
```

### 迁移时间表

| 阶段 | 任务 | 预计时间 |
|------|------|--------|
| Phase 1 | ✅ SettingsController开发 | 已完成 |
| Phase 1 | ✅ settings-compat.js开发 | 已完成 |
| Phase 2 | ⏳ main.js中的调用迁移 | 1-2天 |
| Phase 3 | ⏳ 完整功能测试 | 1天 |
| Phase 4 | ⏳ 删除旧代码 | 0.5天 |

### 后续相关任务

- Task 9: 拆分common.js（676行）
- Task 10: 简化main.js（入口点）
- Task 11: 重构UI层（ui.js, modal.js）
- Task 12: 完整测试
- Task 13: 文档完善

### 更多资源

- [ScrollController迁移指南](./SCROLLS_MIGRATION_GUIDE.md)
- [FilterController迁移指南](./FILTERS_MIGRATION_GUIDE.md)
- [AppState文档](../core/appState.js)
- [EventBus文档](../core/eventBus.js)

---

**最后修改：** 2024年
**状态：** 已完成（SettingsController + 兼容层）
**下一步：** 拆分和重构common.js
