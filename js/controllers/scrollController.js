/**
 * ScrollController - 滚动系统控制�?
 * 负责罪人和人格的滚动列表管理、动画、高亮和选择
 * 
 * 架构�?
 * - 依赖注入：appState, eventBus, logger
 * - 状态管理：通过appState管理所有滚动状�?
 * - 事件驱动：通过eventBus与其他模块通信
 * - 零全局变量：不使用window.*
 * 
 * 关键保护�?
 * - highlightSelectedItem函数保持原有逻辑（已修复，不能修改）
 * - 支持1个和12个罪人的边界情况
 */

import { Config } from '../../data/config.js';
import { sinnerData } from '../../data/characters.js';
import { secureRandInt } from '../../data/utils/helpers.js';

export class ScrollController {
    constructor(appState, eventBus, logger, modal) {
        this.appState = appState;
        this.eventBus = eventBus;
        this.logger = logger;
        this.modal = modal;
        
        // DOM元素（延迟初始化�?
        this.sinnerScroll = null;
        this.personaScroll = null;
        this.sinnerStartBtn = null;
        this.sinnerStopBtn = null;
        this.personaStartBtn = null;
        this.personaStopBtn = null;
        this.selectedSinnerEl = null;
        this.selectedPersonaEl = null;
        
        // 滚动状�?
        this.sinnerScrollInterval = null;
        this.personaScrollInterval = null;
        this.isSinnerScrolling = false;
        this.isPersonaScrolling = false;
        
        // 配置
        this.itemHeight = Config.itemHeight || 50;
        
        // 绑定方法的this上下�?
        this.startSinnerScroll = this.startSinnerScroll.bind(this);
        this.stopSinnerScroll = this.stopSinnerScroll.bind(this);
        this.startPersonaScroll = this.startPersonaScroll.bind(this);
        this.stopPersonaScroll = this.stopPersonaScroll.bind(this);
        
        this.logger.debug('ScrollController已初始化');
    }
    
