/**
 * ui-compat.js - UI层兼容层
 * 
 * 提供旧的UI接口，映射到新的UIController
 */

export function initUICompat() {
    if (!window.controllers || !window.controllers.uiController) {
        console.warn('ui-compat: UIController未初始化');
        return false;
    }
    
    const uiController = window.controllers.uiController;
    const Modal = window.Modal || null;
    
    // ==================== 全局UI函数 ====================
    
    /**
     * 显示通知
     */
    window.showNotificationCompat = function(message, type = 'info', duration = 3000) {
        uiController.showNotification(message, type, duration);
    };
    
    /**
     * 显示加载
     */
    window.showLoadingCompat = function(message = '加载中...') {
        uiController.showLoading(message);
    };
    
    /**
     * 隐藏加载
     */
    window.hideLoadingCompat = function() {
        uiController.hideLoading();
    };
    
    /**
     * 显示错误
     */
    window.showErrorCompat = function(message, duration = 5000) {
        uiController.showError(message, duration);
    };
    
    /**
     * 更新统计信息
     */
    window.updateStatsCompat = function(sinnerCount, personaCount) {
        uiController.updateStats(sinnerCount, personaCount);
    };
    
    /**
     * 禁用/启用按钮
     */
    window.setButtonStateCompat = function(selector, disabled) {
        uiController.setButtonState(selector, disabled);
    };
    
    /**
     * 切换页面
     */
    window.switchPageCompat = function(pageName) {
        uiController.switchPage(pageName);
    };
    
    /**
     * 更新图像
     */
    window.updateImageCompat = function(element, imagePath, fallbackText, bgColor) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        uiController.updateImageElement(element, imagePath, fallbackText, bgColor);
    };
    
    // ==================== Modal兼容 ====================
    
    /**
     * 创建兼容的Modal对象
     */
    window.ModalCompat = {
        alert: (message, title = '提示') => {
            if (Modal && Modal.alert) {
                return Modal.alert(message, title);
            }
            return Promise.resolve(true);
        },
        
        confirm: (message, title = '确认') => {
            if (Modal && Modal.confirm) {
                return Modal.confirm(message, title);
            }
            return Promise.resolve(false);
        },
        
        prompt: (message, title = '输入', defaultValue = '') => {
            if (Modal && Modal.prompt) {
                return Modal.prompt(message, title, defaultValue);
            }
            return Promise.resolve(null);
        }
    };
    
    console.log('ui-compat: UI兼容层初始化完成');
    return true;
}

/**
 * 在UIController加载完成后初始化兼容层
 */
if (window.controllers && window.controllers.uiController) {
    initUICompat();
}

export { initUICompat };
