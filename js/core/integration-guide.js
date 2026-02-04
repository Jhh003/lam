/**
 * LAM 项目新架构集成指南
 * 
 * 本文档展示如何在项目中使用新的核心架构模块
 * (AppState、EventBus、Logger)
 * 
 * @file 集成指南示例
 */

// ============================================================================
// 第一部分：基础导入和初始化
// ============================================================================

import { appState } from './core/appState.js';
import { eventBus, GameEvents } from './core/eventBus.js';
import { logger, LogLevel } from './core/logger.js';

/**
 * 应用初始化函数
 */
export function initializeApp() {
    logger.info('应用初始化开始...');
    
    // 1. 连接AppState和EventBus（循环依赖）
    appState.setEventBus(eventBus);
    
    // 2. 设置事件总线的错误处理
    eventBus.onError(({ message, error, eventName }) => {
        logger.error(`事件处理错误 (${eventName}): ${message}`, error);
    });
    
    // 3. 订阅关键事件进行日志记录
    setupEventLogging();
    
    // 4. 初始化各个功能模块
    // initializeScrollModule();
    // initializeFilterModule();
    // initializeTimerModule();
    // ... 其他模块
    
    // 标记应用已初始化
    appState.set('app.isInitialized', true);
    eventBus.emit(GameEvents.APP_INITIALIZED);
    
    logger.info('应用初始化完成!');
}

// ============================================================================
// 第二部分：日志设置
// ============================================================================

/**
 * 设置事件日志
 * 所有重要事件都会被记录
 */
function setupEventLogging() {
    // 订阅关键事件并记录
    const importantEvents = [
        GameEvents.SINNER_SELECTED,
        GameEvents.PERSONA_SELECTED,
        GameEvents.TIMER_START,
        GameEvents.TIMER_STOP,
        GameEvents.RECORD_SUBMITTED,
        GameEvents.ERROR
    ];
    
    importantEvents.forEach(eventName => {
        eventBus.subscribe(eventName, (data) => {
            logger.debug(`事件: ${eventName}`, data);
        });
    });
}

// ============================================================================
// 第三部分：AppState 使用示例
// ============================================================================

/**
 * 示例：管理选择的罪人和人格
 */
export class GameController {
    constructor() {
        logger.info('GameController 初始化');
        
        // 订阅选择事件
        eventBus.subscribe(GameEvents.SINNER_SELECTED, this.onSinnerSelected.bind(this));
        eventBus.subscribe(GameEvents.PERSONA_SELECTED, this.onPersonaSelected.bind(this));
    }
    
    /**
     * 罪人被选择时的处理
     */
    onSinnerSelected(sinner) {
        // 使用AppState存储选择
        appState.setSinner(sinner);
        
        // 重置人格选择
        appState.setPersona(null);
        
        // 发出选择事件通知UI
        eventBus.emit(GameEvents.SINNER_SELECTED, sinner);
        
        logger.info(`选中罪人: ${sinner.name}`, sinner);
    }
    
    /**
     * 人格被选择时的处理
     */
    onPersonaSelected(persona) {
        const sinner = appState.getSinner();
        
        if (!sinner) {
            logger.warn('尝试选择人格但未选择罪人');
            return;
        }
        
        // 存储选择
        appState.setPersona(persona);
        
        // 通知UI更新
        eventBus.emit(GameEvents.PERSONA_SELECTED, {
            sinner,
            persona
        });
        
        logger.info(`选中人格: ${persona.name}`, persona);
    }
    
    /**
     * 获取当前的选择
     */
    getCurrentSelection() {
        return {
            sinner: appState.getSinner(),
            persona: appState.getPersona()
        };
    }
}

// ============================================================================
// 第四部分：过滤器系统
// ============================================================================

/**
 * 过滤器管理
 */
