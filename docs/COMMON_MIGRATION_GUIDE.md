## Common.js拆分迁移指南

### 概述

本指南说明如何从单一的 `common.js`（676行）迁移到4个专门的Controller。该模块包含计时器、动画、排行榜和上传功能。

### 拆分结构

原始的 `common.js` 被分成4个功能专一的模块：

| 模块 | 行数 | 功能 |
|------|------|------|
| TimerController | 130 | 计时器管理、启动、暂停、重置 |
| AnimationController | 100 | 倒计时显示、闪烁动画效果 |
| RankingApiController | 150 | 本地排行榜、API调用、数据管理 |
| UploadController | 280 | GitHub Issue提交、表单处理、验证 |
| common-compat.js | 200 | 向后兼容适配层 |

### 关键变化

#### 旧架构问题
- ❌ 单一676行文件，职责混乱
- ❌ 全局变量：`timerInterval`、`seconds`、`isRunning`
- ❌ IIFE模式，难以测试和维护
- ❌ 嵌套函数过深，难以理解
- ❌ 耦合严重：计时、动画、API、上传混在一起

#### 新架构优势
- ✅ 4个专一的Controller，单一职责原则
- ✅ AppState中央状态管理
- ✅ 事件驱动通信
- ✅ 清晰的API接口
- ✅ 易于测试和维护
- ✅ 易于扩展新功能

### 关键保护项

#### formatTime 函数
```javascript
/**
 * 【受保护】时间格式化函数
 * 已验证通过，支持所有有效秒数范围
 * 格式：HH:MM:SS
 * 不能修改！
 */
formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
```

### 分阶段迁移计划

#### 第一阶段：Controllers创建（已完成）
- ✅ 创建TimerController（130行）
- ✅ 创建AnimationController（100行）
- ✅ 创建RankingApiController（150行）
- ✅ 创建UploadController（280行）
- ✅ 创建common-compat.js（200行）

#### 第二阶段：逐个迁移调用点（规划中）
需要在以下文件中进行迁移：
- main.js（主程序入口）
- index.html（初始化脚本）
- 其他调用common.js的地方

#### 第三阶段：删除旧代码（后续）
- 确认所有调用点已迁移
- 删除common.js
- 删除common-compat.js

### API映射表

#### Timer API

| 旧API | 新API | 说明 |
|------|------|------|
| `startTimer()` | `timerController.startTimer()` | 启动计时 |
| `pauseTimer()` | `timerController.pauseTimer()` | 暂停计时 |
| `resetTimer()` | `timerController.resetTimer()` | 重置计时 |
| `formatTime(seconds)` | `timerController.formatTime(seconds)` | 格式化时间 |
| `updateTimerDisplay()` | `timerController.updateDisplay()` | 更新显示 |

#### Animation API

| 旧API | 新API | 说明 |
|------|------|------|
| `initCountdown()` | `animationController.initCountdown()` | 初始化倒计时 |
| `createAnimatedText(text)` | `animationController.createAnimatedText(text)` | 创建动画文本 |
| — | `animationController.updateCountdown(text)` | 更新倒计时文本 |

#### Ranking API

| 旧API | 新API | 说明 |
|------|------|------|
| `saveToLocalRanking()` | `rankingApiController.saveToLocalRanking(seconds, sinner, persona, note)` | 保存本地排行榜 |
| `viewRanking()` | `rankingApiController.viewRanking()` | 查看排行榜 |
| `getCurrentTime()` | `rankingApiController.getCurrentTime()` | 获取当前时间 |
| `isValidUrl(url)` | `rankingApiController.isValidUrl(url)` | 验证URL |

#### Upload API

| 旧API | 新API | 说明 |
|------|------|------|
| `uploadToGlobalRanking()` | `uploadController.uploadToGlobalRanking()` | 上传到全球排行榜 |
| `showUploadModal()` | `uploadController.showUploadModal()` | 显示上传窗口 |
| `hideUploadModal()` | `uploadController.hideUploadModal()` | 隐藏上传窗口 |

