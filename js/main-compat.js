/**
 * main-compat.js - main.js的兼容层
 * 
 * 提供旧的全局函数和变量接口，映射到新的架构
 * 这个文件确保旧的index.html可以继续工作
 * 
 * 兼容方法：
 * - 全局变量仍然通过window访问（映射到AppState）
 * - 旧函数名仍然可用（映射到新的Controllers）
 * - 事件仍然可以通过EventBus处理
 */

/**
 * 初始化主程序兼容层
 * 这个函数应该在new main.js加载后调用
 */
export function initMainCompat() {
    if (!window.appState) {
        console.error('main-compat: AppState未初始化，请确保main-new.js已加载');
        return false;
    }
    
    const appState = window.appState;
    const eventBus = window.eventBus;
    const controllers = window.controllers;
    
    // ==================== 全局变量兼容性 ====================
    
    /**
     * 创建代理对象以访问应用状态中的全局变量
     */
    const stateProxy = {
        // 筛选相关
        get filteredSinnerData() {
            return appState.get('app.filteredSinnerData') || [];
        },
        set filteredSinnerData(value) {
            appState.set('app.filteredSinnerData', value);
        },
        
        // 选择相关
        get currentSelectedSinner() {
            return appState.get('game.selectedSinner');
        },
        set currentSelectedSinner(value) {
            appState.set('game.selectedSinner', value);
        },
        
        get currentSelectedPersona() {
            return appState.get('game.selectedPersona');
        },
        set currentSelectedPersona(value) {
            appState.set('game.selectedPersona', value);
        },
        
        // 人格筛选
        get filteredPersonalityData() {
            return appState.get('filters.personalities') || new Map();
        },
        set filteredPersonalityData(value) {
            appState.set('filters.personalities', value);
        },
        
        // 滚动状态
        get isScrolling() {
            return appState.get('game.isScrolling') || false;
        },
        set isScrolling(value) {
            appState.set('game.isScrolling', value);
        },
        
        // 计时器状态
        get timerStatus() {
            return appState.get('timer.isRunning') ? 'running' : 'stopped';
        },
        set timerStatus(value) {
            appState.set('timer.isRunning', value === 'running');
        },
        
        get elapsedSeconds() {
            return appState.get('timer.elapsedSeconds') || 0;
        },
        set elapsedSeconds(value) {
            appState.set('timer.elapsedSeconds', value);
        }
    };
    
    // 将代理对象挂载到window，以便兼容旧代码
    window.mainState = stateProxy;
    
    // ==================== 全局函数兼容性 ====================
    
    /**
     * 应用筛选 - 映射到FilterController
     */
    window.applyFiltersCompat = function() {
        if (controllers.filterController) {
            controllers.filterController.applyFilters();
        }
    };
    
    /**
     * 创建人格设置 - 映射到SettingsController
     */
    window.createPersonalitySettingsCompat = function() {
        if (controllers.settingsController) {
            controllers.settingsController.createPersonalitySettings();
        }
    };
    
    /**
     * 创建罪人滚动列表 - 映射到ScrollController
     */
    window.createSinnerScrollListCompat = function(sinnerList) {
        if (controllers.scrollController) {
            controllers.scrollController.createSinnerScrollList(sinnerList);
        }
    };
    
    /**
     * 创建人格滚动列表 - 映射到ScrollController
     */
    window.createPersonaScrollListCompat = function(personaList) {
        if (controllers.scrollController) {
            controllers.scrollController.createPersonaScrollList(personaList);
        }
    };
    
    /**
     * 启动罪人滚动 - 映射到ScrollController
     */
    window.startSinnerScrollCompat = function() {
        if (controllers.scrollController) {
            controllers.scrollController.startSinnerScroll();
        }
    };
    
    /**
     * 停止罪人滚动 - 映射到ScrollController
     */
    window.stopSinnerScrollCompat = function() {
        if (controllers.scrollController) {
            controllers.scrollController.stopSinnerScroll();
        }
    };
    
    /**
     * 启动人格滚动 - 映射到ScrollController
     */
    window.startPersonaScrollCompat = function() {
        if (controllers.scrollController) {
            controllers.scrollController.startPersonaScroll();
        }
    };
    
    /**
     * 停止人格滚动 - 映射到ScrollController
     */
    window.stopPersonaScrollCompat = function() {
        if (controllers.scrollController) {
            controllers.scrollController.stopPersonaScroll();
        }
    };
    
    /**
     * 启动计时器 - 映射到TimerController
     */
    window.startTimerCompat = function() {
        if (controllers.timerController) {
            controllers.timerController.startTimer();
        }
    };
    
    /**
     * 暂停计时器 - 映射到TimerController
     */
    window.pauseTimerCompat = function() {
        if (controllers.timerController) {
            controllers.timerController.pauseTimer();
        }
    };
    
    /**
     * 重置计时器 - 映射到TimerController
     */
    window.resetTimerCompat = function() {
        if (controllers.timerController) {
            controllers.timerController.resetTimer();
        }
    };
    
    /**
     * 保存到本地排行榜 - 映射到RankingApiController
     */
    window.saveToLocalRankingCompat = function(sinner, persona, time, note) {
        if (controllers.rankingApiController) {
            return controllers.rankingApiController.saveToLocalRanking(sinner, persona, time, note);
        }
    };
    
    /**
     * 上传到全局排行榜 - 映射到UploadController
     */
    window.uploadToGlobalRankingCompat = async function() {
        if (controllers.uploadController) {
            return controllers.uploadController.uploadToGlobalRanking();
        }
    };
    
    /**
     * 查看排行榜 - 映射到RankingApiController
     */
    window.viewRankingCompat = function() {
        if (controllers.rankingApiController) {
            controllers.rankingApiController.viewRanking();
        }
    };
    
    // ==================== 事件兼容性 ====================
    
    /**
     * 订阅事件 - 映射到EventBus
     */
    window.onEventCompat = function(eventName, callback) {
        if (eventBus) {
            eventBus.subscribe(eventName, callback);
        }
    };
    
    /**
     * 发送事件 - 映射到EventBus
     */
    window.emitEventCompat = function(eventName, data) {
        if (eventBus) {
            eventBus.emit(eventName, data);
        }
    };
    
    // ==================== 调试助手 ====================
    
    /**
     * 打印应用状态
     */
    window.debugAppStateCompat = function() {
        console.log('=== AppState Debug ===');
        console.log('appState:', appState.getState());
        console.log('controllers:', window.controllers);
        console.log('eventBus:', eventBus);
    };
    
    /**
     * 打印事件日志
     */
    window.debugEventsCompat = function() {
        console.log('=== Event Log ===');
        if (window.logger) {
            window.logger.showLog();
        }
    };
    
    console.log('main-compat: 兼容层初始化完成');
    return true;
}

/**
 * 在main.js加载完成后初始化兼容层
 */
if (window.appState && window.eventBus) {
    initMainCompat();
}

export { initMainCompat };