export class FilterController {
    constructor() {
        logger.info('FilterController 初始化');
        
        // 订阅过滤器变化
        eventBus.subscribe(GameEvents.SINNER_FILTER_CHANGED, 
            this.onSinnerFilterChanged.bind(this)
        );
        eventBus.subscribe(GameEvents.PERSONA_FILTER_CHANGED,
            this.onPersonaFilterChanged.bind(this)
        );
    }
    
    /**
     * 更新罪人过滤器
     * @param {Set<number>} sinnerIds - 启用的罪人ID集合
     */
    updateSinnerFilters(sinnerIds) {
        const timer = logger.time('更新罪人过滤');
        
        // 验证
        if (!(sinnerIds instanceof Set)) {
            logger.warn('sinnerIds 必须是 Set 类型');
            return;
        }
        
        // 更新状态
        appState.setSinnerFilters(sinnerIds);
        
        // 发出事件
        eventBus.emit(GameEvents.SINNER_FILTER_CHANGED, {
            enabledCount: sinnerIds.size
        });
        
        timer();
    }
    
    /**
     * 更新人格过滤器
     * @param {Map<number, Set<number>>} personaFilters
     */
    updatePersonaFilters(personaFilters) {
        appState.setPersonaFilters(personaFilters);
        eventBus.emit(GameEvents.PERSONA_FILTER_CHANGED, {
            filterCount: personaFilters.size
        });
    }
    
    /**
     * 获取过滤后的罪人列表
     * @param {Array} allSinners - 所有罪人列表
     * @returns {Array} 过滤后的罪人列表
     */
    getFilteredSinners(allSinners) {
        const enabledIds = appState.getSinnerFilters();
        return allSinners.filter(sinner => enabledIds.has(sinner.id));
    }
    
    /**
     * 检查罪人是否启用
     */
    isSinnerEnabled(sinnerId) {
        return appState.isSinnerEnabled(sinnerId);
    }
    
    /**
     * 全选所有罪人
     */
    enableAllSinners(sinnerIds) {
        this.updateSinnerFilters(new Set(sinnerIds));
        logger.info('启用所有罪人');
    }
    
    /**
     * 反转选择
     */
    invertSelection(allSinnerIds) {
        const current = appState.getSinnerFilters();
        const inverted = new Set(
            allSinnerIds.filter(id => !current.has(id))
        );
        this.updateSinnerFilters(inverted);
        logger.info('反转罪人选择');
    }
    
    onSinnerFilterChanged(data) {
        logger.debug('罪人过滤器已变化', data);
    }
    
    onPersonaFilterChanged(data) {
        logger.debug('人格过滤器已变化', data);
    }
}

// ============================================================================
// 第五部分：计时器系统
// ============================================================================

/**
 * 计时器控制器
 */
export class TimerController {
    constructor() {
        logger.info('TimerController 初始化');
        this.timerInterval = null;
        
        // 订阅计时事件
        eventBus.subscribe(GameEvents.TIMER_START, this.onTimerStart.bind(this));
        eventBus.subscribe(GameEvents.TIMER_STOP, this.onTimerStop.bind(this));
        eventBus.subscribe(GameEvents.TIMER_RESET, this.onTimerReset.bind(this));
    }
    
    /**
     * 开始计时
     */
    startTimer() {
        const timerState = appState.get('timer');
        
        if (timerState.isRunning) {
            logger.warn('计时器已在运行');
            return;
        }
        
        appState.startTimer();
        
        // 启动计时循环
        this.timerInterval = setInterval(() => {
            const elapsed = appState.getElapsedSeconds();
            appState.setElapsedSeconds(elapsed + 1);
            
            // 定期发出tick事件（避免过于频繁）
            if (elapsed % 1 === 0) {
                eventBus.emit(GameEvents.TIMER_TICK, {
                    seconds: elapsed,
                    time: this.formatTime(elapsed)
                });
            }
        }, 1000);
        
        eventBus.emit(GameEvents.TIMER_START);
        logger.info('计时器已启动');
    }
    
