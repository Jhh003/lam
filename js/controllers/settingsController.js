/**
 * SettingsController - 设置管理控制�?
 * 负责人格设置、偏好设置等的管理和持久�?
 * 
 * 架构�?
 * - 依赖注入：appState, eventBus, logger
 * - 状态管理：通过appState管理所有设�?
 * - 事件驱动：通过eventBus与其他模块通信
 * - 零全局变量：不使用window.*
 * 
 * 主要责任�?
 * - 管理人格过滤设置
 * - 提供批量操作（全选、全不选、反选）
 * - 持久化设置到localStorage
 * - 验证设置状�?
 */

import { sinnerData } from '../../data/characters.js';

export class SettingsController {
    constructor(appState, eventBus, logger) {
        this.appState = appState;
        this.eventBus = eventBus;
        this.logger = logger;
        
        // DOM元素（延迟初始化�?
        this.settingsContainer = null;
        
        this.logger.debug('SettingsController已初始化');
    }
    
    /**
     * 初始化SettingsController
     * @param {Object} domElements - 包含必需DOM元素的对�?
     */
    initDOM(domElements) {
        try {
            this.settingsContainer = domElements.settingsContainer || 
                                     document.getElementById('personality-settings-container');
            
            this.logger.debug('SettingsController DOM初始化完�?);
        } catch (error) {
            this.logger.error('SettingsController DOM初始化失�?, error);
            throw error;
        }
    }
    
    /**
     * 更新人格过滤状�?
     * @param {number} sinnerId - 罪人ID
     * @param {number} personaIndex - 人格索引
     * @param {boolean} isChecked - 是否启用
     */
    updatePersonalityFilter(sinnerId, personaIndex, isChecked) {
        try {
            const filters = this.appState.get('filters.personalities') || new Map();
            
            if (!filters.has(sinnerId)) {
                filters.set(sinnerId, new Map());
            }
            
            filters.get(sinnerId).set(personaIndex, isChecked);
            this.appState.set('filters.personalities', filters);
            
            // 发出事件
            this.eventBus.emit('PERSONALITY_FILTER_CHANGED', {
                sinnerId,
                personaIndex,
                isChecked
            });
            
            this.logger.debug(`人格过滤已更�? sinnerId=${sinnerId}, personaIndex=${personaIndex}, isChecked=${isChecked}`);
        } catch (error) {
            this.logger.error('更新人格过滤失败', error);
            throw error;
        }
    }
    
    /**
     * 全选所有人�?
     */
    selectAllPersonalities() {
        try {
            const filters = new Map();
            
            sinnerData.forEach(sinner => {
                const sinnerFilters = new Map();
                sinner.personalities.forEach((_, index) => {
                    sinnerFilters.set(index, true);
                });
                filters.set(sinner.id, sinnerFilters);
            });
            
            this.appState.set('filters.personalities', filters);
            
            // 更新UI
            this.updateUICheckboxes(filters);
            
            // 发出事件
            this.eventBus.emit('PERSONALITIES_SELECTED_ALL', { count: this.getTotalPersonalities() });
            
            this.logger.debug('已全选所有人�?);
        } catch (error) {
            this.logger.error('全选人格失�?, error);
            throw error;
        }
    }
    
    /**
     * 取消选择所有人�?
     */
    deselectAllPersonalities() {
        try {
            const filters = new Map();
            
            sinnerData.forEach(sinner => {
                const sinnerFilters = new Map();
                sinner.personalities.forEach((_, index) => {
                    sinnerFilters.set(index, false);
                });
                filters.set(sinner.id, sinnerFilters);
            });
            
            this.appState.set('filters.personalities', filters);
            
            // 更新UI
            this.updateUICheckboxes(filters);
            
            // 发出事件
            this.eventBus.emit('PERSONALITIES_DESELECTED_ALL', {});
            
            this.logger.debug('已取消选择所有人�?);
        } catch (error) {
            this.logger.error('取消选择人格失败', error);
            throw error;
        }
    }
    
    /**
     * 反选所有人�?
     */
    invertAllPersonalities() {
        try {
            const currentFilters = this.appState.get('filters.personalities') || new Map();
            const filters = new Map();
            
            sinnerData.forEach(sinner => {
                const sinnerFilters = new Map();
                sinner.personalities.forEach((_, index) => {
                    const currentValue = currentFilters.get(sinner.id)?.get(index) ?? true;
                    sinnerFilters.set(index, !currentValue);
                });
                filters.set(sinner.id, sinnerFilters);
            });
            
            this.appState.set('filters.personalities', filters);
            
            // 更新UI
            this.updateUICheckboxes(filters);
            
            // 发出事件
            this.eventBus.emit('PERSONALITIES_INVERTED', {});
            
            this.logger.debug('已反选所有人�?);
        } catch (error) {
            this.logger.error('反选人格失�?, error);
            throw error;
        }
    }
    
    /**
     * 针对特定罪人的全�?
     * @param {number} sinnerId - 罪人ID
     */
    selectSinnerPersonalities(sinnerId) {
        try {
            const filters = this.appState.get('filters.personalities') || new Map();
            
            if (!filters.has(sinnerId)) {
                filters.set(sinnerId, new Map());
            }
            
            const sinner = sinnerData.find(s => s.id === sinnerId);
            if (!sinner) {
                this.logger.warn(`罪人不存�? ${sinnerId}`);
                return;
            }
            
            sinner.personalities.forEach((_, index) => {
                filters.get(sinnerId).set(index, true);
            });
            
            this.appState.set('filters.personalities', filters);
            
            // 更新UI
            this.updateUICheckboxesBySinner(sinnerId, filters);
            
            // 发出事件
            this.eventBus.emit('SINNER_PERSONALITIES_SELECTED', {
                sinnerId,
                count: sinner.personalities.length
            });
            
            this.logger.debug(`已全选罪人人�? sinnerId=${sinnerId}`);
        } catch (error) {
            this.logger.error('全选罪人人格失�?, error);
            throw error;
        }
    }
    
    /**
     * 针对特定罪人的取消选择
     * @param {number} sinnerId - 罪人ID
     */
    deselectSinnerPersonalities(sinnerId) {
        try {
            const filters = this.appState.get('filters.personalities') || new Map();
            
            if (!filters.has(sinnerId)) {
                filters.set(sinnerId, new Map());
            }
            
            const sinner = sinnerData.find(s => s.id === sinnerId);
            if (!sinner) {
                this.logger.warn(`罪人不存�? ${sinnerId}`);
                return;
            }
            
            sinner.personalities.forEach((_, index) => {
                filters.get(sinnerId).set(index, false);
            });
            
            this.appState.set('filters.personalities', filters);
            
            // 更新UI
            this.updateUICheckboxesBySinner(sinnerId, filters);
            
            // 发出事件
            this.eventBus.emit('SINNER_PERSONALITIES_DESELECTED', {
                sinnerId,
                count: sinner.personalities.length
            });
            
            this.logger.debug(`已取消选择罪人人格: sinnerId=${sinnerId}`);
        } catch (error) {
            this.logger.error('取消选择罪人人格失败', error);
            throw error;
        }
    }
    
    /**
     * 针对特定罪人的反�?
     * @param {number} sinnerId - 罪人ID
     */
    invertSinnerPersonalities(sinnerId) {
        try {
            const filters = this.appState.get('filters.personalities') || new Map();
            
            if (!filters.has(sinnerId)) {
                filters.set(sinnerId, new Map());
            }
            
            const sinner = sinnerData.find(s => s.id === sinnerId);
            if (!sinner) {
                this.logger.warn(`罪人不存�? ${sinnerId}`);
                return;
            }
            
            sinner.personalities.forEach((_, index) => {
                const currentValue = filters.get(sinnerId)?.get(index) ?? true;
                filters.get(sinnerId).set(index, !currentValue);
            });
            
            this.appState.set('filters.personalities', filters);
            
            // 更新UI
            this.updateUICheckboxesBySinner(sinnerId, filters);
            
            // 发出事件
            this.eventBus.emit('SINNER_PERSONALITIES_INVERTED', {
                sinnerId,
                count: sinner.personalities.length
            });
            
            this.logger.debug(`已反选罪人人�? sinnerId=${sinnerId}`);
        } catch (error) {
            this.logger.error('反选罪人人格失�?, error);
            throw error;
        }
    }
    
    /**
     * 创建人格设置UI
     */
    createPersonalitySettings() {
        try {
            if (!this.settingsContainer) {
                this.logger.warn('设置容器未初始化');
                return;
            }
            
            this.settingsContainer.innerHTML = '';
            
            // 创建全局控制�?
            const globalControlDiv = document.createElement('div');
            globalControlDiv.className = 'filter-controls';
            
            const selectAllBtn = document.createElement('button');
            selectAllBtn.className = 'control-btn';
            selectAllBtn.textContent = '全选所有人�?;
            selectAllBtn.addEventListener('click', () => this.selectAllPersonalities());
            
            const deselectAllBtn = document.createElement('button');
            deselectAllBtn.className = 'control-btn';
            deselectAllBtn.textContent = '取消所有人�?;
            deselectAllBtn.addEventListener('click', () => this.deselectAllPersonalities());
            
            const invertSelectionBtn = document.createElement('button');
            invertSelectionBtn.className = 'control-btn';
            invertSelectionBtn.textContent = '反选所有人�?;
            invertSelectionBtn.addEventListener('click', () => this.invertAllPersonalities());
            
            globalControlDiv.appendChild(selectAllBtn);
            globalControlDiv.appendChild(deselectAllBtn);
            globalControlDiv.appendChild(invertSelectionBtn);
            this.settingsContainer.appendChild(globalControlDiv);
            
            // 获取当前选中的罪�?
            const selectedSinners = this.getSelectedSinners();
            
            if (selectedSinners.length === 0) {
                const noSinnerMsg = document.createElement('p');
                noSinnerMsg.className = 'no-sinner-message';
                noSinnerMsg.textContent = '请先在罪人筛选设置中选择至少一个罪�?;
                this.settingsContainer.appendChild(noSinnerMsg);
                return;
            }
            
            // 创建分页容器
            const paginationContainer = document.createElement('div');
            paginationContainer.className = 'pagination';
            paginationContainer.id = 'personality-pagination';
            
            // 创建人格页面
            let firstPage = true;
            const filters = this.appState.get('filters.personalities') || new Map();
            
            selectedSinners.forEach((sinner, sinnerIndex) => {
                // 创建页面容器
                const pageDiv = document.createElement('div');
                pageDiv.className = 'personality-page';
                pageDiv.dataset.sinnerId = sinner.id;
                if (firstPage) {
                    pageDiv.classList.add('active');
                    firstPage = false;
                }
                
                // 创建页面标题
                const pageTitle = document.createElement('h4');
                pageTitle.className = 'settings-section-title';
                pageTitle.innerHTML = `<i class="fas fa-user"></i> ${sinner.name}`;
                pageDiv.appendChild(pageTitle);
                
                // 创建页面控制按钮
                const pageControlDiv = document.createElement('div');
                pageControlDiv.className = 'filter-controls personality-page-controls';
                
                const pageSelectAllBtn = document.createElement('button');
                pageSelectAllBtn.className = 'control-btn';
                pageSelectAllBtn.textContent = '全�?;
                pageSelectAllBtn.addEventListener('click', () => this.selectSinnerPersonalities(sinner.id));
                
                const pageDeselectAllBtn = document.createElement('button');
                pageDeselectAllBtn.className = 'control-btn';
                pageDeselectAllBtn.textContent = '全不�?;
                pageDeselectAllBtn.addEventListener('click', () => this.deselectSinnerPersonalities(sinner.id));
                
                const pageInvertBtn = document.createElement('button');
                pageInvertBtn.className = 'control-btn';
                pageInvertBtn.textContent = '反�?;
                pageInvertBtn.addEventListener('click', () => this.invertSinnerPersonalities(sinner.id));
                
                pageControlDiv.appendChild(pageSelectAllBtn);
                pageControlDiv.appendChild(pageDeselectAllBtn);
                pageControlDiv.appendChild(pageInvertBtn);
                pageDiv.appendChild(pageControlDiv);
                
                // 创建人格网格
                const personalityGrid = document.createElement('div');
                personalityGrid.className = 'personality-settings-grid';
                
                sinner.personalities.forEach((persona, index) => {
                    const card = document.createElement('div');
                    card.className = 'personality-setting-card';
                    
                    const avatar = document.createElement('img');
                    avatar.className = 'personality-avatar';
                    if (persona.avatar) {
                        avatar.src = persona.avatar;
                        avatar.alt = persona.name;
                        avatar.onerror = function() {
                            this.textContent = '?';
                            this.classList.add('avatar-placeholder');
                        };
                    } else {
                        avatar.textContent = '?';
                        avatar.classList.add('avatar-placeholder');
                    }
                    
                    const name = document.createElement('div');
                    name.className = 'personality-name';
                    name.textContent = persona.name;
                    
                    const toggle = document.createElement('label');
                    toggle.className = 'personality-toggle';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = filters.get(sinner.id)?.get(index) ?? true;
                    checkbox.addEventListener('change', (e) => {
                        this.updatePersonalityFilter(sinner.id, index, e.target.checked);
                    });
                    
                    const toggleText = document.createElement('span');
                    toggleText.textContent = '启用';
                    
                    toggle.appendChild(checkbox);
                    toggle.appendChild(toggleText);
                    
                    card.appendChild(avatar);
                    card.appendChild(name);
                    card.appendChild(toggle);
                    
                    personalityGrid.appendChild(card);
                });
                
                pageDiv.appendChild(personalityGrid);
                this.settingsContainer.appendChild(pageDiv);
                
                // 创建分页按钮
                const pageBtn = document.createElement('button');
                pageBtn.className = 'page-btn';
                pageBtn.textContent = sinnerIndex + 1;
                pageBtn.title = sinner.name;
                pageBtn.dataset.sinnerId = sinner.id;
                if (sinnerIndex === 0) {
                    pageBtn.classList.add('active');
                }
                pageBtn.addEventListener('click', (e) => {
                    // 切换页面
                    document.querySelectorAll('.personality-page').forEach(page => {
                        page.classList.remove('active');
                    });
                    document.querySelectorAll('.page-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    const targetSinnerId = e.target.dataset.sinnerId;
                    const targetPage = document.querySelector(`.personality-page[data-sinner-id="${targetSinnerId}"]`);
                    if (targetPage) {
                        targetPage.classList.add('active');
                    }
                    e.target.classList.add('active');
                });
                
                paginationContainer.appendChild(pageBtn);
            });
            
            this.settingsContainer.appendChild(paginationContainer);
            this.logger.debug('人格设置UI已创�?);
        } catch (error) {
            this.logger.error('创建人格设置UI失败', error);
            throw error;
        }
    }
    
    /**
     * 获取选中的罪�?
     * @returns {Array} 选中的罪人数据数�?
     */
    getSelectedSinners() {
        const selectedIds = this.appState.get('filters.sinners') || new Set();
        return sinnerData.filter(sinner => selectedIds.has(sinner.id));
    }
    
    /**
     * 验证设置
     * @returns {boolean} 设置是否有效
     */
    validateSettings() {
        try {
            const filters = this.appState.get('filters.personalities') || new Map();
            
            if (filters.size === 0) {
                this.logger.warn('没有人格过滤设置');
                return false;
            }
            
            // 检查是否至少有一个人格被选中
            let hasAnySelected = false;
            filters.forEach(sinnerFilters => {
                sinnerFilters.forEach(isChecked => {
                    if (isChecked) hasAnySelected = true;
                });
            });
            
            if (!hasAnySelected) {
                this.logger.warn('没有选中任何人格');
                return false;
            }
            
            return true;
        } catch (error) {
            this.logger.error('验证设置失败', error);
            return false;
        }
    }
    
    /**
     * 计算总人格数
     * @private
     * @returns {number}
     */
    getTotalPersonalities() {
        return sinnerData.reduce((total, sinner) => {
            return total + (sinner.personalities?.length || 0);
        }, 0);
    }
    
    /**
     * 更新所有UI复选框
     * @private
     * @param {Map} filters - 过滤状态映�?
     */
    updateUICheckboxes(filters) {
        const checkboxes = this.settingsContainer?.querySelectorAll('input[type="checkbox"]');
        if (!checkboxes) return;
        
        checkboxes.forEach(checkbox => {
            const sinnerId = parseInt(checkbox.dataset.sinnerId);
            const personaIndex = parseInt(checkbox.dataset.personaIndex);
            
            checkbox.checked = filters.get(sinnerId)?.get(personaIndex) ?? true;
        });
    }
    
    /**
     * 更新特定罪人的UI复选框
     * @private
     * @param {number} sinnerId - 罪人ID
     * @param {Map} filters - 过滤状态映�?
     */
    updateUICheckboxesBySinner(sinnerId, filters) {
        const sinnerCheckboxes = this.settingsContainer?.querySelectorAll(
            `input[data-sinner-id="${sinnerId}"]`
        );
        if (!sinnerCheckboxes) return;
        
        sinnerCheckboxes.forEach(checkbox => {
            const personaIndex = parseInt(checkbox.dataset.personaIndex);
            checkbox.checked = filters.get(sinnerId)?.get(personaIndex) ?? true;
        });
    }
    
    /**
     * 清理方法
     */
    destroy() {
        // 清除所有事件监听器和引�?
        if (this.settingsContainer) {
            this.settingsContainer.innerHTML = '';
        }
        this.logger.debug('SettingsController已销�?);
    }
}

export default SettingsController;



