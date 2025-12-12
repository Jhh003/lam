# 版本 1.4.0 - 成功单通层数功能说明文档

## 📋 功能概览

本次更新（v1.4.0）新增了**成功单通层数**上传和展示功能，允许玩家记录和分享他们在镜像地下城中的单通成就。

---

## 🎯 核心功能

### 1. 成功单通层数上传

在计时器弹窗的排行榜表单中新增：

#### 新增表单元素：

1. **"是否成功单通？"复选框**
   - 位置：E.G.O 复选框下方
   - 默认状态：未选中
   - 功能：控制层数选择表单的显示/隐藏

2. **层数选择单选按钮组**
   - 位置：成功单通复选框下方（条件显示）
   - 选项：
     - 第5层
     - 第10层
     - 第15层
   - 布局：水平排列，flex布局

#### 交互逻辑：

- 选中"是否成功单通？" → 显示层数选择
- 取消选中 → 隐藏层数选择，并清除已选层数
- **首次勾选时**：自动弹出使用说明模态框（仅显示一次）

---

### 2. 层数排行榜展示

在 `ranking.html` 页面新增第三个标签页：

#### 标签页结构：

```
┌─────────────────────────────────────────┐
│  部门记录（本地） │ 都市广播（联网） │ 单通层数（联网） │
└─────────────────────────────────────────┘
```

#### 展示格式：

**层数排行榜视图**采用与时间排行榜相同的UI设计：

```
罪人分组
├── 人格分组 1
│   ├── 记录 1: 第15层 (2025-12-12)
│   ├── 记录 2: 第15层 (2025-12-13)
│   └── 记录 3: 第10层 (2025-12-10)
└── 人格分组 2
    └── ...
```

**每条记录显示：**
- 排名序号
- 提交日期
- 备注信息
- **单通层数**（替代通关时间的位置）

---

### 3. 数据存储与处理

#### 数据文件结构：

**新增文件**：`data/global-floor-ranking.json`

```json
{
  "version": "1.0.0",
  "generatedAt": "2025-12-12T12:00:00Z",
  "lastUpdate": "2025-12-12T12:00:00Z",
  "sinners": {
    "9": {
      "id": 9,
      "name": "罗佳 (Rodion)",
      "personas": {
        "脑叶公司E.G.O:泪锋之剑": [
          {
            "floorLevel": 15,
            "runDate": "2025-12-12",
            "comment": "首次单通15层",
            "usedEgo": true,
            "submittedAt": "2025-12-12T10:30:00Z",
            "issueNumber": 123
          }
        ]
      }
    }
  }
}
```

#### 数据字段说明：

| 字段 | 类型 | 说明 |
|------|------|------|
| `floorLevel` | Number | 单通层数（5/10/15） |
| `runDate` | String | 通关日期（YYYY-MM-DD） |
| `comment` | String | 备注信息 |
| `usedEgo` | Boolean | 是否使用了 E.G.O |
| `submittedAt` | String | 提交时间（ISO 8601） |
| `issueNumber` | Number | 对应的 GitHub Issue 编号 |

---

## 📊 排序规则

### 层数排行榜排序逻辑：

```javascript
sinner.personas[personaName].sort((a, b) => {
  // 1. 首先按层数递减排序（15 > 10 > 5）
  if (b.floorLevel !== a.floorLevel) {
    return b.floorLevel - a.floorLevel;
  }
  // 2. 相同层数按提交时间升序排序（早提交排前面）
  return new Date(a.submittedAt) - new Date(b.submittedAt);
});
```

**排序优先级：**
1. **主要依据**：层数高低（15层 > 10层 > 5层）
2. **次要依据**：提交时间（先提交的排在前面）

**示例排序结果：**
```
1. 玩家A - 第15层 - 2025-12-10
2. 玩家B - 第15层 - 2025-12-12
3. 玩家C - 第10层 - 2025-12-09
4. 玩家D - 第5层  - 2025-12-11
```

---

## 🔧 技术实现细节

### 1. 前端修改

#### `index.html` (主页面)

