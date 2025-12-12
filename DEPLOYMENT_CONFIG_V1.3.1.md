# 版本 1.3.1 部署配置指南

## 📋 更新概览

本次更新（v1.3.1）主要包含以下改动：

1. **提高上传时间门槛**：从 1小时（3600秒）提高到 2小时（7200秒）
2. **新增 E.G.O 字段**：记录玩家是否使用了 E.G.O 装备

---

## 📝 修改的文件清单

### 前端文件（3个）

1. **`index.html`**
   - 新增 E.G.O 复选框（第173-178行）
   - 更新版本号为 1.3.1（第17行）

2. **`js/common.js`**
   - 修改时间验证：3600 → 7200秒（第237-240行）
   - 读取 E.G.O 复选框值（第265-267行）
   - 在确认弹窗中显示 E.G.O 信息（第287-290行）

3. **`README.md`**
   - 新增 1.3.1 版本更新日志（第82-99行）

### GitHub 配置文件（2个）

4. **`.github/ISSUE_TEMPLATE/submit-clear-run.yml`**
   - 更新时间要求说明：1小时 → 2小时（第14行）
   - 新增 E.G.O 复选框字段（第64-71行）

5. **`scripts/generate-global-ranking.mjs`**
   - 解析 E.G.O 字段（第74-77行）
   - 验证时间：3600 → 7200秒（第93行）
   - 保存 E.G.O 信息到数据（第203行）

### 文档文件（1个）

6. **`GLOBAL_RANKING_GUIDE.md`**
   - 更新前置条件：1小时 → 2小时（第43行）
   - 更新 Issue 模板说明表格（第70-77行）
   - 更新数据验证说明（第94行）
   - 更新常见问题 Q3（第128-129行）

---

## 🔧 部署前配置步骤

### 步骤 1：确认 GitHub 仓库信息

**必须配置**：在 `js/common.js` 第270-271行

```javascript
const repoOwner = 'your-username'; // ← 改成你的 GitHub 用户名
const repoName = 'lam'; // ← 改成你的仓库名
```

**如何查找**：
- GitHub 仓库 URL 格式：`https://github.com/用户名/仓库名`
- 例如：`https://github.com/johndoe/lam` → `repoOwner = 'johndoe'`, `repoName = 'lam'`

---

### 步骤 2：验证 GitHub 标签

确保仓库中已创建以下标签：

| 标签名 | 用途 | 推荐颜色 |
|--------|------|----------|
| `通关记录` | 标记通关记录 Issues | `#0366d6` (蓝色) |
| `已处理` | 标记已聚合的记录 | `#28a745` (绿色) |

**创建方法**：
1. 进入 GitHub 仓库
2. Issues → Labels → New label
3. 填写名称和颜色
4. 点击 "Create label"

---

### 步骤 3：配置 GitHub Actions 权限

**必须设置**：允许 Actions 写入仓库

**设置路径**：
1. 进入仓库 Settings
2. 左侧菜单选择 "Actions" → "General"
3. 滚动到 "Workflow permissions"
4. 选择 **"Read and write permissions"**
5. 点击 "Save"

**为什么需要**：
- Actions 需要写入权限才能更新 `data/global-ranking.json`
- 需要写入权限才能给 Issues 添加"已处理"标签

---

### 步骤 4：启用 GitHub Pages（如果还没有）

**设置路径**：
1. Settings → Pages
2. Source 选择："Deploy from a branch"
3. Branch 选择："main"（或 "master"）
4. Folder 选择："/ (root)"
5. 点击 "Save"

**验证**：
- 等待几分钟后，页面会显示你的站点 URL
- 例如：`https://username.github.io/lam/`

---

### 步骤 5：提交代码

```bash
# 查看修改的文件
git status

# 添加所有修改
git add .

# 提交
git commit -m "feat: v1.3.1 - 提高上传时间至2小时，新增E.G.O字段"

# 推送到 GitHub
git push origin main
```

---

### 步骤 6：手动触发首次 Actions 运行（可选）

**操作步骤**：
1. 进入 GitHub 仓库的 "Actions" 页面
2. 左侧选择 "Update Global Ranking"
3. 点击 "Run workflow" 按钮
4. 选择分支（通常是 main）
5. 点击绿色的 "Run workflow" 按钮
6. 等待工作流完成（约 30 秒）

**目的**：
- 验证 Actions 配置正确
- 初始化 `data/global-ranking.json` 文件

---

## ✅ 部署后验证

### 验证 1：本地测试

```bash
# 启动本地服务器
python -m http.server 8000

# 访问
http://localhost:8000
```

**检查项**：
- [ ] 主页面版本号显示为 1.3.1
- [ ] 打开计时器弹窗，能看到"是否使用了 E.G.O"复选框
- [ ] 计时少于 7200 秒时点击"上传全球榜"会提示"2小时"