    /**
     * 初始化ScrollController
     * @param {Object} domElements - 包含所有必需DOM元素引用的对�?
     */
    initDOM(domElements) {
        try {
            this.sinnerScroll = domElements.sinnerScroll || document.getElementById('sinner-scroll');
            this.personaScroll = domElements.personaScroll || document.getElementById('persona-scroll');
            this.sinnerStartBtn = domElements.sinnerStartBtn || document.getElementById('sinner-start-btn');
            this.sinnerStopBtn = domElements.sinnerStopBtn || document.getElementById('sinner-stop-btn');
            this.personaStartBtn = domElements.personaStartBtn || document.getElementById('persona-start-btn');
            this.personaStopBtn = domElements.personaStopBtn || document.getElementById('persona-stop-btn');
            this.selectedSinnerEl = domElements.selectedSinnerEl || document.getElementById('selected-sinner');
            this.selectedPersonaEl = domElements.selectedPersonaEl || document.getElementById('selected-persona');
            
            // 绑定事件监听�?
            this.sinnerStartBtn?.addEventListener('click', this.startSinnerScroll);
            this.sinnerStopBtn?.addEventListener('click', this.stopSinnerScroll);
            this.personaStartBtn?.addEventListener('click', this.startPersonaScroll);
            this.personaStopBtn?.addEventListener('click', this.stopPersonaScroll);
            
            this.logger.debug('ScrollController DOM初始化完�?);
        } catch (error) {
            this.logger.error('ScrollController DOM初始化失�?, error);
            throw error;
        }
    }
    
    /**
     * 创建罪人滚动列表
     * @param {Array} sinnerItems - 罪人数据数组
     */
    createSinnerScrollList(sinnerItems) {
        try {
            if (!sinnerItems || sinnerItems.length === 0) {
                this.logger.warn('createSinnerScrollList: 罪人列表为空');
                return;
            }
            
            // 清空滚动容器
            if (this.sinnerScroll) {
                this.sinnerScroll.innerHTML = '';
            }
            
            // 重置选择状�?
            this.appState.set('game.selectedSinner', null);
            this.appState.set('game.selectedPersona', null);
            
            // 重置显示文本
            if (this.selectedSinnerEl) this.selectedSinnerEl.textContent = '未选择';
            if (this.selectedPersonaEl) this.selectedPersonaEl.textContent = '未选择';
            
            // 重置空状态提�?
            this.hideEmptyStates();
            
            // 计算显示行数 (最�?行，最�?�?
            const visibleRows = Math.min(Math.max(sinnerItems.length, 3), 5);
            const containerHeight = visibleRows * this.itemHeight;
            if (this.sinnerScroll?.parentElement) {
                this.sinnerScroll.parentElement.style.height = `${containerHeight}px`;
            }
            
            // 禁用人格选择器（在罪人选定后才启用�?
            if (this.personaStartBtn) {
                this.personaStartBtn.disabled = sinnerItems.length === 1;
            }
            
            // 创建滚动项目（重�?0次用于循环滚动）
            const itemCount = sinnerItems.length * 10;
            for (let i = 0; i < itemCount; i++) {
                const item = document.createElement('div');
                item.className = 'scroll-item';
                item.style.height = `${this.itemHeight}px`;
                item.dataset.originalIndex = i % sinnerItems.length;
                
                const content = document.createElement('div');
                content.className = 'scroll-item-content';
                
                // 创建头像
                const avatarElement = document.createElement('img');
                avatarElement.className = 'avatar-placeholder';
                avatarElement.style.width = '30px';
                avatarElement.style.height = '30px';
                
                const currentItem = sinnerItems[i % sinnerItems.length];
                const sinnerName = typeof currentItem === 'string' ? currentItem : currentItem.name;
                const sinnerInfo = typeof currentItem === 'string'
                    ? sinnerData.find(s => s.name === currentItem)
                    : currentItem;
                
                if (sinnerInfo?.avatar) {
                    avatarElement.src = sinnerInfo.avatar;
                    avatarElement.alt = sinnerInfo.name;
                    avatarElement.onerror = () => this.handleImageError(avatarElement);
                } else {
                    avatarElement.textContent = '?';
                }
                
                content.appendChild(avatarElement);
                
                const textSpan = document.createElement('span');
                textSpan.textContent = sinnerName;
                content.appendChild(textSpan);
                
                item.appendChild(content);
                this.sinnerScroll.appendChild(item);
            }
            
            // 设置滚动容器高度
            this.sinnerScroll.style.height = `${itemCount * this.itemHeight}px`;
            
            // 如果只有一个罪人，直接高亮显示并自动选中
            if (sinnerItems.length === 1) {
                setTimeout(() => {
                    this.highlightSelectedItem(this.sinnerScroll, 0);
                    
                    const sinner = sinnerItems[0];
                    this.appState.set('game.selectedSinner', sinner);
                    
                    if (this.selectedSinnerEl) {
                        this.selectedSinnerEl.textContent = typeof sinner === 'string' ? sinner : sinner.name;
                    }
                    
                    // 隐藏罪人空状�?
                    const sinnerEmpty = document.getElementById('sinner-empty');
                    if (sinnerEmpty) {
                        sinnerEmpty.classList.add('hidden');
                    }
                    
                    // 更新人格列表
                    const personalities = sinner.personalities || [];
                    this.createPersonaScrollList(personalities);
                    
                    // 发出事件
                    this.eventBus.emit('SINNER_SELECTED', {
                        sinner,
                        isAutoSelected: true,
                        itemsLength: sinnerItems.length
                    });
                }, 100);
            }
            
            this.updateResultDisplay();
            this.logger.debug(`罪人滚动列表已创建，�?{sinnerItems.length}项`);
        } catch (error) {
            this.logger.error('创建罪人滚动列表失败', error);
            throw error;
        }
    }
    
    /**
     * 创建人格滚动列表
     * @param {Array} personaItems - 人格数据数组
     */
    createPersonaScrollList(personaItems) {
        try {
            if (!Array.isArray(personaItems)) {
                this.logger.warn('createPersonaScrollList: 人格列表不是数组');
                return;
            }
            
            // 清空滚动容器
            if (this.personaScroll) {
                this.personaScroll.innerHTML = '';
            }
            
            // 隐藏空状态提�?
            const personaEmpty = document.getElementById('persona-empty');
            if (personaEmpty) {
                personaEmpty.classList.add('hidden');
            }
            
            // 计算显示行数
            const visibleRows = Math.min(Math.max(personaItems.length, 3), 5);
            const containerHeight = visibleRows * this.itemHeight;
            if (this.personaScroll?.parentElement) {
                this.personaScroll.parentElement.style.height = `${containerHeight}px`;
            }
            
            // 处理空列表或提示字符�?
            if (personaItems.length === 0 || (personaItems.length === 1 && typeof personaItems[0] === 'string')) {
                const item = document.createElement('div');
                item.className = 'scroll-item';
                item.style.height = `${this.itemHeight}px`;
                
                const content = document.createElement('div');
                content.className = 'scroll-item-content';
                
                const avatarElement = document.createElement('div');
                avatarElement.className = 'avatar-placeholder';
                avatarElement.style.width = '30px';
                avatarElement.style.height = '30px';
                avatarElement.style.backgroundColor = '#ccc';
                avatarElement.style.borderRadius = '50%';
                avatarElement.style.display = 'flex';
                avatarElement.style.alignItems = 'center';
                avatarElement.style.justifyContent = 'center';
                avatarElement.textContent = '?';
                
                content.appendChild(avatarElement);
                
                const textSpan = document.createElement('span');
                textSpan.textContent = personaItems.length === 0 ? '请先选择罪人' : personaItems[0];
                content.appendChild(textSpan);
                
                item.appendChild(content);
                this.personaScroll.appendChild(item);
                
                if (personaEmpty) {
                    personaEmpty.classList.remove('hidden');
                }
                
                if (this.personaStartBtn) {
                    this.personaStartBtn.disabled = true;
                }
                
                return;
            }
            
            // 启用开始按�?
            if (this.personaStartBtn) {
                this.personaStartBtn.disabled = false;
            }
            
            // 创建滚动项目
            const itemCount = personaItems.length * 10;
            for (let i = 0; i < itemCount; i++) {
                const item = document.createElement('div');
                item.className = 'scroll-item';
                item.style.height = `${this.itemHeight}px`;
                item.dataset.originalIndex = i % personaItems.length;
                
                const content = document.createElement('div');
                content.className = 'scroll-item-content';
                
                // 创建头像
                const avatarElement = document.createElement('img');
                avatarElement.className = 'avatar-placeholder';
                avatarElement.style.width = '30px';
                avatarElement.style.height = '30px';
                
                const currentItem = personaItems[i % personaItems.length];
                const personaName = typeof currentItem === 'string' ? currentItem : currentItem.name;
                const personaInfo = typeof currentItem === 'object' ? currentItem : null;
                
                if (personaInfo?.avatar) {
                    avatarElement.src = personaInfo.avatar;
                    avatarElement.alt = personaName;
                    avatarElement.onerror = () => this.handleImageError(avatarElement);
                } else {
                    avatarElement.style.backgroundColor = '#ccc';
                    avatarElement.style.borderRadius = '50%';
                    avatarElement.style.display = 'flex';
                    avatarElement.style.alignItems = 'center';
                    avatarElement.style.justifyContent = 'center';
                    avatarElement.textContent = '?';
                    avatarElement.alt = personaName;
                }
                
                content.appendChild(avatarElement);
                
                const textSpan = document.createElement('span');
                textSpan.textContent = personaName;
                content.appendChild(textSpan);
                
                item.appendChild(content);
                this.personaScroll.appendChild(item);
            }
            
            // 设置滚动容器高度
            this.personaScroll.style.height = `${itemCount * this.itemHeight}px`;
            
            // 如果只有一个人格，直接高亮显示
            if (personaItems.length === 1) {
                setTimeout(() => {
                    this.highlightSelectedItem(this.personaScroll, 0);
                    
                    const persona = personaItems[0];
                    this.appState.set('game.selectedPersona', persona);
                    
                    if (this.selectedPersonaEl) {
                        this.selectedPersonaEl.textContent = typeof persona === 'string' ? persona : persona.name;
                    }
                    
                    if (this.personaStartBtn) {
                        this.personaStartBtn.disabled = true;
                    }
                }, 0);
            }
            
            this.updateResultDisplay();
            this.logger.debug(`人格滚动列表已创建，�?{personaItems.length}项`);
        } catch (error) {
            this.logger.error('创建人格滚动列表失败', error);
            throw error;
        }
    }
    
    /**
     * 开始罪人滚�?
     */
    startSinnerScroll = () => {
        try {
            const filteredSinners = this.appState.get('filters.sinners');
            if (!filteredSinners || filteredSinners.size === 0) {
                this.modal.alert('请至少选择一个罪人！', '提示');
                return;
            }
            
            // 如果只有一个罪人，直接停止（自动选中�?
            if (filteredSinners.size === 1) {
                this.stopSinnerScroll();
                return;
            }
            
            if (this.sinnerScrollInterval) return;
            
            this.isSinnerScrolling = true;
            this.appState.set('game.isScrolling', true);
            
            if (this.sinnerStartBtn) this.sinnerStartBtn.disabled = true;
            if (this.sinnerStopBtn) this.sinnerStopBtn.disabled = false;
            if (this.personaStartBtn) this.personaStartBtn.disabled = true;
            
            this.sinnerScrollInterval = setInterval(() => {
                if (this.sinnerScroll) {
                    this.sinnerScroll.style.transform = `translateY(${this.appState.get('game.sinnerScrollOffset') * this.itemHeight}px)`;
                    this.appState.set('game.sinnerScrollOffset', (this.appState.get('game.sinnerScrollOffset') + 1) % 10000);
                }
            }, Config.scrollSpeed || 20);
            
            this.eventBus.emit('SCROLL_START', { type: 'sinner' });
            this.logger.debug('罪人滚动已启�?);
        } catch (error) {
            this.logger.error('启动罪人滚动失败', error);
        }
    }
    
    /**
     * 停止罪人滚动
     */
    stopSinnerScroll = () => {
        try {
            if (!this.isSinnerScrolling) return;
            
            clearInterval(this.sinnerScrollInterval);
            this.sinnerScrollInterval = null;
            this.isSinnerScrolling = false;
            this.appState.set('game.isScrolling', false);
            
            if (this.sinnerStartBtn) this.sinnerStartBtn.disabled = false;
            if (this.sinnerStopBtn) this.sinnerStopBtn.disabled = true;
            if (this.personaStartBtn) this.personaStartBtn.disabled = false;
            
            const filteredSinners = Array.from(this.appState.get('filters.sinners') || new Set());
            const randomIndex = secureRandInt(0, filteredSinners.length - 1);
            const selectedSinner = filteredSinners[randomIndex];
            
            // 设置AppState
            this.appState.set('game.selectedSinner', selectedSinner);
            
            // 高亮
            if (this.sinnerScroll) {
                this.highlightSelectedItem(this.sinnerScroll, randomIndex);
            }
            
            // 更新显示
            if (this.selectedSinnerEl) {
                this.selectedSinnerEl.textContent = typeof selectedSinner === 'string' ? selectedSinner : selectedSinner.name;
            }
            
            // 隐藏罪人空状�?
            const sinnerEmpty = document.getElementById('sinner-empty');
            if (sinnerEmpty) {
                sinnerEmpty.classList.add('hidden');
            }
            
            // 更新人格列表
            const personalities = selectedSinner.personalities || [];
            this.createPersonaScrollList(personalities);
            
            // 发出事件
            this.eventBus.emit('SINNER_SELECTED', {
                sinner: selectedSinner,
                isAutoSelected: false,
                itemsLength: filteredSinners.length
            });
            
            this.updateResultDisplay();
            this.logger.debug(`罪人已选中: ${typeof selectedSinner === 'string' ? selectedSinner : selectedSinner.name}`);
        } catch (error) {
            this.logger.error('停止罪人滚动失败', error);
        }
    }
    
    /**
     * 开始人格滚�?
     */
    startPersonaScroll = () => {
        try {
            const selectedSinner = this.appState.get('game.selectedSinner');
            if (!selectedSinner) {
                this.modal.alert('请先选择罪人�?, '提示');
                return;
            }
            
            const personas = selectedSinner.personalities || [];
            if (personas.length === 0) {
                this.modal.alert('该罪人没有可用的人格�?, '提示');
                return;
            }
            
            // 如果只有一个人格，直接停止（自动选中�?
            if (personas.length === 1) {
                this.stopPersonaScroll();
                return;
            }
            
            if (this.personaScrollInterval) return;
            
            this.isPersonaScrolling = true;
            this.appState.set('game.isScrolling', true);
            
            if (this.personaStartBtn) this.personaStartBtn.disabled = true;
            if (this.personaStopBtn) this.personaStopBtn.disabled = false;
            if (this.sinnerStartBtn) this.sinnerStartBtn.disabled = true;
            
            this.personaScrollInterval = setInterval(() => {
                if (this.personaScroll) {
                    this.personaScroll.style.transform = `translateY(${this.appState.get('game.personaScrollOffset') * this.itemHeight}px)`;
                    this.appState.set('game.personaScrollOffset', (this.appState.get('game.personaScrollOffset') + 1) % 10000);
                }
            }, Config.scrollSpeed || 20);
            
            this.eventBus.emit('SCROLL_START', { type: 'persona' });
            this.logger.debug('人格滚动已启�?);
        } catch (error) {
            this.logger.error('启动人格滚动失败', error);
        }
    }
    
    /**
     * 停止人格滚动
     */
    stopPersonaScroll = () => {
        try {
            if (!this.isPersonaScrolling) return;
            
            clearInterval(this.personaScrollInterval);
            this.personaScrollInterval = null;
            this.isPersonaScrolling = false;
            this.appState.set('game.isScrolling', false);
            
            if (this.personaStartBtn) this.personaStartBtn.disabled = false;
            if (this.personaStopBtn) this.personaStopBtn.disabled = true;
            if (this.sinnerStartBtn) this.sinnerStartBtn.disabled = false;
            
            const selectedSinner = this.appState.get('game.selectedSinner');
            const personas = selectedSinner?.personalities || [];
            
            if (personas.length === 0) return;
            
            const randomIndex = secureRandInt(0, personas.length - 1);
            const selectedPersona = personas[randomIndex];
            
            // 设置AppState
            this.appState.set('game.selectedPersona', selectedPersona);
            
            // 高亮
            if (this.personaScroll) {
                this.highlightSelectedItem(this.personaScroll, randomIndex);
            }
            
            // 更新显示
            if (this.selectedPersonaEl) {
                this.selectedPersonaEl.textContent = typeof selectedPersona === 'string' ? selectedPersona : selectedPersona.name;
            }
            
            // 隐藏人格空状�?
            const personaEmpty = document.getElementById('persona-empty');
            if (personaEmpty) {
                personaEmpty.classList.add('hidden');
            }
            
            // 发出事件
            this.eventBus.emit('PERSONA_SELECTED', {
                persona: selectedPersona,
                sinner: selectedSinner,
                itemsLength: personas.length
            });
            
            // 检查彩蛋（需要单独实现）
            this.checkEasterEgg();
            
            this.updateResultDisplay();
            this.logger.debug(`人格已选中: ${typeof selectedPersona === 'string' ? selectedPersona : selectedPersona.name}`);
        } catch (error) {
            this.logger.error('停止人格滚动失败', error);
        }
    }
    
    /**
     * 【关键方法】高亮选中�?
     * 原始逻辑已验证通过，支�?个和12个罪人的所有边界情�?
     * @protected 不应修改此方�?
     * @param {HTMLElement} scrollContainer - 滚动容器
     * @param {number} selectedIndex - 选中项的原始索引
     */
    highlightSelectedItem(scrollContainer, selectedIndex) {
        // 清除之前的高�?
        const highlightedItems = scrollContainer.querySelectorAll('.selected');
        highlightedItems.forEach(item => item.classList.remove('selected'));
        
        // 获取所有滚动项�?
        const items = scrollContainer.querySelectorAll('.scroll-item');
        
        if (!items.length || selectedIndex === null) {
            return;
        }
        
        // 简化逻辑：直接找到originalIndex === selectedIndex的元�?
        // 因为我们已经知道是哪个原始索引被选中�?
        items.forEach(item => {
            const itemOriginalIndex = parseInt(item.dataset.originalIndex) || 0;
            // 高亮所有数据原始索引与选中项相同的元素�?0次重复）
            if (itemOriginalIndex === selectedIndex) {
                item.classList.add('selected');
            }
        });
    }
    
    /**
     * 隐藏所有空状态提�?
     */
    hideEmptyStates() {
        const sinnerEmpty = document.getElementById('sinner-empty');
        const personaEmpty = document.getElementById('persona-empty');
        
        if (sinnerEmpty) sinnerEmpty.classList.add('hidden');
        if (personaEmpty) personaEmpty.classList.add('hidden');
    }
    
    /**
     * 处理图像加载错误
     */
    handleImageError(imgElement) {
        imgElement.src = '';
        imgElement.alt = '未知头像';
        imgElement.style.backgroundColor = '#ccc';
        imgElement.style.borderRadius = '50%';
        imgElement.style.display = 'flex';
        imgElement.style.alignItems = 'center';
        imgElement.style.justifyContent = 'center';
        imgElement.textContent = '?';
    }
    
    /**
     * 彩蛋检测（留作钩子，实现见主程序）
     */
    checkEasterEgg() {
        // 由主程序或独立模块实�?
        this.eventBus.emit('CHECK_EASTER_EGG', {
            sinner: this.appState.get('game.selectedSinner'),
            persona: this.appState.get('game.selectedPersona')
        });
    }
    
    /**
     * 更新结果显示面板
     */
    updateResultDisplay() {
        // 在UI中显示当前选择状态和罪人计数等信�?
        // 具体实现由UI层负责监听相应事�?
        const selectedSinner = this.appState.get('game.selectedSinner');
        const sinnerCount = this.appState.get('filters.sinners')?.size || 0;
        
        this.eventBus.emit('RESULT_DISPLAY_UPDATE', {
            selectedSinner,
            sinnerCount
        });
    }
    
    /**
     * 清理方法（在页面卸载或重新初始化时调用）
     */
    destroy() {
        // 停止所有滚�?
        clearInterval(this.sinnerScrollInterval);
        clearInterval(this.personaScrollInterval);
        
        // 移除事件监听�?
        this.sinnerStartBtn?.removeEventListener('click', this.startSinnerScroll);
        this.sinnerStopBtn?.removeEventListener('click', this.stopSinnerScroll);
        this.personaStartBtn?.removeEventListener('click', this.startPersonaScroll);
        this.personaStopBtn?.removeEventListener('click', this.stopPersonaScroll);
        
        this.logger.debug('ScrollController已销�?);
    }
}

export default ScrollController;