**新增HTML元素：**
```html
<div class="form-group">
    <label>
        <input type="checkbox" id="solo-clear-checkbox" name="soloClear" style="margin-right: 8px;">
        是否成功单通？
    </label>
</div>
<div class="form-group" id="floor-selection" style="display: none; margin-left: 30px;">
    <label style="display: block; margin-bottom: 8px; color: #d4af37;">选择单通层数：</label>
    <div style="display: flex; gap: 15px; flex-wrap: wrap;">
        <label><input type="radio" name="floorLevel" value="5"> 第5层</label>
        <label><input type="radio" name="floorLevel" value="10"> 第10层</label>
        <label><input type="radio" name="floorLevel" value="15"> 第15层</label>
    </div>
</div>
```

#### `js/common.js` (逻辑处理)

**新增功能：**

1. **层数选择显示控制**
```javascript
soloClearCheckbox.addEventListener('change', function() {
    if (this.checked) {
        floorSelection.style.display = 'block';
        // 首次显示使用说明
        if (!localStorage.getItem('hasSeenFloorGuide')) {
            showFloorGuide();
            localStorage.setItem('hasSeenFloorGuide', 'true');
        }
    } else {
        floorSelection.style.display = 'none';
        // 清除选中的层数
        document.querySelectorAll('input[name="floorLevel"]').forEach(radio => {
            radio.checked = false;
        });
    }
});
```

2. **上传数据收集**
```javascript
const soloClear = soloClearCheckbox ? soloClearCheckbox.checked : false;
let floorLevel = null;
if (soloClear) {
    const selectedFloor = document.querySelector('input[name="floorLevel"]:checked');
    floorLevel = selectedFloor ? parseInt(selectedFloor.value, 10) : null;
}
```

3. **确认弹窗信息更新**
```javascript
if (soloClear && floorLevel) {
    info += `成功单通层数：第${floorLevel}层\n`;
}
```

#### `ranking.html` (排行榜页面)

**新增标签页：**
```html
<button id="floor-tab-btn" class="tab-btn">
    <i class="fas fa-layer-group"></i> 单通层数（联网）
</button>

<div id="floor-ranking" class="tab-content">
    <div id="floor-ranking-list" class="ranking-list"></div>
    <div class="actions">
        <button id="back-btn-3" class="control-btn primary-btn">返回主页</button>
        <button id="refresh-floor-btn" class="control-btn">刷新数据</button>
    </div>
</div>
```

**新增加载函数：**
```javascript
async function loadFloorRanking() {
    const response = await fetch('./data/global-floor-ranking.json');
    const data = await response.json();
    // 渲染层数排行榜
    // 格式：第X层
}
```

---

### 2. GitHub Issue 模板修改

#### `.github/ISSUE_TEMPLATE/submit-clear-run.yml`

**新增字段：**

```yaml
- type: checkboxes
  id: solo-clear
  attributes:
    label: 是否成功单通
    description: 请选择是否成功单通了镜像地下城
    options:
      - label: 是，我成功单通了镜像地下城
        required: false

- type: dropdown
  id: floor-level
  attributes:
    label: 单通层数（仅当选中"成功单通"时填写）
    description: 请选择您成功单通的最高层数
    options:
      - 未选择
      - 第5层
      - 第10层
      - 第15层
    default: 0
  validations:
    required: false
```

---

### 3. 数据聚合脚本修改

#### `scripts/generate-global-ranking.mjs`

**主要改动：**

1. **解析层数字段**
```javascript
case '是否成功单通':
  record.soloClear = value.includes('是，我成功单通了镜像地下城');
  break;
case '单通层数（仅当选中"成功单通"时填写）':
  if (value && value !== '未选择') {
    const match = value.match(/第(\d+)层/);
    if (match) {
      record.floorLevel = parseInt(match[1], 10);
    }
  }
  break;
```

2. **双数据结构维护**
```javascript
let rankingData;        // 时间排行榜
let floorRankingData;   // 层数排行榜
```

3. **层数记录添加**
```javascript
if (record.soloClear && record.floorLevel) {
  if (!floorRankingData.sinners[sinnerId].personas[record.personaName]) {
    floorRankingData.sinners[sinnerId].personas[record.personaName] = [];
  }
  
  const floorExists = floorRankingData.sinners[sinnerId].personas[record.personaName].some(
    r => r.floorLevel === record.floorLevel && r.runDate === record.runDate
  );
  
  if (!floorExists) {
    floorRankingData.sinners[sinnerId].personas[record.personaName].push({
      floorLevel: record.floorLevel,
      runDate: record.runDate,
      comment: record.comment || '',
      usedEgo: record.usedEgo || false,
      submittedAt: issue.created_at,
      issueNumber: issue.number
    });
  }
}
```

