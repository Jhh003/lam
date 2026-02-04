/**
 * common-compat.js - Common模块向后兼容层
 * 
 * 作用：
 * - 将旧的common.js功能映射到4个新的Controller
 * - 保持现有代码继续工作
 * - 实现平滑迁移过程
 * 
 * 新模块分割：
 * 1. TimerController - 计时器逻辑
 * 2. AnimationController - 倒计时和视觉效果
 * 3. RankingApiController - 排行榜API
 * 4. UploadController - GitHub上传逻辑
 * 
 * 迁移策略：
 * - 所有函数调用都委派给相应的Controller实例
 * - 支持旧的initTimer调用方式
 * - 逐步将代码调用从这里迁移到新架构
 */

import { TimerController } from './controllers/timerController.js';
import { AnimationController } from './controllers/animationController.js';
import { RankingApiController } from './controllers/rankingApiController.js';
import { UploadController } from './controllers/uploadController.js';

// 全局 Controller 实例（延迟初始化）
let timerController = null;
let animationController = null;
let rankingApiController = null;
let uploadController = null;

/**
 * 初始化向后兼容层
 * 创建并初始化所有4个Controller实例
 */
export function initCommonCompat(appState, eventBus, logger, modal) {
    timerController = new TimerController(appState, eventBus, logger);
    animationController = new AnimationController(appState, eventBus, logger);
    rankingApiController = new RankingApiController(appState, eventBus, logger, modal);
    uploadController = new UploadController(appState, eventBus, logger, modal);
    
    return {
        timerController,
        animationController,
        rankingApiController,
        uploadController
    };
}

/**
 * 初始化所有Controller的DOM
 */
export function initCommonDOM(domElements) {
    timerController?.initDOM(domElements);
    animationController?.initDOM(domElements);
    uploadController?.initDOM(domElements);
}

/**
 * 获取各个Controller实例
 */
export function getTimerController() {
    if (!timerController) throw new Error('TimerController尚未初始化');
    return timerController;
}

export function getAnimationController() {
    if (!animationController) throw new Error('AnimationController尚未初始化');
    return animationController;
}

export function getRankingApiController() {
    if (!rankingApiController) throw new Error('RankingApiController尚未初始化');
    return rankingApiController;
}

export function getUploadController() {
    if (!uploadController) throw new Error('UploadController尚未初始化');
    return uploadController;
}

/**
 * 旧的initTimer函数（兼容）
 * 现在简单地初始化TimerController的DOM
 */
export function initTimer() {
    if (!timerController) {
        throw new Error('TimerController尚未初始化');
    }
    // 所有初始化已在initCommonDOM中完成
}

/**
 * 旧的initCountdown函数（兼容）
 */
export function initCountdown() {
    if (!animationController) {
        throw new Error('AnimationController尚未初始化');
    }
    animationController.initCountdown();
}

/**
 * Timer相关的兼容函数
 */
export function startTimer() {
    timerController?.startTimer();
}

export function pauseTimer() {
    timerController?.pauseTimer();
}

export function resetTimer() {
    timerController?.resetTimer();
}

export function formatTime(seconds) {
    if (!timerController) throw new Error('TimerController尚未初始化');
    return timerController.formatTime(seconds);
}

/**
 * Animation相关的兼容函数
 */
export function createAnimatedText(text) {
    if (!animationController) throw new Error('AnimationController尚未初始化');
    return animationController.createAnimatedText(text);
}

export function updateCountdown(text) {
    animationController?.updateCountdown(text);
}

/**
 * Ranking API相关的兼容函数
 */
export async function saveToLocalRanking(seconds, sinner, persona, playerNote = '') {
    if (!rankingApiController) throw new Error('RankingApiController尚未初始化');
    return rankingApiController.saveToLocalRanking(seconds, sinner, persona, playerNote);
}

export function viewRanking() {
    rankingApiController?.viewRanking();
}

export function getLocalRecords() {
    if (!rankingApiController) throw new Error('RankingApiController尚未初始化');
    return rankingApiController.getLocalRecords();
}

export async function getCurrentTime() {
    if (!rankingApiController) throw new Error('RankingApiController尚未初始化');
    return rankingApiController.getCurrentTime();
}

export function isValidUrl(url) {
    if (!rankingApiController) throw new Error('RankingApiController尚未初始化');
    return rankingApiController.isValidUrl(url);
}

/**
 * Upload相关的兼容函数
 */
export async function uploadToGlobalRanking() {
    if (!uploadController) throw new Error('UploadController尚未初始化');
    return uploadController.uploadToGlobalRanking();
}

export async function showUploadModal() {
    if (!uploadController) throw new Error('UploadController尚未初始化');
    return uploadController.showUploadModal();
}

export function hideUploadModal() {
    uploadController?.hideUploadModal();
}

/**
 * 清理方法
 */
export function destroyCommonModule() {
    timerController?.destroy();
    animationController?.destroy();
    rankingApiController?.destroy();
    uploadController?.destroy();
    
    timerController = null;
    animationController = null;
    rankingApiController = null;
    uploadController = null;
}

// 导出为兼容对象
export const Common = {
    // 初始化
    initCommonCompat,
    initCommonDOM,
    initTimer,
    initCountdown,
    
    // 获取Controller
    getTimerController,
    getAnimationController,
    getRankingApiController,
    getUploadController,
    
    // Timer API
    startTimer,
    pauseTimer,
    resetTimer,
    formatTime,
    
    // Animation API
    createAnimatedText,
    updateCountdown,
    
    // Ranking API
    saveToLocalRanking,
    viewRanking,
    getLocalRecords,
    getCurrentTime,
    isValidUrl,
    
    // Upload API
    uploadToGlobalRanking,
    showUploadModal,
    hideUploadModal,
    
    // Cleanup
    destroyCommonModule
};

export default Common;
