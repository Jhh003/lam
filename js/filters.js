import { Config } from '../data/config.js';

// 过滤模块
const Filters = {
    // 创建头像占位符
    createAvatarPlaceholder(sinner) {
        const placeholder = document.createElement('span');
        placeholder.className = 'filter-avatar-placeholder avatar-placeholder';
        placeholder.style.backgroundColor = sinner.color; // 动态颜色仍使用内联样式
        placeholder.textContent = '?';
        return placeholder;
    },

    // 创建罪人筛选复选框
    createSinnerFilter() {
        const filterContainer = document.getElementById('sinner-filter');
        filterContainer.innerHTML = '';
        
        import('../data/characters.js').then(({ sinnerData }) => {
            sinnerData.forEach(sinner => {
                const label = document.createElement('label');
                label.className = 'sinner-checkbox-label';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = sinner.id;
                checkbox.checked = true; // 默认全选
                checkbox.addEventListener('change', this.updateFilteredSinnerData);
                
                // 创建头像元素
                if (sinner.avatar) {
                    const avatarImg = document.createElement('img');
                    avatarImg.className = 'filter-avatar';
                    avatarImg.src = sinner.avatar;
                    avatarImg.alt = sinner.name;
                    avatarImg.onerror = function() {
                        // 如果图片加载失败，显示占位符
                        this.parentNode.replaceChild(this.createAvatarPlaceholder(sinner), this);
                    }.bind(this);
                    label.appendChild(checkbox);
                    label.appendChild(avatarImg);
                } else {
                    const placeholder = this.createAvatarPlaceholder(sinner);
                    label.appendChild(checkbox);
                    label.appendChild(placeholder);
                }
                
                label.appendChild(document.createTextNode(sinner.name));
                
                filterContainer.appendChild(label);
            });
            
            // 在创建完所有复选框后，手动调用updateFilteredSinnerData来初始化筛选数据
            this.updateFilteredSinnerData();
        });
    },

    // 更新筛选后的罪人数据
    updateFilteredSinnerData() {
        const checkboxes = document.querySelectorAll('#sinner-filter input[type="checkbox"]');
        const selectedIds = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => parseInt(cb.value));
        
        import('../data/characters.js').then(({ sinnerData }) => {
            const filteredSinnerData = sinnerData.filter(sinner => selectedIds.includes(sinner.id));
            
            // 只有当用户手动改变筛选设置时才检查是否需要禁用开始按钮
            // 在初始化时，我们应该允许转动，因为默认全选所有罪人
            const sinnerStartBtn = document.getElementById('sinner-start-btn');
            if (sinnerStartBtn) {
                // 只有当选中的罪人数量为0或1时才禁用开始按钮
                sinnerStartBtn.disabled = selectedIds.length === 0 || filteredSinnerData.length === 1;
            }
            
            // 更新全局状态
            window.filteredSinnerData = filteredSinnerData;
            
            // 如果原始筛选状态还没有被初始化，或者当前没有未保存的更改，就更新原始筛选状态
            // 这样可以确保在第一次初始化时使用正确的筛选数据
            if (!window.originalFilteredSinnerData || !window.hasUnsavedChanges) {
                window.originalFilteredSinnerData = [...filteredSinnerData];
                window.originalFilteredPersonalityData = JSON.parse(JSON.stringify(window.filteredPersonalityData || {}));
            }
            
            // 只有当checkboxes的数量大于0（即筛选界面已经渲染完成）时，才标记为有未保存的更改
            // 这可以避免在初始化时错误地标记为有更改
            if (checkboxes.length > 0) {
                window.hasUnsavedChanges = true;
            }
            
            // 如果当前在设置页面，更新人格设置显示
            const settingsPage = document.getElementById('settings-page');
            if (settingsPage && settingsPage.style.display !== 'none') {
                import('./settings.js').then(({ createPersonalitySettings }) => {
                    createPersonalitySettings();
                });
            }
        });
    },

    // 全选/全不选
    toggleAllCheckboxes(selectAll) {
        const checkboxes = document.querySelectorAll('#sinner-filter input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = selectAll);
        this.updateFilteredSinnerData();
    },

    // 反选
    invertSelection() {
        const checkboxes = document.querySelectorAll('#sinner-filter input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = !cb.checked);
        this.updateFilteredSinnerData();
    },

    // 验证筛选设置是否满足保底条件
    validateFilterSettings() {
        // 检查是否至少选择了一个罪人
        if (window.filteredSinnerData.length === 0) {
            alert('请至少选择一个罪人！');
            return false;
        }
        
        // 检查每个罪人是否至少选择了一个人格
        const sinnersWithoutPersonalities = [];
        for (const sinner of window.filteredSinnerData) {
            let hasPersonality = false;
            if (window.filteredPersonalityData[sinner.id]) {
                // 检查该罪人的人格对象中是否有值为true的人格
                hasPersonality = Object.values(window.filteredPersonalityData[sinner.id]).some(value => value === true);
            } else {
                // 如果没有为该罪人设置人格筛选（初始状态），则默认认为所有人格都被选择
                hasPersonality = true;
            }
            
            if (!hasPersonality) {
                sinnersWithoutPersonalities.push(sinner.name);
            }
        }
        
        if (sinnersWithoutPersonalities.length > 0) {
            alert(`请为以下罪人至少选择一个人格：\n${sinnersWithoutPersonalities.join('\n')}`);
            return false;
        }
        
        return true;
    },

    // 应用筛选设置
    applyFilters() {
        if (!this.validateFilterSettings()) {
            return;
        }
        
        // 保存当前筛选状态为原始状态
        window.originalFilteredSinnerData = [...window.filteredSinnerData];
        window.originalFilteredPersonalityData = JSON.parse(JSON.stringify(window.filteredPersonalityData));
        
        window.hasUnsavedChanges = false;
        
        // 切换到主页面
        const mainSelectorPage = document.getElementById('main-selector-page');
        const settingsPage = document.getElementById('settings-page');
        const mainPageBtn = document.getElementById('main-page-btn');
        const settingsPageBtn = document.getElementById('settings-page-btn');
        
        if (mainSelectorPage) mainSelectorPage.style.display = 'block';
        if (settingsPage) settingsPage.style.display = 'none';
        if (mainPageBtn) mainPageBtn.classList.add('active');
        if (settingsPageBtn) settingsPageBtn.classList.remove('active');
        
        // 更新主页面的滚动列表
        this.refreshScrollsOnReturn();
    },

    // 检查是否有未保存的更改
    checkUnsavedChanges() {
        if (window.hasUnsavedChanges) {
            return confirm('您有未保存的更改，确定要离开吗？');
        }
        return true;
    },

    // 当从设置页面返回主页面时，刷新滚动列表
    refreshScrollsOnReturn() {
        import('./scrolls.js').then(({ createSinnerScrollList, createPersonaScrollList }) => {
            // 更新罪人列表，传递完整的罪人对象数组
            createSinnerScrollList(window.filteredSinnerData);
            
            // 如果当前有选中的罪人，检查其是否仍在筛选列表中
            if (window.currentSelectedSinner) {
                const sinnerStillInList = window.filteredSinnerData.some(s => s.id === window.currentSelectedSinner.id);
                if (sinnerStillInList) {
                    // 更新人格列表
                    const filteredPersonalities = window.currentSelectedSinner.personalities.filter((persona, index) => {
                        return window.filteredPersonalityData[window.currentSelectedSinner.id] ? 
                               window.filteredPersonalityData[window.currentSelectedSinner.id][index] !== false : 
                               true;
                    });
                    createPersonaScrollList(filteredPersonalities);
                } else {
                    // 如果选中的罪人已不在列表中，重置选择
                    window.currentSelectedSinner = null;
                    window.currentSelectedPersona = null;
                    
                    const selectedSinnerEl = document.getElementById('selected-sinner');
                    const selectedPersonaEl = document.getElementById('selected-persona');
                    
                    if (selectedSinnerEl) selectedSinnerEl.textContent = '未选择';
                    if (selectedPersonaEl) selectedPersonaEl.textContent = '未选择';
                    
                    createPersonaScrollList(['请先选择罪人']);
                }
            } else {
                // 如果没有选中的罪人，显示提示
                createPersonaScrollList(['请先选择罪人']);
            }
        });
    }
};

export default Filters;