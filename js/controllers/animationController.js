/**
 * AnimationController - 动画和视觉效果模�?
 * 负责倒计时显示、闪烁动画等视觉效果
 * 
 * 功能�?
 * - 初始化倒计时显�?
 * - 生成带闪烁动画的文本
 * - 管理动画生命周期
 */

export class AnimationController {
    constructor(appState, eventBus, logger) {
        this.appState = appState;
        this.eventBus = eventBus;
        this.logger = logger;
        
        // DOM元素（延迟初始化�?
        this.countdownElement = null;
        
        this.logger.debug('AnimationController已初始化');
    }
    
    /**
     * 初始化DOM元素
     * @param {Object} domElements - 包含必需DOM元素的对�?
     */
    initDOM(domElements) {
        try {
            this.countdownElement = domElements.countdownElement || 
                                   document.getElementById('countdown');
            
            if (this.countdownElement) {
                this.initCountdown();
            }
            
            this.logger.debug('AnimationController DOM初始化完�?);
        } catch (error) {
            this.logger.error('AnimationController DOM初始化失�?, error);
            throw error;
        }
    }
    
    /**
     * 初始化倒计时显�?
     */
    initCountdown() {
        try {
            if (!this.countdownElement) {
                this.logger.warn('倒计时元素未找到');
                return;
            }
            
            const countdownText = '第七赛季-蛛丝赤已经到来！';
            const animatedText = this.createAnimatedText(countdownText);
            this.countdownElement.innerHTML = animatedText;
            
            this.logger.debug('倒计时已初始�?);
        } catch (error) {
            this.logger.error('初始化倒计时失�?, error);
        }
    }
    
    /**
     * 创建带有闪烁动画效果的文�?
     * 原始实现已验证，保持不变
     * @param {string} text - 要动画化的文本（可包�?br>标签�?
     * @returns {string} HTML字符串，包含动画样式
     */
    createAnimatedText(text) {
        // 处理换行符，将文本分成多�?
        const lines = text.split('<br>');
        let result = '';
        
        lines.forEach((line, lineIndex) => {
            if (lineIndex > 0) {
                result += '<br>';
            }
            
            // 为整行添加season-text�?
            result += '<div class="season-text">';
            
            // 为每个字符添加glowIn类的span
            for (let i = 0; i < line.length; i++) {
                if (line[i] === ' ') {
                    // 空格保持原样
                    result += ' ';
                } else {
                    // 其他字符用span包裹并应用动�?
                    result += `<span class="glowIn"><span>${line[i]}</span></span>`;
                }
            }
            
            result += '</div>';
        });
        
        return result;
    }
    
    /**
     * 更新倒计时文�?
     * @param {string} text - 新的文本
     */
    updateCountdown(text) {
        try {
            if (!this.countdownElement) {
                this.logger.warn('倒计时元素未找到');
                return;
            }
            
            const animatedText = this.createAnimatedText(text);
            this.countdownElement.innerHTML = animatedText;
            
            this.logger.debug(`倒计时已更新: ${text}`);
        } catch (error) {
            this.logger.error('更新倒计时失�?, error);
        }
    }
    
    /**
     * 清理方法
     */
    destroy() {
        if (this.countdownElement) {
            this.countdownElement.innerHTML = '';
        }
        this.logger.debug('AnimationController已销�?);
    }
}

export default AnimationController;