### 状态映射表

| 旧全局变量 | 新AppState路径 | 说明 |
|----------|--------------|------|
| `timerInterval` | 内部变量（不需要外部访问） | 计时器定时器ID |
| `seconds` | `appState.get('timer.elapsedSeconds')` | 经过的秒数 |
| `isRunning` | `appState.get('timer.isRunning')` | 计时器是否运行 |

### 事件映射表

新的事件系统提供事件驱动的通信：

| 新事件 | 数据 | 说明 |
|------|------|------|
| `TIMER_STARTED` | `{ elapsedSeconds }` | 计时器已启动 |
| `TIMER_PAUSED` | `{ elapsedSeconds }` | 计时器已暂停 |
| `TIMER_RESET` | `{ elapsedSeconds }` | 计时器已重置 |
| `RANKING_SAVED_LOCAL` | `{ record, totalRecords }` | 记录已保存到本地 |
| `RANKING_CLEARED_LOCAL` | `{}` | 本地排行榜已清空 |
| `RANKING_PAGE_OPENED` | `{}` | 排行榜页面已打开 |
| `RECORD_SUBMITTED_FULL` | `{ sinner, persona, time, ... }` | 完整记录已提交 |
| `RECORD_SUBMITTED_FLOOR_ONLY` | `{ sinner, persona, floorLevel, ... }` | 简化记录已提交 |

### 迁移代码示例

#### 例1：初始化

**旧代码：**
```javascript
import * as Common from './common.js';

// 页面加载时自动初始化
window.addEventListener('DOMContentLoaded', () => {
    initCountdown();
    initTimer();
});
```

**新代码：**
```javascript
import { initCommonCompat, initCommonDOM } from './common-compat.js';
import { appState, eventBus, logger } from './core/index.js';

// 在应用启动时初始化一次
const controllers = initCommonCompat(appState, eventBus, logger, modal);
initCommonDOM(domElements);

// 现在所有功能都可用了
```

#### 例2：启动计时器

**旧代码：**
```javascript
// 直接调用全局函数
startTimer();

// 检查状态
if (isRunning) {
    // 做某事
}
```

**新代码：**
```javascript
// 通过Controller
const timerController = getTimerController();
timerController.startTimer();

// 通过AppState检查状态
const isRunning = appState.get('timer.isRunning');

// 或通过事件
eventBus.subscribe('TIMER_STARTED', ({ elapsedSeconds }) => {
    // 计时器已启动
});
```

#### 例3：保存到本地排行榜

**旧代码：**
```javascript
// 直接调用，自动使用全局变量
saveToLocalRanking();
```

**新代码：**
```javascript
// 需要传递参数
const rankingApi = getRankingApiController();
const sinner = appState.get('game.selectedSinner');
const persona = appState.get('game.selectedPersona');
const seconds = appState.get('timer.elapsedSeconds');
const note = 'optional player note';

await rankingApi.saveToLocalRanking(seconds, sinner, persona, note);
```

#### 例4：处理上传事件

**旧代码：**
```javascript
// 没有事件系统，需要手动追踪
let uploadInProgress = false;
function handleUpload() {
    uploadInProgress = true;
    // 上传逻辑
    uploadInProgress = false;
}
```

**新代码：**
```javascript
// 使用事件系统
eventBus.subscribe('RECORD_SUBMITTED_FULL', ({ sinner, persona, time }) => {
    console.log(`记录已提交: ${sinner.name} - ${persona.name} - ${time}秒`);
    // 做相应的处理
});

eventBus.subscribe('RECORD_SUBMITTED_FLOOR_ONLY', ({ sinner, persona, floorLevel }) => {
    console.log(`层数记录已提交: ${sinner.name} - ${persona.name} - 第${floorLevel}层`);
});
```

### 向后兼容层使用（过渡期）

如果你希望快速迁移但保持兼容，可以使用 `common-compat.js`：

