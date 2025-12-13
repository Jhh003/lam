# 全球排行榜实时更新技术分析

## 📋 文档概述

本文档分析了当前全球排行榜功能的实现方式及其局限性，并提出了可行的改进方案，以实现近实时的排行榜更新。

## 🔍 现有实现方式分析

### 当前架构

```
用户提交记录 → GitHub Issue → GitHub Actions 触发 → 数据聚合脚本 → 更新 JSON → GitHub Pages 重新部署
```

### 触发机制

当前 GitHub Actions 工作流 (`update-global-ranking.yml`) 在以下情况下触发：

1. **定时任务**：每天凌晨4点（UTC）自动运行
2. **手动触发**：通过 `workflow_dispatch` 手动运行
3. **Issue 事件**：当 Issue 被创建或添加标签时触发（需包含"通关记录"标签）

### 数据流程

1. 用户通过 GitHub Issue 表单提交通关记录
2. Issue 自动添加"通关记录"和"待处理"标签
3. GitHub Actions 被触发，运行数据聚合脚本
4. 脚本从 GitHub Issues API 获取所有带"通关记录"标签的 Issue
5. 解析 Issue 内容，验证数据有效性
6. 更新 `data/global-ranking.json` 和 `data/global-floor-ranking.json` 文件
7. 提交变更到仓库，GitHub Pages 自动重新部署

## ⚠️ 现有实现的局限性

### 1. 延迟问题

| 环节 | 预估延迟 |
|------|----------|
| Issue 创建到 Actions 触发 | 约 30 秒 |
| Actions 运行 | 约 1-2 分钟 |
| GitHub Pages 重新部署 | 约 1-2 分钟 |
| **总延迟** | **约 3-5 分钟** |

### 2. 数据验证问题

- 当前实现在 Issue 创建时就触发数据聚合，但此时记录可能尚未经过人工审核
- 可能导致无效或虚假数据被添加到排行榜

### 3. 并发问题

- 多个 Issue 同时创建时可能触发多个 Actions 实例
- 存在数据覆盖的风险

### 4. 文件提交不完整

- 当前工作流只提交 `global-ranking.json`，遗漏了 `global-floor-ranking.json`

### 5. 无法实现真正的实时更新

- 静态网站无法实现 WebSocket 或服务器推送
- 用户需要手动刷新页面才能看到最新数据

## 💡 改进方案

### 方案一：优化现有 GitHub Actions 工作流（推荐）

这是最小改动、保持静态网站特性的方案。

#### 改进内容：

1. **基于审核标签触发**
   - 增加"已审核"标签作为触发条件
   - 只有当管理员审核通过并添加"已审核"标签后才触发数据更新
   - 提高数据质量，避免虚假记录

2. **添加并发控制**
   ```yaml
   concurrency:
     group: update-ranking
     cancel-in-progress: false
   ```
   - 确保同一时间只有一个工作流实例运行
   - 后续触发的工作流会排队等待

3. **修复文件提交**
   - 同时提交 `global-ranking.json` 和 `global-floor-ranking.json`

4. **优化脚本处理逻辑**
   - 只处理已审核的 Issue
   - 处理完成后移除"已审核"标签，添加"已处理"标签

#### 预期效果：

- 延迟：约 3-5 分钟（审核后）
- 数据质量：高（经过人工审核）
- 实现难度：低
- 维护成本：低

### 方案二：引入外部数据库服务

使用 Supabase、Firebase 或其他 BaaS（Backend as a Service）服务。

#### 架构：

```
用户提交记录 → GitHub Issue → Webhook → 云函数 → 数据库 → 前端实时查询
```

#### 优点：

- 可实现真正的实时更新
- 支持更复杂的查询和筛选
- 可实现 WebSocket 实时推送

#### 缺点：

- 需要引入外部服务依赖
- 可能产生额外费用
- 增加维护复杂度
- 偏离静态网站的初衷

### 方案三：使用 GitHub API 直接读取 Issues

