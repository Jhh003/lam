/**
 * 过滤管理控制�?
 * 
 * 负责罪人和人格的过滤逻辑�?
 * 使用新的AppState和EventBus架构，完全消除全局变量�?
 * 
 * 迁移说明�?
 * - window.filteredSinnerData �?appState.get('filters.sinner')
 * - window.filteredPersonalityData �?appState.get('filters.persona')
 * - window.hasUnsavedChanges �?appState.get('app.hasUnsavedChanges')
 * - 事件通知通过eventBus发出
 * 
 * @module FilterController
 * @requires appState - 中央状态管�?
 * @requires eventBus - 事件系统
 * @requires logger - 日志系统
 */

import { appState } from '../core/appState.js';
import { eventBus, GameEvents } from '../core/eventBus.js';
import { logger } from '../core/logger.js';
import { sinnerData } from '../../data/characters.js';
import modal from '../modal-new.js';

/**
 * 过滤器控制器
 */
class FilterController {
    constructor() {
        logger.info('FilterController 初始�?);
        
        // 注册事件监听
        this._setupEventListeners();
    }
    
    /**
     * 设置事件监听
     * @private
     */
    _setupEventListeners() {
        // 监听罪人过滤变化
        eventBus.subscribe(
            GameEvents.SINNER_FILTER_CHANGED,
            this.onSinnerFilterChanged.bind(this),
            5
        );
        
        // 监听人格过滤变化
        eventBus.subscribe(
            GameEvents.PERSONA_FILTER_CHANGED,
            this.onPersonaFilterChanged.bind(this),
            5
        );
    }
    
    // ========== 创建UI ==========
    
    /**
     * 创建头像占位�?
     * @param {Object} sinner - 罪人对象
     * @returns {HTMLElement} 占位符元�?
     * @private
     */
    createAvatarPlaceholder(sinner) {
        const placeholder = document.createElement('span');
        placeholder.className = 'filter-avatar-placeholder avatar-placeholder';
        placeholder.style.backgroundColor = sinner.color;
        placeholder.textContent = '?';
        return placeholder;
    }
    
    /**
     * 创建罪人过滤UI
     * 构建所有罪人的复选框列表
     */
    createSinnerFilter() {
        const filterContainer = document.getElementById('sinner-filter');
        if (!filterContainer) {
            logger.warn('找不到sinner-filter容器');
            return;
        }
        
        filterContainer.innerHTML = '';
        
        // 从AppState恢复之前的过滤状�?
        const savedFilters = appState.getSinnerFilters();
        
        sinnerData.forEach(sinner => {
            const label = document.createElement('label');
            label.className = 'sinner-checkbox-label';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = sinner.id;
            // 恢复已保存的状态，或默认全�?
            checkbox.checked = savedFilters.size === 0 || savedFilters.has(sinner.id);
            
            // 绑定事件处理
            checkbox.addEventListener('change', () => this.onSinnerCheckboxChange());
            
            // 创建头像
            if (sinner.avatar) {
                const avatarImg = document.createElement('img');
                avatarImg.className = 'filter-avatar';
                avatarImg.src = sinner.avatar;
                avatarImg.alt = sinner.name;
                avatarImg.onerror = () => {
                    avatarImg.parentNode.replaceChild(
                        this.createAvatarPlaceholder(sinner),
                        avatarImg
                    );
                };
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
        
        // 初始化过滤状�?
        this.updateFilteredSinnerData();
        
        logger.info('罪人过滤UI已创�?);
    }
    
    // ========== 罪人过滤 ==========
    
    /**
     * 复选框变化事件处理
     * @private
     */
    onSinnerCheckboxChange() {
        this.updateFilteredSinnerData();
    }
    
    /**
     * 更新过滤后的罪人数据
     * 根据复选框状态更新AppState中的过滤数据
     */
    updateFilteredSinnerData() {
        const timer = logger.time('更新罪人过滤');
        
        try {
            // 获取选中的复选框
            const checkboxes = document.querySelectorAll('#sinner-filter input[type="checkbox"]');
            const selectedIds = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => parseInt(cb.value));
            
            // 更新AppState
            appState.setSinnerFilters(new Set(selectedIds));
            
            // 更新开始按钮的禁用状�?
            this.updateStartButtonState(selectedIds.length);
            
            // 标记有未保存更改
            appState.set('app.hasUnsavedChanges', true);
            
            // 发出过滤变化事件
            eventBus.emit(GameEvents.SINNER_FILTER_CHANGED, {
                enabledCount: selectedIds.length,
                totalCount: sinnerData.length,
                timestamp: Date.now()
            });
            
            logger.debug(`罪人过滤已更�? ${selectedIds.length}/${sinnerData.length}`);
        } catch (error) {
            logger.error('更新罪人过滤失败', error);
            throw error;
        } finally {
            timer();
        }
    }
    
    /**
     * 更新开始按钮的禁用状�?
     * @param {number} selectedCount - 选中的罪人数�?
     * @private
     */
    updateStartButtonState(selectedCount) {
        const sinnerStartBtn = document.getElementById('sinner-start-btn');
        if (sinnerStartBtn) {
            // 当选中数量�?�?时禁�?
            sinnerStartBtn.disabled = selectedCount === 0 || selectedCount === 1;
        }
    }
    
    /**
     * 全选所有罪�?
     */
    selectAllSinners() {
        const checkboxes = document.querySelectorAll('#sinner-filter input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true);
        this.updateFilteredSinnerData();
        logger.info('已选中所有罪�?);
    }
    
    /**
     * 取消选择所有罪�?
     */
    deselectAllSinners() {
        const checkboxes = document.querySelectorAll('#sinner-filter input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        this.updateFilteredSinnerData();
        logger.info('已取消选择所有罪�?);
    }
    
    /**
     * 反转选择
     */
    invertSinnerSelection() {
        const checkboxes = document.querySelectorAll('#sinner-filter input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = !cb.checked);
        this.updateFilteredSinnerData();
        logger.info('已反转罪人选择');
    }
    
    /**
     * 获取过滤后的罪人列表
     * @returns {Array} 过滤后的罪人数组
     */
    getFilteredSinners() {
        const enabledIds = appState.getSinnerFilters();
        if (enabledIds.size === 0) {
            return [];
        }
        return sinnerData.filter(sinner => enabledIds.has(sinner.id));
    }
    
    /**
     * 检查罪人是否启�?
     * @param {number} sinnerId - 罪人ID
     * @returns {boolean}
     */
    isSinnerEnabled(sinnerId) {
        return appState.isSinnerEnabled(sinnerId);
    }
    
    // ========== 人格过滤 ==========
    
    /**
     * 更新人格过滤�?
     * @param {Map} personaFilters - Map<sinnerId, Set<personaIndex>>
     */
    updatePersonaFilters(personaFilters) {
        try {
            appState.setPersonaFilters(personaFilters);
            
            // 标记有未保存更改
            appState.set('app.hasUnsavedChanges', true);
            
            // 发出事件
            eventBus.emit(GameEvents.PERSONA_FILTER_CHANGED, {
                totalFilters: personaFilters.size,
                timestamp: Date.now()
            });
            
            logger.debug(`人格过滤已更�? ${personaFilters.size}个罪人设置了过滤`);
        } catch (error) {
            logger.error('更新人格过滤失败', error);
            throw error;
        }
    }
    
    /**
     * 获取过滤后的人格列表
     * @param {number} sinnerId - 罪人ID
     * @returns {Array} 过滤后的人格数组
     */
    getFilteredPersonas(sinner) {
        if (!sinner || !sinner.personalities) {
            return [];
        }
        
        const personaFilters = appState.getPersonaFilters();
        const sinnerPersonaFilters = personaFilters.get(sinner.id);
        
        // 如果没有设置该罪人的过滤，默认选中所有人�?
        if (!sinnerPersonaFilters) {
            return sinner.personalities;
        }
        
        // 过滤人格：包含未设置和非false的项
        return sinner.personalities.filter((persona, index) => {
            return sinnerPersonaFilters.has(index);
        });
    }
    
    /**
     * 检查人格是否启�?
     * @param {number} sinnerId - 罪人ID
     * @param {number} personaIndex - 人格索引
     * @returns {boolean}
     */
    isPersonaEnabled(sinnerId, personaIndex) {
        return appState.isPersonaEnabled(sinnerId, personaIndex);
    }
    
    // ========== 验证和应�?==========
    
    /**
     * 验证过滤设置的有效�?
     * @returns {boolean} 是否有效
     */
    validateFilterSettings() {
        // 检查是否至少选择了一个罪�?
        const filteredSinners = this.getFilteredSinners();
        if (filteredSinners.length === 0) {
            Modal.alert('请至少选择一个罪人！', '提示');
            logger.warn('验证失败：未选择罪人');
            return false;
        }
        
        // 检查每个罪人是否至少选择了一个人�?
        const sinnersWithoutPersonalities = [];
        const personaFilters = appState.getPersonaFilters();
        
        for (const sinner of filteredSinners) {
            const hasPersonas = this.getFilteredPersonas(sinner).length > 0;
            
            if (!hasPersonas) {
                sinnersWithoutPersonalities.push(sinner.name);
            }
        }
        
        if (sinnersWithoutPersonalities.length > 0) {
            const message = `请为以下罪人至少选择一个人格：\n${sinnersWithoutPersonalities.join('\n')}`;
            Modal.alert(message, '提示');
            logger.warn('验证失败：以下罪人未选择人格', sinnersWithoutPersonalities);
            return false;
        }
        
        logger.info('过滤设置验证通过');
        return true;
    }
    
    /**
     * 应用过滤设置
     * 验证设置后，保存为原始状态并切换到主页面
     */
    applyFilters() {
        const timer = logger.time('应用过滤设置');
        
        try {
            // 验证
            if (!this.validateFilterSettings()) {
                return;
            }
            
            // 清除未保存更改标�?
            appState.set('app.hasUnsavedChanges', false);
            
            // 切换页面
            this.switchToMainPage();
            
            // 发出过滤应用事件
            eventBus.emit(GameEvents.FILTER_CHANGED, {
                sinnerCount: this.getFilteredSinners().length,
                timestamp: Date.now()
            });
            
            logger.info('过滤设置已应�?);
        } catch (error) {
            logger.error('应用过滤设置失败', error);
            throw error;
        } finally {
            timer();
        }
    }
    
    // ========== 页面导航 ==========
    
    /**
     * 检查是否有未保存的更改
     * @returns {boolean} 是否可以离开
     */
    checkUnsavedChanges() {
        const hasChanges = appState.get('app.hasUnsavedChanges');
        
        if (hasChanges) {
            const confirmed = Modal.confirm('您有未保存的更改，确定要离开吗？', '确认');
            logger.debug(`未保存更改检�? ${confirmed ? '确定' : '取消'}`);
            return confirmed;
        }
        
        return true;
    }
    
    /**
     * 切换到主页面
     * @private
     */
    switchToMainPage() {
        const mainPage = document.getElementById('main-selector-page');
        const settingsPage = document.getElementById('settings-page');
        const mainBtn = document.getElementById('main-page-btn');
        const settingsBtn = document.getElementById('settings-page-btn');
        
        if (mainPage) mainPage.style.display = 'block';
        if (settingsPage) settingsPage.style.display = 'none';
        if (mainBtn) mainBtn.classList.add('active');
        if (settingsBtn) settingsBtn.classList.remove('active');
        
        // 通知其他模块更新
        eventBus.emit(GameEvents.PAGE_CHANGED, {
            page: 'main',
            timestamp: Date.now()
        });
    }
    
    /**
     * 切换到设置页�?
     * @private
     */
    switchToSettingsPage() {
        const mainPage = document.getElementById('main-selector-page');
        const settingsPage = document.getElementById('settings-page');
        const mainBtn = document.getElementById('main-page-btn');
        const settingsBtn = document.getElementById('settings-page-btn');
        
        if (mainPage) mainPage.style.display = 'none';
        if (settingsPage) settingsPage.style.display = 'block';
        if (mainBtn) mainBtn.classList.remove('active');
        if (settingsBtn) settingsBtn.classList.add('active');
        
        // 通知其他模块更新
        eventBus.emit(GameEvents.PAGE_CHANGED, {
            page: 'settings',
            timestamp: Date.now()
        });
    }
    
    // ========== 事件处理 ==========
    
    /**
     * 罪人过滤变化事件处理
     * @private
     */
    onSinnerFilterChanged(data) {
        logger.debug('罪人过滤变化', data);
        
        // 如果这是一个显著的变化，可能需要重新渲染UI
        // 具体操作由订阅者决�?
    }
    
    /**
     * 人格过滤变化事件处理
     * @private
     */
    onPersonaFilterChanged(data) {
        logger.debug('人格过滤变化', data);
    }
    
    // ========== 公共API ==========
    
    /**
     * 获取过滤统计信息
     * @returns {Object} 统计对象
     */
    getFilterStats() {
        const sinner = this.getFilteredSinners();
        const personas = new Set();
        
        sinner.forEach(s => {
            const filtered = this.getFilteredPersonas(s);
            filtered.forEach(p => personas.add(p.id || p.name));
        });
        
        return {
            sinnerCount: sinner.length,
            personaCount: personas.size,
            hasUnsavedChanges: appState.get('app.hasUnsavedChanges')
        };
    }
    
    /**
     * 重置过滤到初始状�?
     */
    reset() {
        const checkboxes = document.querySelectorAll('#sinner-filter input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true);
        
        appState.set('app.hasUnsavedChanges', false);
        this.updateFilteredSinnerData();
        
        logger.info('过滤器已重置');
    }
}

// 创建并导出单�?
export const filterController = new FilterController();

// 也导出类本身，用于测�?
export default FilterController;



