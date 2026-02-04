## UI层迁移指南 - Task 11 完成

### 概述

UI层重构将其从单体脚本（ui.js）和孤立的Modal模块转变为集成到应用框架的UIController。

**重构范围：**
- ui.js: ~60行 → UIController.js: ~400行（功能大幅增强）
- modal.js: ~100行 → modal-new.js: ~350行（完全重写，功能更强）
- 新增：ui-compat.js（兼容层）

**改进点：**
- ✅ 集成到AppState和EventBus
- ✅ 响应式UI更新
- ✅ 改进的Modal系统
- ✅ 统一的通知和错误处理
- ✅ 无障碍支持(ARIA)

---

## 文件变化

### UIController.js（新文件）

**职责：**
- 管理所有UI元素的创建和更新
- 响应应用事件并更新视图
- 提供统一的UI API
- 处理加载、错误和通知状态

**主要类和方法：**

```javascript
class UIController {
    // 初始化
    constructor(appState, eventBus, logger, Modal)
    initDOM(domElements)
    
    // 事件订阅
    subscribeToEvents()
    
    // 显示更新
    updateSelectedSinner(sinner)
    updateSelectedPersona(persona)
    updateImageElement(element, imagePath, fallbackText, backgroundColor)
    
    // 按钮状态
    updateScrollButtonStates(isScrolling)
    updateTimerButtonStates(state)
    setButtonState(selector, disabled)
    
    // 计时器
    updateTimerDisplay(elapsedSeconds)
    
    // 用户反馈
    showNotification(message, type, duration)
    showLoading(message)
    hideLoading()
    showError(message, duration)
    
    // 导航
    switchPage(pageName)
    
    // 统计
    updateStats(sinnerCount, personaCount)
}
```

### modal-new.js（完全重写）

**改进点：**

| 功能 | 旧版 | 新版 |
|------|------|------|
| 基础Dialog | alert, confirm | alert, confirm, prompt |
| 样式 | 基础 | 现代UI，内联样式 |
| 动画 | 简单淡入 | 缩放 + 淡入 |
| 无障碍 | 无 | ARIA标签，角色支持 |
| 关闭方式 | 点击按钮 | 按钮、背景、ESC |
| 自定义 | 有限 | 完整选项 |

**API：**

```javascript
const modal = new Modal(options);

// 基础方法
modal.alert(message, title) → Promise<boolean>
modal.confirm(message, title) → Promise<boolean>
modal.prompt(message, title, defaultValue) → Promise<string|null>

// 高级方法
modal.show(title, message, buttons, onClose) → Promise<result>
modal.close()

// 选项
{
    animationDuration: 300,      // 动画时长(ms)
    closeOnEscape: true,         // ESC键关闭
    closeOnOverlayClick: true    // 背景点击关闭
}
```

### ui-compat.js（新文件）

**兼容函数：**

```javascript
window.showNotificationCompat(message, type, duration)
window.showLoadingCompat(message)
window.hideLoadingCompat()
window.showErrorCompat(message, duration)
window.updateStatsCompat(sinnerCount, personaCount)
window.setButtonStateCompat(selector, disabled)
window.switchPageCompat(pageName)
window.updateImageCompat(element, imagePath, fallbackText, bgColor)

window.ModalCompat.alert(message, title)
window.ModalCompat.confirm(message, title)
window.ModalCompat.prompt(message, title, defaultValue)
```

---

## 架构变化

### 旧架构

```
HTML
  ↓
UI.js (IIFE)
  ├── 独立的页面导航
  ├── 按钮事件绑定
  └── 直接导入old modules

Modal.js (IIFE)
  ├── 独立的Dialog系统
  └── 没有与应用集成
```

**问题：**
- UI更新没有反映应用状态变化
- Modal独立于应用，没有事件集成
- 无法响应式更新
- 代码分散，难以维护

### 新架构

```
AppState (状态)
    ↓
EventBus (事件)
    ↓
UIController (视图)
    ├── 响应事件更新
    ├── 管理所有UI元素
    └── 提供统一API
    
Modal (对话框)
    ├── 集成到应用
    ├── 遵循设计规范
    └── 支持无障碍
```

**优点：**
- ✅ 响应式更新
- ✅ 事件驱动
- ✅ 集中管理
- ✅ 可预测的状态流

---

## 事件集成

UIController订阅以下事件：

```javascript
// 游戏事件
'SINNER_SELECTED'        → 更新罪人显示
'PERSONA_SELECTED'       → 更新人格显示

// 滚动事件
'SCROLLING_STARTED'      → 禁用开始按钮
'SCROLLING_STOPPED'      → 启用开始按钮

// 计时器事件
'TIMER_UPDATED'          → 更新计时器显示
'TIMER_STARTED'          → 更新按钮状态为运行中
'TIMER_PAUSED'           → 更新按钮状态为暂停
'TIMER_RESET'            → 更新按钮状态为停止

// 排行榜事件
'RANKING_SAVED_LOCAL'    → 显示成功通知

// UI事件
'UI_LOADING_START'       → 显示加载覆盖
'UI_LOADING_END'         → 隐藏加载覆盖
'UI_ERROR'               → 显示错误消息
```

---

## 代码对比示例

### 例1: 更新选中的罪人

**旧代码（main.js）**
```javascript
// 手动更新DOM
document.getElementById('selected-sinner').textContent = sinner.name;
document.getElementById('sinner-image').innerHTML = `<img src="${sinner.avatar}">`;
```