4. **层数排行榜排序**
```javascript
for (const sinnerId in floorRankingData.sinners) {
  const sinner = floorRankingData.sinners[sinnerId];
  for (const personaName in sinner.personas) {
    sinner.personas[personaName].sort((a, b) => {
      // 首先按层数递减排序
      if (b.floorLevel !== a.floorLevel) {
        return b.floorLevel - a.floorLevel;
      }
      // 相同层数按提交时间排序
      return new Date(a.submittedAt) - new Date(b.submittedAt);
    });
    
    // 只保留前50名
    if (sinner.personas[personaName].length > 50) {
      sinner.personas[personaName] = sinner.personas[personaName].slice(0, 50);
    }
  }
}
```

5. **写入两个数据文件**
```javascript
writeFileSync(dataPath, JSON.stringify(rankingData, null, 2), 'utf8');
writeFileSync(floorDataPath, JSON.stringify(floorRankingData, null, 2), 'utf8');
```

---

## 💡 用户引导功能

### 首次使用说明

**触发时机：**
- 用户首次勾选"是否成功单通？"复选框时

**实现机制：**
```javascript
const hasSeenGuide = localStorage.getItem('hasSeenFloorGuide');
if (!hasSeenGuide) {
    window.Modal?.alert(
        '🎯 成功单通层数上传指南\n\n' +
        '1、选中"是否成功单通？"后，需要选择您成功单通的最高层数。\n\n' +
        '2、目前支持的层数有：第5层、第10层、第15层。\n\n' +
        '3、层数排行榜按层数高低排序（15层 > 10层 > 5层）。\n\n' +
        '4、相同层数的记录按提交时间排序，先提交的排在前面。\n\n' +
        '5、您可以在排行榜页面的"单通层数（联网）"标签页查看所有层数记录。',
        '使用说明'
    );
    localStorage.setItem('hasSeenFloorGuide', 'true');
}
```

**说明内容：**

1. ✅ 如何选择层数
2. ✅ 支持的层数选项
3. ✅ 排序规则说明
4. ✅ 相同层数的排序方式
5. ✅ 在哪里查看层数排行榜

**特点：**
- 仅显示一次（使用 localStorage 记录）
- 清晰的图标（🎯）和编号
- 简洁易懂的说明文字

---

## 🎨 UI/UX 设计

### 设计原则

1. **风格统一**：保持边狱巴士的金色主题（#d4af37）
2. **响应式布局**：支持各种屏幕尺寸
3. **交互友好**：清晰的反馈和状态提示

### 样式细节

#### 层数选择表单

```css
#floor-selection {
    display: none;           /* 默认隐藏 */
    margin-left: 30px;       /* 缩进显示从属关系 */
}

#floor-selection label {
    display: block;
    margin-bottom: 8px;
    color: #d4af37;          /* 金色标签 */
}

/* 单选按钮容器 */
#floor-selection > div {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;         /* 自适应换行 */
}

/* 单选按钮标签 */
#floor-selection label {
    display: flex;
    align-items: center;
    cursor: pointer;
}
```

#### 层数排行榜标签页

```css
.tab-btn {
    padding: 15px 35px;
    font-size: 1.2rem;
    border-radius: 30px;
    border: 2px solid #d4af37;
    background: rgba(20, 20, 30, 0.8);
    color: #d4af37;
    transition: all 0.3s;
}

.tab-btn.active {
    background: linear-gradient(145deg, #d4af37, #b8860b);
    color: #000;
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
}
```

---

## 📝 文件清单

### 修改的文件（6个）

1. **`index.html`**
   - 新增成功单通复选框
   - 新增层数选择单选按钮组
   - 更新版本号为 1.4.0

2. **`js/common.js`**
   - 新增层数选择显示控制逻辑
   - 新增首次使用指南功能
   - 上传函数支持层数数据收集
   - 确认弹窗显示层数信息

3. **`ranking.html`**
   - 新增"单通层数（联网）"标签页
   - 新增 `loadFloorRanking()` 函数
   - 更新 `switchTab()` 函数支持三个标签页
   - 新增层数排行榜按钮事件监听

