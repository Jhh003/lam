# 人格数据管理模块技术文档

## 📋 概述

本文档说明人格数据管理模块的设计、实现及使用方法。该模块解决了以下核心问题：

1. **人格名称不一致问题**：Issue 模板中的人格名称与 `characters.js` 中的名称存在差异
2. **头像查找失败问题**：排行榜页面无法正确显示部分人格头像
3. **数据维护困难问题**：新增人格需要修改多处代码

## 🔧 模块结构

```
data/
├── characters.js        # 罪人和人格基础数据
├── personaManager.js    # 人格数据管理模块 (新增)
├── config.js            # 配置常量
└── utils/
    └── helpers.js       # 工具函数
```

## 📁 核心文件说明

### personaManager.js

**位置：** `data/personaManager.js`

**功能：**
- 人格名称映射：将 Issue 模板名称转换为标准名称
- 头像查找：支持模糊匹配的头像路径查找
- 数据验证：检查人格是否有效

**导出内容：**

```javascript
// 人格名称映射表
export const PERSONA_NAME_MAPPING = { ... };

// 人格管理器类
export class PersonaManager {
    static normalizePersonaName(sinnerId, personaName);
    static findPersonaAvatar(sinnerId, personaName);
    static getSinnerById(sinnerId);
    static getPersonasBySinnerId(sinnerId);
    static isValidPersona(sinnerId, personaName);
    static getAllSinners();
    static getPersonaNameMapping();
}

// 便捷函数（绑定到类方法）
export const findPersonaAvatar;
export const normalizePersonaName;
export const getSinnerById;
export const getPersonasBySinnerId;
export const isValidPersona;
```

## 🔄 人格名称映射机制

### 问题背景

Issue 模板中，为避免同名人格冲突（如多个罪人都有"LCB罪人"人格），采用了添加后缀的方式：

| Issue 模板名称 | characters.js 名称 |
|---------------|-------------------|
| `LCB罪人(浮士德)` | `LCB罪人` |
| `六协会南部4科(以实玛利)` | `六协会南部4科` |
| `黑云会若众(鸿璐)` | `黑云会若众` |

### 解决方案

`PERSONA_NAME_MAPPING` 对象存储所有需要映射的人格名称：

```javascript
export const PERSONA_NAME_MAPPING = {
    // 罪人ID: { "Issue名称": "标准名称" }
    8: {  // 以实玛利
        '六协会南部4科(以实玛利)': '六协会南部4科',
        'LCB罪人(以实玛利)': 'LCB罪人',
        // ...
    },
    // ...
};
```

### 映射逻辑

```javascript
static normalizePersonaName(sinnerId, personaName) {
    // 1. 检查映射表
    const mapping = PERSONA_NAME_MAPPING[sinnerId];
    if (mapping && mapping[personaName]) {
        return mapping[personaName];
    }
    
    // 2. 兜底：尝试去除括号后缀
    const match = personaName.match(/^(.+?)\([^)]+\)$/);
    if (match) return match[1];
    
    // 3. 返回原名称
    return personaName;
}
```

## 📝 新增人格的标准操作流程

### 步骤 1：更新 characters.js

在对应罪人的 `personalities` 数组中添加新人格：

```javascript
// data/characters.js
{
    id: 8,
    name: "以实玛利 (Ishmael)",
    personalities: [
        // ... 现有人格 ...
        { name: "新人格名称", avatar: "assets/images/Ishmael/Ishmael-new.webp" }
    ]
}
```

### 步骤 2：添加头像文件

将头像图片放入对应目录：

```
assets/images/Ishmael/Ishmael-new.webp
```

**命名规范：**
- 格式：`{罪人英文名}-{标识}.webp` 或 `.jpg`
- 示例：`Yi_Sang-W3.webp`, `Faust-LCB.jpg`

### 步骤 3：更新 Issue 模板

