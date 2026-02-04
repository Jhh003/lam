# Filters.js 模块迁移指南

## 📋 概览

`filters.js` 模块已经根据新架构完全重构。原来的全局状态污染已经消除，所有逻辑都转移到了 `FilterController` 中。

### 迁移路径

```
旧代码 (filters.js)
     ↓
兼容层 (filters-compat.js) ← 过渡阶段，向后兼容
     ↓
新代码 (FilterController) ← 最终目标
```

---

## 🔄 迁移步骤

### 第1步：导入新模块

**旧方式**：
```javascript
import Filters from './filters.js';

Filters.createSinnerFilter();
Filters.applyFilters();
```

**新方式**：
```javascript
import { filterController } from './controllers/filterController.js';
import { appState } from './core/appState.js';
import { eventBus, GameEvents } from './core/eventBus.js';

filterController.createSinnerFilter();
filterController.applyFilters();
```

### 第2步：更新状态访问

**旧方式** (全局变量):
```javascript
const filtered = window.filteredSinnerData;
const sinner = window.currentSelectedSinner;
const hasChanges = window.hasUnsavedChanges;
```

**新方式** (AppState):
```javascript
const filtered = filterController.getFilteredSinners();
const sinner = appState.getSinner();
const hasChanges = appState.get('app.hasUnsavedChanges');
```

### 第3步：使用事件替代直接调用

**旧方式** (直接调用):
```javascript
// 修改过滤后，手动更新其他模块
Filters.updateFilteredSinnerData();
updateScrollUI(filtered);
updatePersonaUI(filtered);
```

**新方式** (事件驱动):
```javascript
// 自动发出事件，其他模块订阅
filterController.updateFilteredSinnerData();

// 其他模块订阅事件
eventBus.subscribe(GameEvents.SINNER_FILTER_CHANGED, (data) => {
    updateScrollUI(filterController.getFilteredSinners());
});
```

---

## 📖 API 映射表

### 方法映射

| 旧方法 | 新方法 | 说明 |
|-------|-------|------|
| `createAvatarPlaceholder(sinner)` | `filterController.createAvatarPlaceholder(sinner)` | 完全相同 |
| `createSinnerFilter()` | `filterController.createSinnerFilter()` | 完全相同 |
| `updateFilteredSinnerData()` | `filterController.updateFilteredSinnerData()` | 相同，返回AppState |
| `toggleAllCheckboxes(bool)` | `selectAllSinners()` / `deselectAllSinners()` | 拆分为两个方法 |
| `invertSelection()` | `filterController.invertSinnerSelection()` | 名称更明确 |
| `validateFilterSettings()` | `filterController.validateFilterSettings()` | 完全相同 |
| `applyFilters()` | `filterController.applyFilters()` | 完全相同 |
| `checkUnsavedChanges()` | `filterController.checkUnsavedChanges()` | 完全相同 |
| `refreshScrollsOnReturn()` | `filterController.refreshScrollsOnReturn()` | 完全相同（现在是异步）|

### 状态映射

| 旧全局变量 | 新位置 | 说明 |
|-----------|-------|------|
| `window.filteredSinnerData` | `filterController.getFilteredSinners()` | 获取方法替代 |
| `window.filteredPersonalityData` | `appState.get('filters.persona')` | 存储在AppState中 |
| `window.hasUnsavedChanges` | `appState.get('app.hasUnsavedChanges')` | 存储在AppState中 |
| `window.originalFilteredSinnerData` | `appState.get('filters.sinner')` | 恢复后自动保存 |
| `window.originalFilteredPersonalityData` | `appState.get('filters.persona')` | 恢复后自动保存 |

### 事件映射

| 旧方式 | 新方式 | 何时触发 |
|-------|-------|--------|
| 直接调用 `updateUI()` | `GameEvents.SINNER_FILTER_CHANGED` | 罪人过滤变化时 |
| 直接调用 `updatePersonaUI()` | `GameEvents.PERSONA_FILTER_CHANGED` | 人格过滤变化时 |
| 直接调用 `refreshPersonalitySettings()` | `GameEvents.FILTER_CHANGED` | 应用过滤时 |

---

## 🔧 代码示例

### 示例1：创建过滤UI

**旧代码**:
```javascript
import Filters from './filters.js';

// 初始化
Filters.createSinnerFilter();

// 应用
document.getElementById('apply-btn').addEventListener('click', () => {
    Filters.applyFilters();
});
```

**新代码**:
```javascript
import { filterController } from './controllers/filterController.js';
import { eventBus, GameEvents } from './core/eventBus.js';

// 初始化
filterController.createSinnerFilter();

// 应用
document.getElementById('apply-btn').addEventListener('click', () => {
    filterController.applyFilters();
});

// 监听过滤变化
eventBus.subscribe(GameEvents.FILTER_CHANGED, (data) => {
    console.log('过滤已应用');
});
```