    /**
     * 停止计时
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        appState.stopTimer();
        
        const elapsed = appState.getElapsedSeconds();
        eventBus.emit(GameEvents.TIMER_STOP, {
            totalSeconds: elapsed,
            time: this.formatTime(elapsed)
        });
        
        logger.info(`计时器已停止，耗时: ${elapsed}秒`);
        
        // 自动保存记录
        if (elapsed >= 7200) { // 2小时
            this.saveRecord();
        }
    }
    
    /**
     * 重置计时器
     */
    resetTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        appState.resetTimer();
        eventBus.emit(GameEvents.TIMER_RESET);
        logger.info('计时器已重置');
    }
    
    /**
     * 获取当前耗时
     */
    getElapsedTime() {
        return appState.getElapsedSeconds();
    }
    
    /**
     * 格式化时间
     */
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    /**
     * 保存游戏记录
     */
    saveRecord() {
        const selection = {
            sinner: appState.getSinner(),
            persona: appState.getPersona(),
            elapsedSeconds: appState.getElapsedSeconds()
        };
        
        // 验证
        if (!selection.sinner || !selection.persona) {
            logger.warn('无法保存记录：缺少选择的罪人或人格');
            return;
        }
        
        // 添加本地记录
        appState.addLocalRecord(selection);
        eventBus.emit(GameEvents.LOCAL_RECORD_SAVED, selection);
        
        logger.info('游戏记录已保存', selection);
    }
    
    onTimerStart() {
        logger.debug('计时器启动事件');
    }
    
    onTimerStop() {
        logger.debug('计时器停止事件');
    }
    
    onTimerReset() {
        logger.debug('计时器重置事件');
    }
}

// ============================================================================
// 第六部分：UI 更新处理器
// ============================================================================

/**
 * UI渲染管理器
 * 负责响应事件并更新UI
 */
export class UIRenderer {
    constructor() {
        logger.info('UIRenderer 初始化');
        
        // 监听所有重要事件
        eventBus.subscribe(GameEvents.SINNER_SELECTED, this.updateSinnerDisplay.bind(this));
        eventBus.subscribe(GameEvents.PERSONA_SELECTED, this.updatePersonaDisplay.bind(this));
        eventBus.subscribe(GameEvents.TIMER_TICK, this.updateTimerDisplay.bind(this));
        eventBus.subscribe(GameEvents.FILTER_CHANGED, this.updateFilterUI.bind(this));
    }
    
    /**
     * 更新显示的罪人信息
     */
    updateSinnerDisplay(sinner) {
        const sinnerDisplay = document.getElementById('selected-sinner');
        if (sinnerDisplay) {
            sinnerDisplay.textContent = sinner ? sinner.name : '未选择';
        }
        logger.debug('更新罪人显示:', sinner?.name);
    }
    
    /**
     * 更新显示的人格信息
     */
    updatePersonaDisplay(data) {
        const personaDisplay = document.getElementById('selected-persona');
        if (personaDisplay) {
            const persona = data.persona || data;
            personaDisplay.textContent = persona ? persona.name : '未选择';
        }
        logger.debug('更新人格显示:', data.persona?.name);
    }
    
    /**
     * 更新计时器显示
     */
    updateTimerDisplay(data) {
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = data.time;
        }
    }
    
    /**
     * 更新过滤器UI
     */
    updateFilterUI(data) {
        logger.debug('更新过滤器UI', data);
        // 更新复选框状态等
    }
}

// ============================================================================
// 第七部分：排行榜系统
// ============================================================================

/**
 * 排行榜管理器
 */
export class RankingController {
    constructor() {
        logger.info('RankingController 初始化');
        
        eventBus.subscribe(GameEvents.RECORD_SUBMITTED, 
            this.onRecordSubmitted.bind(this)
        );
    }
    