编辑 `.github/ISSUE_TEMPLATE/submit-clear-run.yml` 和 `submit-floor-only.yml`：

```yaml
- type: dropdown
  id: persona-name
  attributes:
    label: 人格名称
    options:
      # ... 现有选项 ...
      - 新人格名称  # 或 新人格名称(罪人名)
```

### 步骤 4：更新人格名称映射（如需要）

如果 Issue 模板中使用了带后缀的名称，需要更新 `personaManager.js`：

```javascript
// data/personaManager.js
export const PERSONA_NAME_MAPPING = {
    8: {  // 以实玛利
        // ... 现有映射 ...
        '新人格名称(以实玛利)': '新人格名称'
    }
};
```

### 步骤 5：验证

1. 本地启动服务：`python -m http.server 8000`
2. 访问排行榜页面
3. 确认新人格头像正确显示

## 🎯 使用示例

### 在排行榜页面中使用

```javascript
// ranking.html
import { PersonaManager } from './data/personaManager.js';

// 查找人格头像
const avatar = PersonaManager.findPersonaAvatar(8, '六协会南部4科(以实玛利)');
// 返回: "assets/images/Ishmael/Ishmael-6.webp"

// 标准化人格名称
const name = PersonaManager.normalizePersonaName(8, '六协会南部4科(以实玛利)');
// 返回: "六协会南部4科"

// 验证人格是否有效
const valid = PersonaManager.isValidPersona(8, '六协会南部4科');
// 返回: true
```

### 在其他模块中使用

```javascript
import { findPersonaAvatar, getSinnerById } from './data/personaManager.js';

// 直接使用导出的函数
const avatar = findPersonaAvatar(sinnerId, personaName);
const sinner = getSinnerById(sinnerId);
```

## 🔍 头像显示异常排查

### 常见原因

1. **人格名称不匹配**
   - 症状：Issue 模板名称与 characters.js 不一致
   - 解决：更新 PERSONA_NAME_MAPPING

2. **头像文件缺失**
   - 症状：控制台显示 404 错误
   - 解决：添加对应的头像文件

3. **路径配置错误**
   - 症状：路径有多余空格或拼写错误
   - 解决：检查并修正 characters.js 中的 avatar 路径

4. **文件名大小写问题**
   - 症状：本地正常，线上 404
   - 解决：确保文件名大小写与配置一致

### 排查步骤

1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 查看是否有图片加载失败的 404 错误
4. 检查 Network 标签中图片请求的实际路径
5. 对比 characters.js 中的配置

## 📊 数据结构参考

### sinnerData 结构

```javascript
[
    {
        id: 1,                    // 罪人ID (1-12)
        name: "李箱 (Yi Sang)",   // 罪人名称
        avatar: "assets/...",     // 罪人默认头像
        color: '#9370DB',         // 主题色
        personalities: [          // 人格列表
            {
                name: "W公司3级清扫人员",           // 人格名称
                avatar: "assets/images/.../..."    // 人格头像路径
            }
        ]
    }
]
```

### PERSONA_NAME_MAPPING 结构

```javascript
{
    1: {},      // 李箱 - 无需映射
    2: {        // 浮士德
        'Issue名称': '标准名称'
    },
    // ... 其他罪人
}
```

## 🔒 注意事项

1. **保持数据一致性**
   - characters.js 是数据源
   - Issue 模板、personaManager.js 需与其保持同步

2. **映射表维护**
   - 只有 Issue 模板名称与 characters.js 不同时才需要映射
   - 相同名称无需添加映射

3. **向后兼容**
   - 新增映射不会影响已有功能
   - 修改映射需要注意历史数据

## 📚 相关文档

- [全球排行榜功能使用指南](../../GLOBAL_RANKING_GUIDE.md)
- [排行榜数据管理指南](../guides/RANKING_MANAGEMENT_GUIDE.md)
- [项目快速入门](../../QUICK_START.md)

---

*最后更新：2025-12-13*
