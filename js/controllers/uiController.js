/**
 * UIController.js - UI层控制器
 * 
 * 职责�?
 * - 管理所有UI元素的创建和更新
 * - 响应状态变化并更新视图
 * - 分离UI逻辑和业务逻辑
 * - 提供统一的UI API
 */

export class UIController {
    constructor(appState, eventBus, logger, Modal) {
        this.appState = appState;
        this.eventBus = eventBus;
        this.logger = logger;
        this.Modal = Modal;
        
        // DOM元素缓存
        this.domElements = {};
        
        // 订阅相关事件
        this.subscribeToEvents();
        
        this.logger.debug('UIController 已初始化');
    }
    
    /**
     * 初始化DOM元素引用
     */
    initDOM(domElements) {
        this.domElements = {
            ...domElements,
            // 选择显示元素
            selectedSinnerName: document.querySelector('[data-ui="selected-sinner-name"]'),
            selectedPersonaName: document.querySelector('[data-ui="selected-persona-name"]'),
            selectedSinnerImage: document.querySelector('[data-ui="selected-sinner-image"]'),
            selectedPersonaImage: document.querySelector('[data-ui="selected-persona-image"]'),
            
            // 统计信息
            sinnerCountDisplay: document.querySelector('[data-ui="sinner-count"]'),
            personaCountDisplay: document.querySelector('[data-ui="persona-count"]'),
            
            // 按钮�?
            filterBtnGroup: document.querySelector('[data-ui="filter-btn-group"]'),
            scrollBtnGroup: document.querySelector('[data-ui="scroll-btn-group"]'),
            timerBtnGroup: document.querySelector('[data-ui="timer-btn-group"]'),
            
            // 页面容器
            loadingOverlay: document.querySelector('[data-ui="loading-overlay"]'),
            errorOverlay: document.querySelector('[data-ui="error-overlay"]')
        };
        
        this.logger.debug('DOM元素已初始化');
    }
    