**新代码**
```javascript
// 自动响应事件
eventBus.subscribe('SINNER_SELECTED', (data) => {
    uiController.updateSelectedSinner(data.sinner);
});
```

### 例2: 显示Dialog

**旧代码（各处分散）**
```javascript
const result = await Modal.confirm('确定吗？');
```

**新代码（相同API）**
```javascript
const result = await modal.confirm('确定吗？');
// 现在支持ESC关闭、背景点击、动画等
```

### 例3: 加载状态

**旧代码（无法追踪）**
```javascript
// 手动显示/隐藏加载
showLoader();
// ...做某事
hideLoader();
```

**新代码（事件驱动）**
```javascript
// 发送事件
eventBus.emit('UI_LOADING_START', { message: '加载中...' });

// Controller自动处理UI更新
// 订阅者可以正确追踪状态
```

---

## 迁移步骤

### 步骤1: 在index.html中导入新模块

```html
<!-- 导入UIController -->
<script type="module">
    import { UIController } from './js/controllers/uiController.js';
    window.UIController = UIController;
</script>

<!-- 导入新Modal -->
<script type="module">
    import modal from './js/modal-new.js';
    window.Modal = modal;
</script>

<!-- 导入兼容层（可选） -->
<script type="module" src="./js/ui-compat.js"></script>
```

### 步骤2: 在main-new.js中初始化UIController

```javascript
// 在initializeControllers()中添加
const uiController = new UIController(appState, eventBus, logger, modal);
controllers.uiController = uiController;

// 在initializeDOMAndEvents()中初始化
uiController.initDOM(domElements);
```

### 步骤3: 更新HTML中的UI标记

为了让UIController能够找到元素，添加数据属性：

```html
<!-- 选择显示 -->
<div data-ui="selected-sinner-name"></div>
<div data-ui="selected-persona-name"></div>
<div data-ui="selected-sinner-image"></div>
<div data-ui="selected-persona-image"></div>

<!-- 统计信息 -->
<span data-ui="sinner-count"></span>
<span data-ui="persona-count"></span>

<!-- 按钮组 -->
<div data-ui="filter-btn-group"></div>
<div data-ui="scroll-btn-group"></div>
<div data-ui="timer-btn-group"></div>

<!-- 页面容器 -->
<div data-page="main"></div>
<div data-page="settings"></div>
<div data-page="ranking"></div>
```

### 步骤4: 验证功能

- [ ] 页面加载时显示正确的UI
- [ ] 选择罪人/人格时自动更新显示
- [ ] 计时器显示实时更新
- [ ] 按钮状态根据操作正确更改
- [ ] Dialog正常显示和关闭
- [ ] 通知正常显示
- [ ] 加载覆盖正常显示

---

## 最佳实践

### 使用UIController而不是直接DOM操作

```javascript
// ❌ 不推荐
document.getElementById('timer').textContent = '01:23:45';

// ✅ 推荐
uiController.updateTimerDisplay(5025);
```

### 使用事件而不是直接调用

```javascript
// ❌ 不推荐
updateUI();
showLoading();
// ...做某事
hideLoading();

// ✅ 推荐
eventBus.emit('UI_LOADING_START', { message: '加载中...' });
// ...做某事
eventBus.emit('UI_LOADING_END', {});
```

### 使用Modal而不是浏览器原生Dialog

```javascript
// ❌ 避免
alert('确定吗？');

// ✅ 使用
modal.confirm('确定吗？').then(result => {
    if (result) {
        // 用户点击了确定
    }
});
```

---

## 常见问题

### Q1: 如何添加自定义UI更新？

**A:** 扩展UIController或订阅事件：

```javascript
// 方法1: 订阅事件
eventBus.subscribe('CUSTOM_EVENT', (data) => {
    // 更新UI
});

// 方法2: 扩展UIController
class CustomUIController extends UIController {
    updateCustomUI(data) {
        // 自定义逻辑
    }
}
```

### Q2: 如何创建自定义Dialog？

**A:** 使用modal.show()方法：

```javascript
await modal.show(
    '自定义标题',
    '自定义消息',
    [
        { text: '按钮1', callback: () => { /* ... */ } },
        { text: '按钮2', callback: () => { /* ... */ } }
    ]
);
```

### Q3: 如何跟踪UI状态变化？

**A:** 订阅相关事件：

```javascript
eventBus.subscribe('SINNER_SELECTED', (data) => {
    console.log('罪人已更改:', data.sinner.name);
});

eventBus.subscribe('TIMER_UPDATED', (data) => {
    console.log('计时器更新:', data.elapsedSeconds, '秒');
});
```

---

## 样式和主题

新的Modal和UIController支持自定义样式：

```css
/* Dialog样式 */
.modal-overlay { /* 背景 */ }
.modal-box { /* 对话框 */ }
.modal-header { /* 标题区 */ }
.modal-body { /* 内容区 */ }
.modal-footer { /* 按钮区 */ }

/* 通知样式 */
.notification { /* 基础样式 */ }
.notification-info { /* 信息通知 */ }
.notification-success { /* 成功通知 */ }
.notification-error { /* 错误通知 */ }
.notification-warning { /* 警告通知 */ }

/* 加载覆盖 */
.loading-overlay { /* 背景 */ }
.loading-spinner { /* 旋转器 */ }
.spinner { /* 动画 */ }
```

---

## 下一步

- 完整的功能测试（Task 12）
- 最终文档更新（Task 13）

---

**重构完成时间:** 2024年
**贡献者:** GitHub Copilot
**版本:** 1.5.0+
