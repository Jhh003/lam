/**
 * main.js - 边狱公司应用主入口点
 * 
 * 架构特点：
 * - 使用AppState管理全局状态
 * - 通过EventBus实现模块通信
 * - 清晰的初始化流程
 * - 零全局变量污染
 * 
 * 初始化顺序：
 * 1. 导入所有模块
 * 2. 初始化核心服务（AppState, EventBus, Logger）
 * 3. 创建Controller实例
 * 4. 初始化DOM和事件监听
 * 5. 启动应用
 */

// ==================== 导入核心模块 ====================
import { sinnerData } from '../data/characters.js';
import { secureRandInt } from '../data/utils/helpers.js';
import { Config } from '../data/config.js';
import modal from './modal-new.js';
import UI from './ui.js';

// 导入核心服务
import { AppState } from './core/appState.js';
import { EventBus } from './core/eventBus.js';
import { Logger } from './core/logger.js';

// 导入Controllers
import { FilterController } from './controllers/filterController.js';
import { ScrollController } from './controllers/scrollController.js';
import { SettingsController } from './controllers/settingsController.js';
import { TimerController } from './controllers/timerController.js';
import { AnimationController } from './controllers/animationController.js';
import { RankingApiController } from './controllers/rankingApiController.js';
import { UploadController } from './controllers/uploadController.js';
import { UIController } from './controllers/uiController.js';

// ==================== 初始化核心服务 ====================

/**
 * 初始化应用的核心服务和状态管理
 */
function initializeCoreServices() {
    // 创建全局可用的核心服务实例
    window.appState = new AppState();
    window.eventBus = new EventBus();
    window.logger = new Logger();
    
    // AppState和EventBus关联
    window.appState.setEventBus(window.eventBus);
    
    window.logger.debug('核心服务已初始化');
    
    return {
        appState: window.appState,
        eventBus: window.eventBus,
        logger: window.logger
    };
}

/**
 * 初始化所有Controller实例
 */
function initializeControllers(services) {
    const controllers = {
        filterController: new FilterController(services.appState, services.eventBus, services.logger),
        scrollController: new ScrollController(services.appState, services.eventBus, services.logger, modal),
        settingsController: new SettingsController(services.appState, services.eventBus, services.logger),
        timerController: new TimerController(services.appState, services.eventBus, services.logger),
        animationController: new AnimationController(services.appState, services.eventBus, services.logger),
        rankingApiController: new RankingApiController(services.appState, services.eventBus, services.logger, modal),
        uploadController: new UploadController(services.appState, services.eventBus, services.logger, modal),
        uiController: new UIController(services.appState, services.eventBus, services.logger, modal)
    };
    
    // 保存到window以便调试和访问
    window.controllers = controllers;
    
    services.logger.debug('所有Controller已初始化');
    
    return controllers;
}

/**
 * 初始化DOM元素和事件监听
 */