### 示例2：获取过滤后的数据

**旧代码**:
```javascript
import Filters from './filters.js';

// 应用过滤
Filters.updateFilteredSinnerData();

// 获取数据
const filtered = window.filteredSinnerData;
console.log(`已过滤${filtered.length}个罪人`);
```

**新代码**:
```javascript
import { filterController } from './controllers/filterController.js';

// 应用过滤
filterController.updateFilteredSinnerData();

// 获取数据
const filtered = filterController.getFilteredSinners();
console.log(`已过滤${filtered.length}个罪人`);
```

### 示例3：处理页面导航

**旧代码**:
```javascript
import Filters from './filters.js';

// 切换到设置页面
document.getElementById('settings-btn').addEventListener('click', () => {
    if (Filters.checkUnsavedChanges()) {
        // 显示设置页面...
    }
});
```

**新代码**:
```javascript
import { filterController } from './controllers/filterController.js';

// 切换到设置页面
document.getElementById('settings-btn').addEventListener('click', () => {
    if (filterController.checkUnsavedChanges()) {
        // 显示设置页面...
    }
});
```

---

## 🔄 过渡策略

### 阶段1：使用兼容层（现在）

```javascript
// 继续使用旧的API
import Filters from './filters-compat.js';

Filters.createSinnerFilter();
Filters.applyFilters();

// 兼容层会自动转发到新的FilterController
```

**优点**：
- 现有代码无需修改
- 可以逐步迁移
- 降低风险

### 阶段2：逐步迁移（下一步）

```javascript
// 新的代码使用新的API
import { filterController } from './controllers/filterController.js';

filterController.createSinnerFilter();
filterController.applyFilters();

// 旧的代码仍然使用兼容层
// 两者可以共存
```

### 阶段3：完全迁移（最终）

```javascript
// 所有代码都使用新的API
// 移除兼容层
// 彻底清除全局变量
```

---

## ⚠️ 重要注意事项

### 1. 异步操作

`refreshScrollsOnReturn()` 现在是异步的：

**旧方式**:
```javascript
Filters.refreshScrollsOnReturn();
// 立即继续
```

**新方式**:
```javascript
await filterController.refreshScrollsOnReturn();
// 现在继续
```

### 2. 全局变量清除

不再使用任何 `window.*` 全局变量。改用 `appState`：

```javascript
// ❌ 不要这样做
const filtered = window.filteredSinnerData;

// ✅ 要这样做
const filtered = filterController.getFilteredSinners();
const state = appState.getSinnerFilters();
```

### 3. 事件驱动

取代直接调用，现在使用事件：

```javascript
// ❌ 旧方式
Filters.updateFilteredSinnerData();
updateUI();

// ✅ 新方式
filterController.updateFilteredSinnerData();
// UI会自动通过事件更新
```

---

## 🧪 测试检查清单

迁移完成后，请验证以下功能：

- [ ] 创建罪人过滤UI
- [ ] 选中/取消选中罪人
- [ ] 全选/全不选功能
- [ ] 反转选择功能
- [ ] 应用过滤设置
- [ ] 检查未保存更改提示
- [ ] 从设置页返回时刷新滚动列表
- [ ] 单个罪人时的自动选中
- [ ] 多个罪人时的历史保持
- [ ] 人格过滤显示正确

---

## 📞 常见问题

### Q: 兼容层会一直存在吗？

A: 不会。兼容层是为了平滑过渡。一旦所有代码都迁移到新API，就会移除兼容层。目前保留它是为了避免一次性重写太多代码。

### Q: 如何处理 window.filteredSinnerData？

A: 使用 `filterController.getFilteredSinners()` 替代。如果必须保持全局变量（临时兼容），使用：
```javascript
window.filteredSinnerData = filterController.getFilteredSinners();
```

### Q: 性能是否会受影响？

A: 不会。新架构实际上更高效，因为：
- 减少了全局变量查找
- 事件系统支持优先级和延迟执行
- 状态变化可以批量处理

### Q: 如何调试过滤状态？

A: 在浏览器控制台使用：
```javascript
window.__LAM_DEBUG__.getState('filters')
window.__LAM_DEBUG__.getState('app.hasUnsavedChanges')
```

---

## 📚 相关文档

- [新架构设计文档](./docs/technical/ARCHITECTURE_REFACTORING.md)
- [核心模块使用指南](./docs/technical/CORE_MODULES_USAGE.md)
- [FilterController源代码](./js/controllers/filterController.js)