    /**
     * 订阅事件
     */
    subscribeToEvents() {
        // 罪人选择变化
        this.eventBus.subscribe('SINNER_SELECTED', (data) => {
            this.updateSelectedSinner(data.sinner);
        });
        
        // 人格选择变化
        this.eventBus.subscribe('PERSONA_SELECTED', (data) => {
            this.updateSelectedPersona(data.persona);
        });
        
        // 滚动状态变�?
        this.eventBus.subscribe('SCROLLING_STARTED', () => {
            this.updateScrollButtonStates(true);
        });
        
        this.eventBus.subscribe('SCROLLING_STOPPED', () => {
            this.updateScrollButtonStates(false);
        });
        
        // 计时器更�?
        this.eventBus.subscribe('TIMER_UPDATED', (data) => {
            this.updateTimerDisplay(data.elapsedSeconds);
        });
        
        // 计时器状态变�?
        this.eventBus.subscribe('TIMER_STARTED', () => {
            this.updateTimerButtonStates('running');
        });
        
        this.eventBus.subscribe('TIMER_PAUSED', () => {
            this.updateTimerButtonStates('paused');
        });
        
        this.eventBus.subscribe('TIMER_RESET', () => {
            this.updateTimerButtonStates('stopped');
        });
        
        // 排行榜更�?
        this.eventBus.subscribe('RANKING_SAVED_LOCAL', (data) => {
            this.showNotification('记录已保存到本地排行�?, 'success');
        });
        
        // 加载状�?
        this.eventBus.subscribe('UI_LOADING_START', (data) => {
            this.showLoading(data.message || '加载�?..');
        });
        
        this.eventBus.subscribe('UI_LOADING_END', () => {
            this.hideLoading();
        });
        
        // 错误提示
        this.eventBus.subscribe('UI_ERROR', (data) => {
            this.showError(data.message || '发生了一个错�?);
        });
    }
    
    /**
     * 更新选中的罪人显�?
     */
    updateSelectedSinner(sinner) {
        if (!sinner) {
            if (this.domElements.selectedSinnerName) {
                this.domElements.selectedSinnerName.textContent = '未选择';
            }
            if (this.domElements.selectedSinnerImage) {
                this.domElements.selectedSinnerImage.innerHTML = '<div class="placeholder">?</div>';
            }
            return;
        }
        
        // 更新罪人名称
        if (this.domElements.selectedSinnerName) {
            this.domElements.selectedSinnerName.textContent = sinner.name || '未知';
        }
        
        // 更新罪人头像
        if (this.domElements.selectedSinnerImage) {
            this.updateImageElement(
                this.domElements.selectedSinnerImage,
                sinner.avatar || '',
                sinner.name || '罪人',
                sinner.color || '#999'
            );
        }
        
        this.logger.debug('罪人显示已更�?', sinner.name);
    }
    
    /**
     * 更新选中的人格显�?
     */
    updateSelectedPersona(persona) {
        if (!persona) {
            if (this.domElements.selectedPersonaName) {
                this.domElements.selectedPersonaName.textContent = '未选择';
            }
            if (this.domElements.selectedPersonaImage) {
                this.domElements.selectedPersonaImage.innerHTML = '<div class="placeholder">?</div>';
            }
            return;
        }
        
        // 更新人格名称
        if (this.domElements.selectedPersonaName) {
            this.domElements.selectedPersonaName.textContent = persona.name || '未知';
        }
        
        // 更新人格头像
        if (this.domElements.selectedPersonaImage) {
            this.updateImageElement(
                this.domElements.selectedPersonaImage,
                persona.avatar || '',
                persona.name || '人格'
            );
        }
        
        this.logger.debug('人格显示已更�?', persona.name);
    }
    
    /**
     * 更新图像元素，带有错误处�?
     */
    updateImageElement(element, imagePath, fallbackText, backgroundColor) {
        if (!element) return;
        
        if (!imagePath) {
            // 没有图片路径，显示占位符
            const bgColor = backgroundColor || '#999';
            element.innerHTML = `<div class="placeholder" style="background-color: ${bgColor}">?</div>`;
            element.setAttribute('data-loaded', 'error');
            return;
        }
        
        // 创建新的图像元素
        const img = new Image();
        
        img.onload = () => {
            element.innerHTML = '';
            element.appendChild(img);
            element.setAttribute('data-loaded', 'success');
            this.logger.debug('图像加载成功:', imagePath);
        };
        
        img.onerror = () => {
            // 图像加载失败，显示占位符
            const bgColor = backgroundColor || '#999';
            element.innerHTML = `<div class="placeholder" style="background-color: ${bgColor}">?</div>`;
            element.setAttribute('data-loaded', 'error');
            this.logger.warn('图像加载失败:', imagePath);
        };
        
        img.src = imagePath;
        img.alt = fallbackText;
    }
    
    /**
     * 更新滚动按钮状�?
     */
    updateScrollButtonStates(isScrolling) {
        const buttonGroup = this.domElements.scrollBtnGroup;
        if (!buttonGroup) return;
        
        const startBtns = buttonGroup.querySelectorAll('[data-action="scroll-start"]');
        const stopBtns = buttonGroup.querySelectorAll('[data-action="scroll-stop"]');
        
        if (isScrolling) {
            startBtns.forEach(btn => {
                btn.disabled = true;
                btn.classList.add('disabled');
            });
            stopBtns.forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('disabled');
            });
        } else {
            startBtns.forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('disabled');
            });
            stopBtns.forEach(btn => {
                btn.disabled = true;
                btn.classList.add('disabled');
            });
        }
        
        this.logger.debug('滚动按钮状态已更新:', isScrolling ? '滚动�? : '停止');
    }
    
    /**
     * 更新计时器显�?
     */
    updateTimerDisplay(elapsedSeconds) {
        if (!this.domElements.timerDisplay) return;
        
        const hours = Math.floor(elapsedSeconds / 3600);
        const minutes = Math.floor((elapsedSeconds % 3600) / 60);
        const seconds = elapsedSeconds % 60;
        
        const timeString = [hours, minutes, seconds]
            .map(v => String(v).padStart(2, '0'))
            .join(':');
        
        this.domElements.timerDisplay.textContent = timeString;
    }
    
    /**
     * 更新计时器按钮状�?
     */
    updateTimerButtonStates(state) {
        const group = this.domElements.timerBtnGroup;
        if (!group) return;
        
        const startBtn = group.querySelector('[data-action="timer-start"]');
        const pauseBtn = group.querySelector('[data-action="timer-pause"]');
        const resetBtn = group.querySelector('[data-action="timer-reset"]');
        
        if (state === 'running') {
            if (startBtn) startBtn.disabled = true;
            if (pauseBtn) pauseBtn.disabled = false;
            if (resetBtn) resetBtn.disabled = true;
        } else if (state === 'paused') {
            if (startBtn) startBtn.disabled = false;
            if (pauseBtn) pauseBtn.disabled = true;
            if (resetBtn) resetBtn.disabled = false;
        } else {
            // stopped
            if (startBtn) startBtn.disabled = false;
            if (pauseBtn) pauseBtn.disabled = true;
            if (resetBtn) resetBtn.disabled = true;
        }
        
        this.logger.debug('计时器按钮状态已更新:', state);
    }
    
    /**
     * 显示通知
     */
    showNotification(message, type = 'info', duration = 3000) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        notification.textContent = message;
        
        // 添加到页�?
        document.body.appendChild(notification);
        
        // 触发动画
        setTimeout(() => notification.classList.add('show'), 10);
        
        // 自动关闭
        if (duration > 0) {
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }
        
        this.logger.debug(`通知 [${type}]:`, message);
    }
    
    /**
     * 显示加载状�?
     */
    showLoading(message = '加载�?..') {
        if (!this.domElements.loadingOverlay) {
            // 如果不存在，创建加载覆盖�?
            const overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.setAttribute('data-ui', 'loading-overlay');
            overlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p class="loading-text">${message}</p>
                </div>
            `;
            document.body.appendChild(overlay);
            this.domElements.loadingOverlay = overlay;
        } else {
            const text = this.domElements.loadingOverlay.querySelector('.loading-text');
            if (text) text.textContent = message;
        }
        
        this.domElements.loadingOverlay.classList.add('active');
        this.logger.debug('加载状态已显示');
    }
    
    /**
     * 隐藏加载状�?
     */
    hideLoading() {
        if (this.domElements.loadingOverlay) {
            this.domElements.loadingOverlay.classList.remove('active');
        }
        this.logger.debug('加载状态已隐藏');
    }
    
    /**
     * 显示错误
     */
    showError(message, duration = 5000) {
        this.showNotification(message, 'error', duration);
    }
    
    /**
     * 更新统计信息显示
     */
    updateStats(sinnerCount, personaCount) {
        if (this.domElements.sinnerCountDisplay) {
            this.domElements.sinnerCountDisplay.textContent = sinnerCount;
        }
        if (this.domElements.personaCountDisplay) {
            this.domElements.personaCountDisplay.textContent = personaCount;
        }
        
        this.logger.debug(`统计已更�? 罪人${sinnerCount}, 人格${personaCount}`);
    }
    
    /**
     * 禁用/启用按钮
     */
    setButtonState(selector, disabled) {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach(btn => {
            btn.disabled = disabled;
            if (disabled) {
                btn.classList.add('disabled');
            } else {
                btn.classList.remove('disabled');
            }
        });
    }
    
    /**
     * 切换页面显示
     */
    switchPage(pageName) {
        // 隐藏所有页�?
        const pages = document.querySelectorAll('[data-page]');
        pages.forEach(page => page.style.display = 'none');
        
        // 显示目标页面
        const targetPage = document.querySelector(`[data-page="${pageName}"]`);
        if (targetPage) {
            targetPage.style.display = 'block';
        }
        
        // 更新导航按钮
        const navBtns = document.querySelectorAll('[data-nav-btn]');
        navBtns.forEach(btn => {
            if (btn.getAttribute('data-nav-btn') === pageName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        this.logger.debug('页面已切�?', pageName);
    }
}