function initializeDOMAndEvents(controllers, services) {
    // 获取所有必需的DOM元素
    const domElements = {
        // 页面容器
        mainSelectorPage: document.getElementById('main-selector-page'),
        settingsPage: document.getElementById('settings-page'),
        
        // 导航按钮
        mainPageBtn: document.getElementById('main-page-btn'),
        settingsPageBtn: document.getElementById('settings-page-btn'),
        
        // 滚动容器
        sinnerScroll: document.getElementById('sinner-scroll'),
        personaScroll: document.getElementById('persona-scroll'),
        
        // 滚动按钮
        sinnerStartBtn: document.getElementById('sinner-start-btn'),
        sinnerStopBtn: document.getElementById('sinner-stop-btn'),
        personaStartBtn: document.getElementById('persona-start-btn'),
        personaStopBtn: document.getElementById('persona-stop-btn'),
        
        // 选择显示
        selectedSinnerEl: document.getElementById('selected-sinner'),
        selectedPersonaEl: document.getElementById('selected-persona'),
        
        // 筛选容器
        sinnerFilterContainer: document.getElementById('sinner-filter'),
        settingsContainer: document.getElementById('personality-settings-container'),
        
        // 计时器
        timerDisplay: document.getElementById('timer-display'),
        timerStartBtn: document.getElementById('timer-start-btn'),
        timerPauseBtn: document.getElementById('timer-pause-btn'),
        timerResetBtn: document.getElementById('timer-reset-btn'),
        timerToggleBtn: document.getElementById('timer-toggle-btn'),
        
        // 倒计时
        countdownElement: document.getElementById('countdown'),
        
        // 排行榜和上传
        uploadGlobalBtn: document.getElementById('upload-global-btn'),
        uploadModal: document.getElementById('upload-modal'),
        uploadModalCloseBtn: document.getElementById('upload-modal-close-btn'),
        cancelUploadBtn: document.getElementById('cancel-upload-btn'),
        uploadGlobalForm: document.getElementById('upload-global-form'),
        uploadTypeRadios: document.querySelectorAll('input[name="uploadType"]'),
        fullUploadFields: document.getElementById('full-upload-fields'),
        floorOnlyUploadFields: document.getElementById('floor-only-upload-fields'),
        fullTimeDisplay: document.getElementById('full-time-display'),
        rankingPageBtn: document.getElementById('ranking-page-btn'),
        
        // 帮助
        helpBtn: document.getElementById('help-btn'),
        helpModal: document.getElementById('help-modal'),
        helpCloseBtn: document.getElementById('help-close-btn')
    };
    
    // 初始化各个Controller的DOM
    controllers.filterController.initDOM(domElements);
    controllers.scrollController.initDOM(domElements);
    controllers.settingsController.initDOM(domElements);
    controllers.timerController.initDOM(domElements);
    controllers.animationController.initDOM(domElements);
    controllers.uploadController.initDOM(domElements);
    
    services.logger.debug('DOM已初始化');
    
    // 初始化页面导航
    initializePageNavigation(domElements, controllers, services);
    
    // 初始化帮助模态窗口
    initializeHelpModal(domElements);
}

/**
 * 初始化页面导航逻辑
 */
function initializePageNavigation(domElements, controllers, services) {
    const appState = services.appState;
    const eventBus = services.eventBus;
    const logger = services.logger;
    
    // 主页面按钮
    domElements.mainPageBtn?.addEventListener('click', async () => {
        // 检查是否有未保存的更改
        if (appState.get('app.hasUnsavedChanges')) {
            const choice = await Modal.confirm(
                '您有未保存的更改，是否保存后再离开？\n\n点击"确定"保存并返回，点击"取消"不保存直接返回。',
                '确认'
            );
            
            if (choice) {
                // 应用筛选设置
                controllers.filterController.applyFilters();
            }
        }
        
        // 切换到主页面
        if (domElements.mainSelectorPage) {
            domElements.mainSelectorPage.style.display = 'block';
            domElements.settingsPage.style.display = 'none';
            domElements.mainPageBtn.classList.add('active');
            domElements.settingsPageBtn.classList.remove('active');
        }
    });
    
    // 设置页面按钮
    domElements.settingsPageBtn?.addEventListener('click', () => {
        // 创建人格设置UI
        controllers.settingsController.createPersonalitySettings();
        
        // 切换到设置页面
        if (domElements.mainSelectorPage) {
            domElements.mainSelectorPage.style.display = 'none';
            domElements.settingsPage.style.display = 'block';
            domElements.mainPageBtn.classList.remove('active');
            domElements.settingsPageBtn.classList.add('active');
        }
    });
    
    // 排行榜页面按钮
    domElements.rankingPageBtn?.addEventListener('click', () => {
        window.location.href = 'ranking.html';
    });
    
    logger.debug('页面导航已初始化');
}

/**
 * 初始化帮助模态窗口
 */
function initializeHelpModal(domElements) {
    if (!domElements.helpBtn || !domElements.helpModal || !domElements.helpCloseBtn) {
        return;
    }
    
    // 打开帮助
    domElements.helpBtn.addEventListener('click', () => {
        domElements.helpModal.classList.add('active');
    });
    
    // 关闭帮助
    domElements.helpCloseBtn.addEventListener('click', () => {
        domElements.helpModal.classList.remove('active');
    });
    
    // 点击背景关闭
    domElements.helpModal.addEventListener('click', (e) => {
        if (e.target === domElements.helpModal) {
            domElements.helpModal.classList.remove('active');
        }
    });
}

