/**
 * TimerController - 计时器模�?
 * 负责游戏运行时间的计时、显示、控�?
 * 
 * 功能�?
 * - 启动、暂停、重置计时器
 * - 实时显示时间（HH:MM:SS�?
 * - 时间格式�?
 * - 时间持久化到AppState
 */

export class TimerController {
    constructor(appState, eventBus, logger) {
        this.appState = appState;
        this.eventBus = eventBus;
        this.logger = logger;
        
        // DOM元素（延迟初始化�?
        this.timerDisplay = null;
        this.startBtn = null;
        this.pauseBtn = null;
        this.resetBtn = null;
        
        // 计时器状�?
        this.timerInterval = null;
        this.isRunning = false;
        
        // 绑定方法
        this.startTimer = this.startTimer.bind(this);
        this.pauseTimer = this.pauseTimer.bind(this);
        this.resetTimer = this.resetTimer.bind(this);
        
        this.logger.debug('TimerController已初始化');
    }
    
    /**
     * 初始化DOM元素
     * @param {Object} domElements - 包含必需DOM元素的对�?
     */
    initDOM(domElements) {
        try {
            this.timerDisplay = domElements.timerDisplay || document.getElementById('timer-display');
            this.startBtn = domElements.startBtn || document.getElementById('timer-start-btn');
            this.pauseBtn = domElements.pauseBtn || document.getElementById('timer-pause-btn');
            this.resetBtn = domElements.resetBtn || document.getElementById('timer-reset-btn');
            
            // 绑定事件监听�?
            this.startBtn?.addEventListener('click', this.startTimer);
            this.pauseBtn?.addEventListener('click', this.pauseTimer);
            this.resetBtn?.addEventListener('click', this.resetTimer);
            
            // 初始化显�?
            this.updateDisplay();
            
            this.logger.debug('TimerController DOM初始化完�?);
        } catch (error) {
            this.logger.error('TimerController DOM初始化失�?, error);
            throw error;
        }
    }
    
    /**
     * 启动计时�?
     */
    startTimer = () => {
        try {
            if (this.isRunning) return;
            
            this.isRunning = true;
            this.appState.set('timer.isRunning', true);
            
            if (this.startBtn) this.startBtn.disabled = true;
            if (this.pauseBtn) this.pauseBtn.disabled = false;
            
            this.timerInterval = setInterval(() => {
                const current = this.appState.get('timer.elapsedSeconds') || 0;
                this.appState.set('timer.elapsedSeconds', current + 1);
                this.updateDisplay();
            }, 1000);
            
            this.eventBus.emit('TIMER_STARTED', { elapsedSeconds: this.appState.get('timer.elapsedSeconds') });
            this.logger.debug('计时器已启动');
        } catch (error) {
            this.logger.error('启动计时器失�?, error);
        }
    }
    
    /**
     * 暂停计时�?
     */
    pauseTimer = () => {
        try {
            if (!this.isRunning) return;
            
            this.isRunning = false;
            this.appState.set('timer.isRunning', false);
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            
            if (this.startBtn) this.startBtn.disabled = false;
            if (this.pauseBtn) this.pauseBtn.disabled = true;
            
            this.eventBus.emit('TIMER_PAUSED', { elapsedSeconds: this.appState.get('timer.elapsedSeconds') });
            this.logger.debug('计时器已暂停');
        } catch (error) {
            this.logger.error('暂停计时器失�?, error);
        }
    }
    
    /**
     * 重置计时�?
     */
    resetTimer = () => {
        try {
            this.pauseTimer();
            this.appState.set('timer.elapsedSeconds', 0);
            this.updateDisplay();
            
            this.eventBus.emit('TIMER_RESET', { elapsedSeconds: 0 });
            this.logger.debug('计时器已重置');
        } catch (error) {
            this.logger.error('重置计时器失�?, error);
        }
    }
    
    /**
     * 更新显示
     */
    updateDisplay() {
        try {
            const seconds = this.appState.get('timer.elapsedSeconds') || 0;
            const formatted = this.formatTime(seconds);
            
            if (this.timerDisplay) {
                this.timerDisplay.textContent = formatted;
            }
        } catch (error) {
            this.logger.error('更新显示失败', error);
        }
    }
    
    /**
     * 格式化时间（�?-> HH:MM:SS�?
     * @param {number} seconds - 秒数
     * @returns {string} 格式化的时间字符�?
     */
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * 获取当前经过的秒�?
     * @returns {number}
     */
    getElapsedSeconds() {
        return this.appState.get('timer.elapsedSeconds') || 0;
    }
    
    /**
     * 检查计时器是否运行�?
     * @returns {boolean}
     */
    isTimerRunning() {
        return this.isRunning;
    }
    
    /**
     * 清理方法
     */
    destroy() {
        if (this.isRunning) {
            this.pauseTimer();
        }
        
        this.startBtn?.removeEventListener('click', this.startTimer);
        this.pauseBtn?.removeEventListener('click', this.pauseTimer);
        this.resetBtn?.removeEventListener('click', this.resetTimer);
        
        this.logger.debug('TimerController已销�?);
    }
}

export default TimerController;