### 验证 2：Issue 模板测试

1. 进入 GitHub 仓库 Issues 页面
2. 点击 "New issue"
3. 选择 "提交通关记录" 模板
4. 检查：
   - [ ] 说明文字显示"≥ 2小时（7200秒）"
   - [ ] 表单中有"是否使用了 E.G.O"复选框
   - [ ] 所有字段都正常显示

### 验证 3：Actions 工作流

1. 提交一条测试 Issue（可以填写假数据）
2. 观察 Actions 是否自动触发
3. 检查：
   - [ ] 工作流成功运行（绿色对勾）
   - [ ] `data/global-ranking.json` 文件被更新
   - [ ] Issue 被添加"已处理"标签

### 验证 4：在线功能测试

访问你的 GitHub Pages 地址，完整测试：
1. 完成罪人和人格抽取
2. 计时超过 7200 秒（或修改代码测试）
3. 勾选"是否使用了 E.G.O"
4. 点击"上传全球榜"
5. 检查确认弹窗是否显示 E.G.O 信息
6. 在 GitHub Issue 页面验证是否正确填充

---

## 🔍 数据结构变化

### 更新后的 JSON 数据结构

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
            "clearTime": 7500,
            "runDate": "2025-12-12",
            "comment": "首次通关",
            "usedEgo": true,           ← 新增字段
            "submittedAt": "2025-12-12T10:30:00Z",
            "issueNumber": 123
          }
        ]
      }
    }
  }
}
```

**新增字段说明**：
- `usedEgo` (boolean)：是否使用了 E.G.O
- 默认值：`false`
- 来源：GitHub Issue 表单中的复选框

---

## ⚠️ 常见问题和注意事项

### Q1：为什么提高到 2 小时？

**原因**：
1. 提高数据质量，减少无效记录
2. 防止刷榜行为
3. 2小时更符合实际游戏时长

### Q2：旧数据会受影响吗？

**答案**：不会

- 已存在的记录（< 7200秒）会保留在数据库中
- 但新提交的记录必须 ≥ 7200秒
- Actions 脚本只验证新提交的记录

### Q3：E.G.O 字段是必填的吗？

**答案**：否

- 这是一个可选的复选框
- 未勾选时默认为 `false`
- 不影响记录的有效性

### Q4：如何测试上传功能而不等待 2 小时？

**临时测试方法**（仅用于测试，上线前必须改回）：

在 `js/common.js` 第 238 行临时修改：

```javascript
// 测试模式：降低到 60 秒
if (seconds < 60) {
    setTimeout(() => window.Modal?.alert('很抱歉，只有通关时间≥ 1分钟的记录才能上传到全球排行榜。', '提示'), 100);
    return;
}
```

**⚠️ 重要**：测试完成后必须改回 `7200`！

### Q5：Actions 运行失败怎么办？

**检查清单**：
1. [ ] 权限是否设置为 "Read and write"
2. [ ] 标签是否已创建（"通关记录"、"已处理"）
3. [ ] 查看 Actions 日志获取详细错误
4. [ ] 确认 `scripts/generate-global-ranking.mjs` 文件存在且语法正确

---

## 📊 版本对比

| 项目 | v1.3.0 | v1.3.1 |
|------|--------|--------|
| 最低上传时间 | 3600秒 (1小时) | 7200秒 (2小时) |
| E.G.O 字段 | ❌ 无 | ✅ 有 |
| Issue 模板字段数 | 6 | 7 |
| 数据验证 | 基础验证 | 增强验证 |

---

## 🎯 部署检查清单

在部署到生产环境前，请确认：

### 代码配置
- [ ] `js/common.js` 中的 `repoOwner` 和 `repoName` 已修改
- [ ] 所有文件已提交到 Git
- [ ] 版本号已更新为 1.3.1

### GitHub 配置
- [ ] 已创建"通关记录"标签
- [ ] 已创建"已处理"标签
- [ ] Actions 权限设置为 "Read and write"
- [ ] GitHub Pages 已启用

### 功能测试
- [ ] 本地测试通过
- [ ] Issue 模板正常显示
- [ ] Actions 工作流成功运行
- [ ] 在线功能正常

### 文档更新
- [ ] README.md 已更新
- [ ] GLOBAL_RANKING_GUIDE.md 已更新
- [ ] 所有相关文档时间要求已更新为 2小时

---

## 📞 支持

如遇到问题，请：
1. 查看 GitHub Actions 日志
2. 检查浏览器控制台错误
3. 参考本文档的常见问题部分
4. 在 GitHub Issues 提问

---

**部署完成后，记得删除或移动本配置文档到文档目录。**

**祝部署顺利！** 🎉