    /**
     * 提交记录到全球排行榜
     */
    async submitRecord(record) {
        const timer = logger.time('提交记录到全球排行榜');
        
        try {
            // 验证记录
            if (!this.validateRecord(record)) {
                logger.warn('无效的记录');
                return false;
            }
            
            // 提交到GitHub Issues
            const success = await this.submitToGitHub(record);
            
            if (success) {
                eventBus.emit(GameEvents.RECORD_SUBMITTED, record);
                logger.info('记录已成功提交');
            }
            
            timer();
            return success;
        } catch (error) {
            logger.error('提交记录失败', error);
            timer();
            return false;
        }
    }
    
    /**
     * 验证记录有效性
     */
    validateRecord(record) {
        if (!record.sinner || !record.persona) {
            return false;
        }
        
        // 验证时间（至少2小时）
        if (record.elapsedSeconds < 7200) {
            logger.warn(`记录耗时过短: ${record.elapsedSeconds}秒`);
            return false;
        }
        
        return true;
    }
    
    /**
     * 提交到GitHub（实现示例）
     */
    async submitToGitHub(record) {
        // 实现提交逻辑
        return true;
    }
    
    /**
     * 加载全球排行榜
     */
    async loadGlobalRanking() {
        try {
            // 从文件加载
            const response = await fetch('data/global-ranking.json');
            const records = await response.json();
            
            appState.setGlobalRecords(records);
            eventBus.emit(GameEvents.RANKING_UPDATED);
            
            logger.info(`已加载 ${records.length} 条全球排行记录`);
        } catch (error) {
            logger.error('加载全球排行失败', error);
        }
    }
    
    /**
     * 获取本地排行榜
     */
    getLocalRanking() {
        return appState.getLocalRecords();
    }
    
    /**
     * 获取全球排行榜
     */
    getGlobalRanking() {
        return appState.getGlobalRecords();
    }
    
    onRecordSubmitted(record) {
        logger.info('记录已提交:', record);
    }
}

// ============================================================================
// 第八部分：调试和监控
// ============================================================================

/**
 * 调试工具
 * 用于开发过程中的调试和监控
 */
export class DebugTools {
    static init() {
        // 暴露到全局作用域，便于浏览器控制台访问
        window.__LAM_DEBUG__ = {
            appState: appState,
            eventBus: eventBus,
            logger: logger,
            
            // 快捷方法
            getState: (path) => appState.get(path),
            setState: (path, value) => appState.set(path, value),
            getStats: () => ({
                app: appState.getStats(),
                events: eventBus.getStats(),
                logs: logger.getStats()
            }),
            getLogs: () => logger.getLogs(),
            exportLogs: (format = 'json') => logger.exportAsJSON(),
            downloadLogs: (format = 'json') => logger.downloadLogs(format),
            enableDebug: () => {
                logger.setLevel(LogLevel.DEBUG);
                eventBus.enableDebug();
            },
            disableDebug: () => {
                logger.setLevel(LogLevel.INFO);
                eventBus.disableDebug();
            }
        };
        
        logger.info('调试工具已初始化，访问 window.__LAM_DEBUG__');
    }
}

// ============================================================================
// 第九部分：应用启动
// ============================================================================

/**
 * 完整的应用启动流程
 */
export async function bootApp() {
    try {
        // 初始化核心系统
        initializeApp();
        
        // 初始化各个控制器
        const gameController = new GameController();
        const filterController = new FilterController();
        const timerController = new TimerController();
        const rankingController = new RankingController();
        const uiRenderer = new UIRenderer();
        
        // 初始化调试工具
        if (process.env.NODE_ENV !== 'production') {
            DebugTools.init();
        }
        
        // 加载数据
        await rankingController.loadGlobalRanking();
        
        // 发出应用就绪事件
        eventBus.emit(GameEvents.APP_READY);
        logger.info('应用已就绪！');
        
        // 返回控制器供外部使用
        return {
            gameController,
            filterController,
            timerController,
            rankingController,
            uiRenderer
        };
        
    } catch (error) {
        logger.error('应用启动失败', error);
        eventBus.emit(GameEvents.ERROR, error);
        throw error;
    }
}

// ============================================================================
// 导出
// ============================================================================

export {
    appState,
    eventBus,
    logger,
    GameEvents
};