4. **`.github/ISSUE_TEMPLATE/submit-clear-run.yml`**
   - 新增"是否成功单通"复选框字段
   - 新增"单通层数"下拉选择字段

5. **`scripts/generate-global-ranking.mjs`**
   - 解析成功单通和层数字段
   - 维护两个独立的排行榜数据结构
   - 实现层数排行榜的排序逻辑
   - 写入两个JSON数据文件

6. **`README.md`**
   - 新增 v1.4.0 版本更新日志

### 新增的文件（1个）

7. **`data/global-floor-ranking.json`**
   - 层数排行榜数据文件（初始化为空）

---

## ✅ 测试清单

### 前端功能测试

- [ ] 勾选"是否成功单通？"显示层数选择
- [ ] 取消勾选隐藏层数选择并清除选中状态
- [ ] 首次勾选时显示使用说明（仅一次）
- [ ] 选择层数后上传确认弹窗显示层数信息
- [ ] 层数选择表单样式正确（缩进、颜色）

### 排行榜页面测试

- [ ] "单通层数（联网）"标签页正常显示
- [ ] 标签页切换功能正常
- [ ] 层数排行榜数据正确加载
- [ ] 排序规则正确（层数 > 时间）
- [ ] 空数据时显示提示信息
- [ ] 加载失败时显示错误信息

### GitHub Integration 测试

- [ ] Issue 模板包含单通字段
- [ ] 提交 Issue 时字段正确填充
- [ ] Actions 工作流正常运行
- [ ] 数据聚合脚本正确解析层数
- [ ] 生成两个独立的JSON文件
- [ ] 层数排行榜数据排序正确

### 响应式测试

- [ ] 桌面端（1920x1080）
- [ ] 笔记本（1366x768）
- [ ] 平板（768x1024）
- [ ] 手机（375x667）

---

## 🚀 部署步骤

### 1. 代码更新

```bash
git add .
git commit -m "feat: v1.4.0 - 新增成功单通层数排行榜功能"
git push origin main
```

### 2. 验证 GitHub Actions

1. 前往仓库的 Actions 页面
2. 手动触发 "Update Global Ranking" 工作流
3. 确认生成了两个数据文件：
   - `data/global-ranking.json`
   - `data/global-floor-ranking.json`

### 3. 测试上传流程

1. 访问网站主页
2. 完成罪人和人格抽取
3. 开始计时
4. 勾选"是否成功单通？"
5. 选择层数
6. 点击"上传全球榜"
7. 验证 GitHub Issue 正确创建
8. 等待 Actions 自动运行
9. 检查排行榜页面数据

---

## 📞 常见问题

### Q1：为什么只支持 5、10、15 三个层数？

**A**：这是基于游戏实际情况设计的常见里程碑层数。未来可以根据需求扩展更多层数选项。

### Q2：如果同时选择了时间和层数，会怎样？

**A**：两个排行榜是独立的：
- 时间排行榜：记录通关时间
- 层数排行榜：仅当勾选"成功单通"并选择层数时才会记录

同一条 Issue 可以同时出现在两个排行榜中。

### Q3：层数排行榜的数据量限制是多少？

**A**：与时间排行榜相同，每个人格最多保留前 50 名记录。

### Q4：如何修改首次使用说明？

**A**：删除浏览器 localStorage 中的 `hasSeenFloorGuide` 键，即可再次显示。

```javascript
localStorage.removeItem('hasSeenFloorGuide');
```

### Q5：层数数据会影响时间排行榜吗？

**A**：不会。两个排行榜完全独立，互不影响。

---

## 🎉 总结

v1.4.0 版本成功实现了成功单通层数排行榜功能，主要特点：

✅ **独立的数据系统**：层数和时间排行榜完全分离  
✅ **智能排序规则**：层数优先，时间次之  
✅ **友好的用户体验**：首次使用自动引导  
✅ **统一的UI设计**：保持边狱巴士风格  
✅ **完整的技术架构**：从前端到后端全链路支持  

**下一步计划：**
- 可考虑添加更多层数选项
- 支持筛选和搜索功能
- 添加数据统计和可视化

---

**文档版本**：1.0  
**最后更新**：2025-12-12  
**作者**：Qoder AI Assistant
