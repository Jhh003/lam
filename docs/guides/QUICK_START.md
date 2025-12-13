# 快速开始指南 - 全球联网排行榜

## 🚀 立即部署（5分钟）

### 步骤 1：配置仓库信息

打开 `js/common.js`，找到第274-275行，修改为你的实际信息：

```javascript
const repoOwner = 'your-github-username'; // 改成你的 GitHub 用户名
const repoName = 'lam'; // 改成你的仓库名（如果你修改了仓库名）
```

### 步骤 2：创建 GitHub 标签

1. 进入你的 GitHub 仓库
2. 点击 "Issues" → "Labels"
3. 点击 "New label"
4. 创建两个标签：
   - 名称：`通关记录`，颜色：随意（建议蓝色）
   - 名称：`已处理`，颜色：随意（建议绿色）

### 步骤 3：配置 GitHub Actions 权限

1. Settings → Actions → General
2. 找到 "Workflow permissions"
3. 选择 **"Read and write permissions"**
4. 点击 Save

### 步骤 4：启用 GitHub Pages（如果还没有）

1. Settings → Pages
2. Source 选择：Deploy from a branch
3. Branch 选择：main（或 master）
4. Folder 选择：/ (root)
5. 点击 Save

### 步骤 5：提交代码

```bash
git add .
git commit -m "feat: 添加全球联网排行榜功能 v1.3.0"
git push origin main
```

### 步骤 6：手动触发首次数据聚合

1. 进入 GitHub 仓库的 Actions 页面
2. 点击左侧的 "Update Global Ranking"
3. 点击 "Run workflow" → "Run workflow"
4. 等待工作流完成（约30秒）

---

## ✅ 验证部署

### 本地测试

```bash
# 启动本地服务器
python -m http.server 8000

# 或使用 Node.js
npx http-server -p 8000
```

访问 `http://localhost:8000`，检查：

- [ ] 主页面显示"排行榜"按钮
- [ ] 点击后能跳转到排行榜页面
- [ ] 排行榜有两个标签页："部门记录（本地）"和"都市广播（联网）"
- [ ] 计时器弹窗有"上传全球榜"按钮

### 在线测试

访问你的 GitHub Pages 地址（如 `https://your-username.github.io/lam/`），进行相同测试。

---

## 📝 提交第一条测试记录

### 方式 1：通过应用界面（推荐）

1. 在主页面完成罪人和人格抽取
2. 打开计时器，计时至少 3600 秒（可以手动修改代码跳过这个限制进行测试）
3. 点击"上传全球榜"
4. 在弹出的 GitHub 页面填写并提交 Issue

### 方式 2：直接创建 Issue

1. 进入 GitHub 仓库的 Issues 页面
2. 点击 "New issue"
3. 选择 "提交通关记录" 模板
4. 填写表单：
   - 罪人ID：1-12 之间的数字
   - 罪人名称：如"罗佳 (Rodion)"
   - 人格名称：如"脑叶公司E.G.O:泪锋之剑"
   - 通关时间（秒）：必须 ≥ 3600
   - 通关日期：如"2025-12-12"
   - 备注：可选
5. 点击 "Submit new issue"

### 触发数据更新

提交 Issue 后，GitHub Actions 应该会自动运行。如果没有，手动触发：

1. Actions → Update Global Ranking
2. Run workflow

### 查看结果

1. 等待 Actions 完成
2. 刷新应用页面
3. 切换到"都市广播（联网）"标签页
4. 应该能看到刚才提交的记录

---

## 🔧 测试用代码修改（仅用于测试！）

如果你想快速测试上传功能而不等待3600秒，可以临时修改代码：

### 修改 `js/common.js` 第241行附近

找到这段代码：

```javascript
// 2. 验证时间是否达到1小时
if (seconds < 3600) {
    setTimeout(() => window.Modal?.alert('很抱歉，只有通关时间≥ 1小时（3600秒）的记录才能上传到全球排行榜。', '提示'), 100);
    return;
}
```

临时改为（**测试后记得改回来！**）：

```javascript
// 2. 验证时间是否达到1小时（测试模式：降低到60秒）
if (seconds < 60) {
    setTimeout(() => window.Modal?.alert('很抱歉，只有通关时间≥ 1分钟的记录才能上传到全球排行榜。', '提示'), 100);
    return;
}
```

这样你只需要计时60秒就可以测试上传功能了。

**⚠️ 重要**：测试完成后记得改回 `3600`！

---

## 🎮 开始使用

部署完成后，你的用户可以：

1. **查看排行榜**：点击主页面的"排行榜"按钮
2. **保存本地记录**：完成计时后点击"保存到本地"
3. **上传全球榜**：通关时间≥1小时的记录可以点击"上传全球榜"

详细使用说明请查看 [GLOBAL_RANKING_GUIDE.md](GLOBAL_RANKING_GUIDE.md)

---

## ❓ 遇到问题？

### 问题 1：Actions 运行失败

**检查**：
- [ ] 权限是否设置为 "Read and write"
- [ ] 是否有 GITHUB_TOKEN（自动提供）
- [ ] 查看 Actions 日志获取详细错误

### 问题 2：联网排行榜显示"加载失败"

**检查**：
- [ ] `data/global-ranking.json` 文件是否存在
- [ ] 文件格式是否正确（JSON有效）
- [ ] GitHub Pages 是否已部署

### 问题 3：上传按钮点击后没反应

**检查**：
- [ ] `js/common.js` 中的 `repoOwner` 和 `repoName` 是否正确
- [ ] 浏览器控制台是否有错误信息
- [ ] 是否已选择罪人和人格

### 问题 4：Issue 提交后榜单没更新

**检查**：
- [ ] Issue 是否有"通关记录"标签
- [ ] Actions 是否成功运行
- [ ] 数据是否符合要求（时间≥3600秒）
- [ ] 刷新页面试试

---

## 📚 更多资源

- [完整使用指南](GLOBAL_RANKING_GUIDE.md)
- [测试清单](TEST_CHECKLIST.md)
- [实施总结](IMPLEMENTATION_SUMMARY.md)
- [README](README.md)

---

**祝你部署顺利！** 🎉

如有问题，欢迎在 GitHub Issues 提问。
