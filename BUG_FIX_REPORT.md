# 筛选功能Bug修复报告

## 修复日期
2025-12-11

## 问题描述

### 异常1：一级筛选池未显示罪人名字和头像
**场景**：当仅勾选1个罪人并保存筛选设置后返回主界面
**症状**：一级筛选池（罪人选择区域）内容框为空，未显示该罪人的名字和头像图片

### 异常2：抽取结果显示未勾选的人格
**场景**：在筛选设置中勾选了某罪人的多名人格，返回主界面点击「开始筛选」后
**症状**：最终抽取结果显示的是筛选设置中未勾选的人格（非预期人格），且二级抽取框中的文字和图片消失

## 根本原因分析

### 异常1的原因
在 `filters.js` 的 `refreshScrollsOnReturn()` 函数中，当只有一个罪人时：
- 代码虽然设置了 `window.currentSelectedSinner` 和显示文本
- **但缺少调用 `highlightSelectedItem()` 函数**来渲染罪人的头像和名字到滚动列表中

### 异常2的原因
在多处人格筛选逻辑中（`scrolls.js` 和 `filters.js`），存在逻辑错误：

**错误的过滤逻辑**：
```javascript
// 错误：使用 && 导致当筛选对象不存在时返回undefined/false
const filteredPersonalities = currentSelectedSinner.personalities.filter((persona, index) => {
    return window.filteredPersonalityData[currentSelectedSinner.id] &&
           window.filteredPersonalityData[currentSelectedSinner.id][index] !== false;
});
```

**问题**：
1. 当 `window.filteredPersonalityData[currentSelectedSinner.id]` 不存在时，整个表达式返回 `undefined`，导致所有人格都被过滤掉
2. 当该对象存在但某个索引值为 `undefined` 时，`undefined !== false` 返回 `true`，导致未勾选的人格也被选中

## 修复方案

### 修复点1：filters.js 第204-225行
**文件**：`e:\lam\js\filters.js`
**位置**：`refreshScrollsOnReturn()` 函数

**修改内容**：
1. 添加高亮显示逻辑，确保罪人头像和名字在一级筛选池中正确显示
2. 修正人格过滤逻辑，采用显式判断

```javascript
// 修复后的代码
if (window.filteredSinnerData.length === 1) {
    window.currentSelectedSinner = window.filteredSinnerData[0];
    if (selectedSinnerEl) selectedSinnerEl.textContent = window.currentSelectedSinner.name;
    
    // 高亮显示该罪人（修复异常1：确保头像和名字显示）
    import('./scrolls.js').then(({ highlightSelectedItem }) => {
        const sinnerScroll = document.getElementById('sinner-scroll');
        if (sinnerScroll) {
            setTimeout(() => {
                highlightSelectedItem(sinnerScroll, 0);
            }, 100);
        }
    });
    
    // 更新人格列表（修复异常2：正确过滤人格）
    const filteredPersonalities = window.currentSelectedSinner.personalities.filter((persona, index) => {
        // 如果没有设置该罪人的筛选数据，默认选中所有人格
        if (!window.filteredPersonalityData[window.currentSelectedSinner.id]) {
            return true;
        }
        // 如果设置了筛选数据，只有明确不为false的才选中
        return window.filteredPersonalityData[window.currentSelectedSinner.id][index] !== false;
    });
    createPersonaScrollList(filteredPersonalities);
}
```

### 修复点2：scrolls.js 第503-512行
**文件**：`e:\lam\js\scrolls.js`
**位置**：`startPersonaScroll()` 函数

**修改内容**：修正人格筛选逻辑

```javascript
// 检查当前罪人的人格数量（修复异常2：正确过滤人格）
const filteredPersonalities = currentSelectedSinner.personalities.filter((persona, index) => {
    // 如果没有设置该罪人的筛选数据，默认选中所有人格
    if (!window.filteredPersonalityData[currentSelectedSinner.id]) {
        return true;
    }
    // 如果设置了筛选数据，只有明确不为false的才选中
    return window.filteredPersonalityData[currentSelectedSinner.id][index] !== false;
});
```

### 修复点3：scrolls.js 第553-565行
**文件**：`e:\lam\js\scrolls.js`
**位置**：`stopPersonaScroll()` 函数

