# LAM (边狱公司 - 今天蛋筒什么？) 文档中心

## 📚 文档目录

本文件夹包含项目的所有技术文档和使用指南，按用途分类组织。

### 📖 用户指南 (`guides/`)

面向普通用户的操作指南和说明文档。

| 文档 | 描述 |
|------|------|
| [全球排行榜使用指南](guides/GLOBAL_RANKING_GUIDE.md) | 如何上传通关记录到全球排行榜，功能说明和常见问题 |
| [快速开始指南](guides/QUICK_START.md) | 5分钟快速部署指南，必要配置步骤 |
| [排行榜管理指南](guides/RANKING_MANAGEMENT_GUIDE.md) | 管理员操作手册，审核流程和标签管理 |

### 🔧 技术文档 (`technical/`)

面向开发者的技术实现文档。

| 文档 | 描述 |
|------|------|
| [实时排行榜技术分析](technical/REALTIME_RANKING_ANALYSIS.md) | 近实时更新机制分析，多种实现方案对比 |
| [层数排行榜功能](technical/FLOOR_RANKING_FEATURE.md) | 成功单通层数排行榜完整设计和实现细节 |
| [上传功能 v1.5.0](technical/UPLOAD_FEATURE_V1.5.0.md) | 上传界面重构说明，完整记录与简化记录两种上传类型 |
| [优化指南](technical/OPTIMIZATION_GUIDE.md) | 代码优化建议和最佳实践，性能优化策略 |
| [人格数据模块](technical/PERSONA_DATA_MODULE.md) | 人格数据管理架构说明和数据扩展指南 |

### 💻 开发文档 (`development/`)

项目开发相关的规范和流程文档。

| 文档 | 描述 |
|------|------|
| [筛选功能Bug修复报告](development/BUG_FIX_REPORT.md) | 筛选功能异常问题分析、根本原因和修复方案 |
| [上传按钮调试修复](development/DEBUG_UPLOAD_BTN_FIX.md) | 上传按钮不显示问题诊断和模态窗口CSS修复过程 |
| [全球排行榜功能实施总结](development/IMPLEMENTATION_SUMMARY.md) | v1.3.0 全球排行榜功能完整实施总结 |

### 🚀 部署文档 (`deployment/`)

部署、配置和测试相关文档。

| 文档 | 描述 |
|------|------|
| [部署清单 v1.4.0](deployment/DEPLOYMENT_CHECKLIST_V1.4.0.md) | v1.4.0 版本部署步骤清单和验证步骤 |
| [部署配置 v1.3.1](deployment/DEPLOYMENT_CONFIG_V1.3.1.md) | v1.3.1 版本部署配置说明和环境设置 |
| [测试清单](deployment/TEST_CHECKLIST.md) | 完整的功能测试清单和测试场景 |

---

## 📋 根目录文档索引

以下是仓库根目录中的核心文档：

| 文档 | 描述 |
|------|------|
| [README.md](../README.md) | 项目介绍、功能特点和更新日志 |
| [package.json](../package.json) | 项目元信息和依赖配置 |

---

## 📝 文档维护指南

### 添加新文档

1. 确定文档类别（guides/technical/development）
2. 在对应目录创建 `.md` 文件
3. 更新本索引文件
4. 提交变更

### 文档命名规范

- 使用大写字母和下划线：`DOCUMENT_NAME.md`
- 名称应清晰反映文档内容
- 英文命名，内容可以是中文

### 文档格式规范

- 使用 Markdown 格式
- 包含清晰的标题层级
- 包含目录（长文档）
- 包含最后更新日期
- 代码示例使用代码块

---

*最后更新：2025-12-13*