/**
 * 初始化应用的初始状态
 */
function initializeAppState(services) {
    const appState = services.appState;
    const logger = services.logger;
    
    // 初始化罪人筛选（所有罪人）
    const allSinnerIds = new Set(sinnerData.map(s => s.id));
    appState.set('filters.sinners', allSinnerIds);
    
    // 初始化人格筛选（所有人格）
    const allPersonalities = new Map();
    sinnerData.forEach(sinner => {
        const personaMap = new Map();
        sinner.personalities.forEach((_, index) => {
            personaMap.set(index, true);
        });
        allPersonalities.set(sinner.id, personaMap);
    });
    appState.set('filters.personalities', allPersonalities);
    
    // 初始化游戏状态
    appState.set('game.selectedSinner', null);
    appState.set('game.selectedPersona', null);
    appState.set('game.isScrolling', false);
    
    // 初始化计时器状态
    appState.set('timer.elapsedSeconds', 0);
    appState.set('timer.isRunning', false);
    
    // 初始化应用状态
    appState.set('app.hasUnsavedChanges', false);
    appState.set('app.isInitialized', true);
    
    logger.debug('应用初始状态已初始化');
}

/**
 * 创建初始UI
 */
function initializeUI(controllers, services) {
    const logger = services.logger;
    
    // 创建罪人筛选UI
    controllers.filterController.createSinnerFilter();
    
    // 创建初始滚动列表（所有罪人）
    const allSinners = sinnerData;
    controllers.scrollController.createSinnerScrollList(allSinners);
    controllers.scrollController.createPersonaScrollList(['请先选择罪人']);
    
    logger.debug('UI已初始化');
}

/**
 * 订阅关键事件
 */
function subscribeToKeyEvents(services) {
    const eventBus = services.eventBus;
    const logger = services.logger;
    
    // 订阅罪人选择事件
    eventBus.subscribe('SINNER_SELECTED', (data) => {
        logger.debug('罪人已选择', data);
    });
    
    // 订阅人格选择事件
    eventBus.subscribe('PERSONA_SELECTED', (data) => {
        logger.debug('人格已选择', data);
    });
    
    // 订阅计时器事件
    eventBus.subscribe('TIMER_STARTED', () => {
        logger.debug('计时器已启动');
    });
    
    // 订阅排行榜事件
    eventBus.subscribe('RANKING_SAVED_LOCAL', () => {
        logger.debug('记录已保存到本地排行榜');
    });
    
    logger.debug('关键事件已订阅');
}

/**
 * 主初始化函数
 */
async function main() {
    try {
        // 1. 初始化核心服务
        const services = initializeCoreServices();
        
        // 2. 初始化Controllers
        const controllers = initializeControllers(services);
        
        // 3. 初始化应用状态
        initializeAppState(services);
        
        // 4. 订阅关键事件
        subscribeToKeyEvents(services);
        
        // 5. 等待DOM完全加载
        if (document.readyState === 'loading') {
            await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
        }
        
        // 6. 初始化DOM和事件
        initializeDOMAndEvents(controllers, services);
        
        // 7. 初始化UI
        initializeUI(controllers, services);
        
        // 8. 初始化UI模块
        UI.init();
        
        // 应用已准备完毕
        services.logger.debug('应用已成功启动');
        window.appReady = true;
        
        // 触发应用就绪事件
        window.eventBus.emit('APP_READY', {});
        
    } catch (error) {
        console.error('应用启动失败:', error);
        throw error;
    }
}

// ==================== 应用启动 ====================

// 当DOM完全加载时启动应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    // 如果脚本加载晚于DOMContentLoaded事件，直接启动
    main().catch(error => {
        console.error('应用启动失败:', error);
    });
}

// 导出便于测试
export { main, initializeCoreServices, initializeControllers };