```javascript
import { initCommonCompat, initCommonDOM, startTimer } from './common-compat.js';

// 在初始化阶段
initCommonCompat(appState, eventBus, logger, modal);
initCommonDOM(domElements);

// 之后所有旧调用继续工作
startTimer();
pauseTimer();
resetTimer();
```

### 测试检查表

迁移完成后，请验证以下场景：

#### 计时器功能
- [ ] 点击开始按钮，计时器开始运行
- [ ] 显示正确的时间格式（HH:MM:SS）
- [ ] 点击暂停按钮，计时器暂停
- [ ] 点击重置按钮，时间归零
- [ ] 计时器状态正确保存到AppState

#### 动画效果
- [ ] 倒计时文本正确显示
- [ ] 闪烁动画正常运行
- [ ] 更新倒计时文本时动画重新启动

#### 排行榜功能
- [ ] 保存到本地排行榜成功
- [ ] 查看排行榜页面打开正常
- [ ] 本地记录按时间升序排列
- [ ] 相关事件正确触发

#### 上传功能
- [ ] 上传模态窗口正确打开/关闭
- [ ] 完整记录上传流程正常
- [ ] 简化记录上传流程正常
- [ ] 时间验证（≥2小时）正常工作
- [ ] GitHub Issue URL生成正确

#### 事件系统
- [ ] 所有定义的事件都能正确触发
- [ ] 事件数据准确、完整
- [ ] 事件订阅者能正确接收事件

### 常见问题

**Q: 旧代码中的 `seconds` 全局变量怎么办？**
A: 使用 `appState.get('timer.elapsedSeconds')`替代。这个值会自动保存到localStorage，支持页面刷新后恢复。

**Q: 如何获取当前的计时器时间？**
A: 有三种方式：
```javascript
// 方法1：通过Controller
const timerController = getTimerController();
const seconds = timerController.getElapsedSeconds();

// 方法2：通过AppState
const seconds = appState.get('timer.elapsedSeconds');

// 方法3：订阅事件
eventBus.subscribe('TIMER_STARTED', ({ elapsedSeconds }) => {
    console.log(`已经过${elapsedSeconds}秒`);
});
```

**Q: 如何知道计时器是否运行中？**
A: 
```javascript
// 方法1：通过Controller
const isRunning = timerController.isTimerRunning();

// 方法2：通过AppState
const isRunning = appState.get('timer.isRunning');
```

**Q: formatTime函数是否需要修改？**
A: **不需要！** 这个函数已经过完整测试，格式化逻辑保持不变。新TimerController中保持原样。

**Q: 如何在新架构中获取服务器时间？**
A: 
```javascript
const rankingApi = getRankingApiController();
const serverTime = await rankingApi.getCurrentTime();
```

### 性能考虑

- **内存使用**：4个独立的Controller，每个占用较少内存
- **初始化时间**：略有增加（创建4个对象），但可以接受
- **计时精度**：保持不变（每1000ms更新一次）

### 迁移时间表

| 阶段 | 任务 | 预计时间 |
|------|------|--------|
| Phase 1 | ✅ 4个Controller开发 | 已完成 |
| Phase 1 | ✅ common-compat.js开发 | 已完成 |
| Phase 2 | ⏳ main.js中的调用迁移 | 1-2天 |
| Phase 3 | ⏳ 完整功能测试 | 1-2天 |
| Phase 4 | ⏳ 删除旧代码 | 0.5天 |

### 后续相关任务

- Task 10: 简化main.js（入口点）
- Task 11: 重构UI层（ui.js, modal.js）
- Task 12: 完整测试
- Task 13: 文档完善

### 更多资源

- [TimerController](../../js/controllers/timerController.js)
- [AnimationController](../../js/controllers/animationController.js)
- [RankingApiController](../../js/controllers/rankingApiController.js)
- [UploadController](../../js/controllers/uploadController.js)
- [AppState文档](../core/appState.js)
- [EventBus文档](../core/eventBus.js)

---

**最后修改：** 2024年
**状态：** 已完成（4个Controller + 兼容层）
**下一步：** 简化main.js入口点