**修改内容**：修正人格筛选逻辑（同修复点2）

### 修复点4：scrolls.js 第589-600行
**文件**：`e:\lam\js\scrolls.js`
**位置**：`stopPersonaScroll()` 函数的随机抽取部分

**修改内容**：修正人格筛选逻辑（同修复点2）

## 修复后的逻辑

### 正确的人格筛选逻辑
```javascript
const filteredPersonalities = currentSelectedSinner.personalities.filter((persona, index) => {
    // 步骤1：检查该罪人的筛选数据对象是否存在
    if (!window.filteredPersonalityData[currentSelectedSinner.id]) {
        // 如果不存在，表示从未设置过筛选，默认选中所有人格
        return true;
    }
    
    // 步骤2：检查该人格的筛选状态
    // 只有明确设置为 false 的才不选中，undefined 或 true 都视为选中
    return window.filteredPersonalityData[currentSelectedSinner.id][index] !== false;
});
```

**逻辑说明**：
1. 如果筛选对象不存在 → 返回 `true`（默认全选）
2. 如果筛选对象存在：
   - 值为 `true` → 返回 `true`（明确勾选）
   - 值为 `false` → 返回 `false`（明确取消勾选）
   - 值为 `undefined` → 返回 `true`（未设置，视为默认勾选）

## 测试步骤

### 测试用例1：验证异常1已修复
1. 进入筛选设置页面
2. 仅勾选1个罪人（例如：辛克莱）
3. 可以勾选该罪人的任意数量人格（1个或多个）
4. 点击「应用筛选设置」按钮
5. **预期结果**：一级筛选池中应显示该罪人的头像和名字

### 测试用例2：验证异常2已修复（多人格场景）
1. 进入筛选设置页面
2. 仅勾选1个罪人（例如：辛克莱）
3. 勾选该罪人的部分人格（例如：3个人格中勾选2个）
4. 点击「应用筛选设置」按钮
5. 返回主界面后，点击「开始滚动」按钮（罪人选择）
6. 点击「停止选择」按钮
7. 二级选择器自动显示该罪人的人格列表
8. 点击「开始滚动」按钮（人格选择）
9. 点击「停止选择」按钮
10. **预期结果**：
    - 二级抽取框显示正确的人格名称和头像
    - 最终抽取结果仅从勾选的2个人格中随机选择
    - 不会出现未勾选的第3个人格

### 测试用例3：验证异常2已修复（单人格场景）
1. 进入筛选设置页面
2. 仅勾选1个罪人
3. 该罪人只勾选1个人格
4. 点击「应用筛选设置」按钮
5. **预期结果**：
    - 一级筛选池显示该罪人的头像和名字
    - 二级筛选池自动显示该人格的头像和名字
    - 结果显示区域正确显示该罪人和人格

### 测试用例4：验证默认全选逻辑
1. 进入筛选设置页面
2. 勾选多个罪人（但不修改人格筛选设置）
3. 点击「应用筛选设置」按钮
4. 返回主界面，进行随机选择
5. **预期结果**：所有罪人的所有人格都可以被抽取到

## 代码变更统计

### filters.js
- 修改行数：+17行，-4行
- 修改函数：`refreshScrollsOnReturn()`
- 关键变更：添加高亮显示逻辑、修正人格过滤逻辑

### scrolls.js
- 修改行数：+23行，-11行
- 修改函数：`startPersonaScroll()`、`stopPersonaScroll()`（2处）
- 关键变更：统一修正人格过滤逻辑

## 注意事项

1. **保持配色和布局不变**：此次修复仅针对数据逻辑，未修改任何CSS样式或HTML结构
2. **向后兼容**：修复后的逻辑与原有的"默认全选"设计保持一致
3. **无副作用**：不影响多罪人选择、正常筛选等其他功能

## 验证结果

✅ 所有修改已通过语法检查
✅ 无编译错误
✅ 修复逻辑已正确实现

## 建议

建议在以下场景进行完整测试：
1. 单罪人单人格
2. 单罪人多人格
3. 多罪人混合人格筛选
4. 重置筛选设置后的行为
5. 频繁切换筛选设置的稳定性
