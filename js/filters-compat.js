/**
 * 过滤器兼容性层
 * 
 * 为了确保平滑过渡，这个文件提供了一个兼容接口。
 * 旧的 filters.js 的调用将通过这个层转发到 FilterController。
 * 这样可以让现有代码继续工作，同时逐步迁移到新架构。
 * 
 * @module FiltersCompat
 * @deprecated 此文件用于过渡，后续会被移除
 */

import { filterController } from './controllers/filterController.js';
import { appState } from './core/appState.js';
import { eventBus, GameEvents } from './core/eventBus.js';
import { logger } from './core/logger.js';

/**
 * 兼容层对象 - 保持与原Filters API相同的接口
 */
const Filters = {
    // 创建头像占位符（直接代理）
    createAvatarPlaceholder(sinner) {
        return filterController.createAvatarPlaceholder(sinner);
    },

    // 创建罪人筛选复选框（直接代理）
    createSinnerFilter() {
        return filterController.createSinnerFilter();
    },

    // 更新筛选后的罪人数据（直接代理，但同时更新window对象以兼容）
    updateFilteredSinnerData() {
        filterController.updateFilteredSinnerData();
        
        // 同步到window对象（为了兼容旧代码）
        const filtered = filterController.getFilteredSinners();
        window.filteredSinnerData = filtered;
        
        logger.debug('updateFilteredSinnerData: 同步到window.filteredSinnerData');
    },

    // 全选/全不选（代理到新方法）
    toggleAllCheckboxes(selectAll) {
        if (selectAll) {
            filterController.selectAllSinners();
        } else {
            filterController.deselectAllSinners();
        }
    },

    // 反选（代理到新方法）
    invertSelection() {
        filterController.invertSinnerSelection();
    },

    // 验证筛选设置（代理到新方法）
    validateFilterSettings() {
        return filterController.validateFilterSettings();
    },

    // 应用筛选设置（代理到新方法）
    applyFilters() {
        filterController.applyFilters();
    },

    // 检查是否有未保存的更改（代理到新方法）
    checkUnsavedChanges() {
        return filterController.checkUnsavedChanges();
    },

    // 当从设置页面返回主页面时，刷新滚动列表
    // 这个方法需要特殊处理，因为它依赖scrolls模块
    async refreshScrollsOnReturn() {
        try {
            logger.info('refreshScrollsOnReturn 调用 (来自兼容层)');
            
            // 动态导入scrolls模块（向后兼容）
            const scrollsModule = await import('./scrolls.js');
            const {
                createSinnerScrollList,
                createPersonaScrollList,
                resetPersonaScrollState,
                resetResultDisplay,
                highlightSelectedItem
            } = scrollsModule;
            
            // 获取当前过滤状态
            const filteredSinners = filterController.getFilteredSinners();
            const selectedSinnerEl = document.getElementById('selected-sinner');
            const selectedPersonaEl = document.getElementById('selected-persona');
            
            // 更新罪人列表
            createSinnerScrollList(filteredSinners);
            
            // 如果只有一个罪人，自动选中
            if (filteredSinners.length === 1) {
                resetPersonaScrollState();
                
                const sinner = filteredSinners[0];
                appState.setSinner(sinner);
                appState.setPersona(null);
                
                if (selectedSinnerEl) selectedSinnerEl.textContent = sinner.name;
                if (selectedPersonaEl) selectedPersonaEl.textContent = '未选择';
                
                // 高亮显示
                const sinnerScroll = document.getElementById('sinner-scroll');
                if (sinnerScroll) {
                    setTimeout(() => {
                        highlightSelectedItem(sinnerScroll, 0);
                    }, 100);
                }
                
                // 创建过滤后的人格列表
                const filteredPersonas = filterController.getFilteredPersonas(sinner);
                createPersonaScrollList(filteredPersonas);
            } else {
                // 多个罪人的情况
                const previousSinner = appState.getSinner();
                const previousSinnerStillExists = previousSinner &&
                    filteredSinners.some(s => s.id === previousSinner.id);
                
                if (previousSinnerStillExists) {
                    // 保留之前的选择
                    const sinner = filteredSinners.find(s => s.id === previousSinner.id);
                    appState.setSinner(sinner);
                    appState.setPersona(null);
                    
                    if (selectedSinnerEl) selectedSinnerEl.textContent = sinner.name;
                    if (selectedPersonaEl) selectedPersonaEl.textContent = '未选择';
                    
                    // 高亮显示
                    const sinnerScroll = document.getElementById('sinner-scroll');
                    if (sinnerScroll) {
                        const sinnerIndex = filteredSinners.findIndex(s => s.id === sinner.id);
                        setTimeout(() => {
                            highlightSelectedItem(sinnerScroll, sinnerIndex);
                        }, 100);
                    }
                    
                    // 更新人格列表
                    const filteredPersonas = filterController.getFilteredPersonas(sinner);
                    createPersonaScrollList(filteredPersonas);
                } else {
                    // 之前的罪人被移除
                    appState.setSinner(null);
                    appState.setPersona(null);
                    resetPersonaScrollState();
                    
                    if (selectedSinnerEl) selectedSinnerEl.textContent = '未选择';
                    if (selectedPersonaEl) selectedPersonaEl.textContent = '未选择';
                    
                    createPersonaScrollList(['请先选择罪人']);
                    resetResultDisplay();
                }
            }
            
            logger.info('refreshScrollsOnReturn 完成');
        } catch (error) {
            logger.error('refreshScrollsOnReturn 失败', error);
            throw error;
        }
    }
};

export default Filters;