前端直接调用 GitHub API 获取排行榜数据，不再依赖 JSON 文件。

#### 架构：

```
前端页面 → GitHub Issues API → 实时显示数据
```

#### 优点：

- 真正实时的数据
- 不需要 GitHub Actions
- 简化数据流程

#### 缺点：

- GitHub API 有速率限制（未认证：60次/小时，认证：5000次/小时）
- 需要在前端处理数据解析和排序
- 用户体验可能受 API 响应时间影响
- 每次访问都需要发起 API 请求，性能较差

### 方案四：混合方案（缓存 + 实时查询）

结合方案一和方案三的优点。

#### 架构：

```
默认加载 JSON 缓存 → 后台检查更新 → 有新数据时提示用户刷新
```

#### 实现：

1. 页面加载时先显示 JSON 文件中的缓存数据
2. 后台调用 GitHub API 检查是否有新的已审核 Issue
3. 如有更新，显示"有新记录，点击刷新"的提示
4. 用户可选择手动刷新或等待下次 Actions 更新

## ✅ 推荐实施方案

基于项目的静态网站特性和现有架构，**推荐方案一**作为首选改进方案。

### 实施步骤：

1. **更新 GitHub Actions 工作流**
   - 添加"已审核"标签作为 Issue 触发条件
   - 添加并发控制
   - 修复文件提交，包含所有 JSON 文件

2. **更新数据聚合脚本**
   - 只处理带有"已审核"标签的 Issue
   - 处理后更新标签状态

3. **创建管理员审核流程**
   - 管理员审核 Issue 内容
   - 添加"已审核"标签触发数据更新

4. **（可选）实施混合方案**
   - 添加前端 API 检查功能
   - 提供更新提示

### 更新后的工作流程：

```
用户提交 Issue → 自动添加"通关记录"+"待处理" → 管理员审核 → 添加"已审核"标签 
  → Actions 触发 → 数据更新 → 移除"已审核"，添加"已处理" → GitHub Pages 部署
```

## 📊 方案对比

| 方案 | 延迟 | 数据质量 | 实现难度 | 维护成本 | 符合静态网站特性 |
|------|------|----------|----------|----------|------------------|
| 方案一：优化 Actions | 3-5 分钟 | 高 | 低 | 低 | ✅ 是 |
| 方案二：外部数据库 | 实时 | 中 | 高 | 高 | ❌ 否 |
| 方案三：直接 API | 实时 | 低 | 中 | 中 | ✅ 是 |
| 方案四：混合方案 | 可选 | 高 | 中 | 中 | ✅ 是 |

## 🔧 技术实现细节

### 更新后的 GitHub Actions 工作流

```yaml
name: Update Global Ranking

on:
  schedule:
    - cron: '0 4 * * *'
  workflow_dispatch:
  issues:
    types: [opened, labeled]

concurrency:
  group: update-ranking
  cancel-in-progress: false

jobs:
  update-ranking:
    runs-on: ubuntu-latest
    if: |
      github.event_name == 'schedule' || 
      github.event_name == 'workflow_dispatch' || 
      (github.event_name == 'issues' && 
       (contains(github.event.issue.labels.*.name, '通关记录') || 
        contains(github.event.issue.labels.*.name, '已审核')))
    
    steps:
      # ... 详见实际工作流文件
```

## 📝 结论

通过优化现有 GitHub Actions 工作流（方案一），可以在保持静态网站特性的同时，实现近实时的排行榜更新（审核后 3-5 分钟内更新）。这个方案具有以下优势：

1. **最小改动**：只需修改工作流配置和脚本
2. **数据质量保证**：引入人工审核环节
3. **成本为零**：完全使用 GitHub 免费功能
4. **易于维护**：保持简单的架构

对于需要真正实时更新的场景，可以在未来考虑实施方案四（混合方案），在不改变核心架构的前提下提供更好的用户体验。

---

*文档创建日期：2024-12-12*
*版本：1.0.0*
