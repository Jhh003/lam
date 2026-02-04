/**
 * scrolls-compat.js - Scrolls模块向后兼容层
 * 
 * 作用：
 * - 将旧的scrolls.js API映射到新的ScrollController
 * - 保持现有代码继续工作（如果还有其他地方调用Scrolls）
 * - 实现平滑迁移过程
 * 
 * 迁移策略：
 * - 所有函数调用都委派给scrollController实例
 * - 支持旧的initScrollModule调用方式
 * - 逐步将代码调用从这里迁移到新架构
 * 
 * 使用说明：
 * 1. 旧代码继续导入：import Scrolls from './scrolls-compat.js'
 * 2. 新代码导入ScrollController：import { ScrollController } from './controllers/scrollController.js'
 * 3. 渐进式迁移函数调用
 */

import { ScrollController } from './controllers/scrollController.js';

// 全局 scrollController 实例（延迟初始化）
let scrollController = null;

/**
 * 初始化向后兼容层
 * @param {AppState} appState
 * @param {EventBus} eventBus
 * @param {Logger} logger
 * @param {Modal} modal
 * @returns {ScrollController}
 */
export function initScrollCompat(appState, eventBus, logger, modal) {
    scrollController = new ScrollController(appState, eventBus, logger, modal);
    return scrollController;
}

/**
 * 获取scrollController实例（用于新代码直接调用）
 */
export function getScrollController() {
    if (!scrollController) {
        throw new Error('ScrollController尚未初始化，请先调用initScrollCompat()');
    }
    return scrollController;
}

/**
 * 向后兼容的initScrollModule
 * 旧调用方式：initScrollModule(domElements, globalState)
 * 新方式：scrollController.initDOM(domElements)
 */
export function initScrollModule(domElements, globalState) {
    if (!scrollController) {
        throw new Error('ScrollController尚未初始化');
    }
    scrollController.initDOM(domElements);
}

/**
 * 创建罪人滚动列表
 */
export function createSinnerScrollList(items) {
    if (!scrollController) {
        throw new Error('ScrollController尚未初始化');
    }
    scrollController.createSinnerScrollList(items);
}

/**
 * 创建人格滚动列表
 */
export function createPersonaScrollList(items) {
    if (!scrollController) {
        throw new Error('ScrollController尚未初始化');
    }
    scrollController.createPersonaScrollList(items);
}

/**
 * 开始罪人滚动
 */
export function startSinnerScroll() {
    if (!scrollController) {
        throw new Error('ScrollController尚未初始化');
    }
    scrollController.startSinnerScroll();
}

/**
 * 停止罪人滚动
 */
export function stopSinnerScroll() {
    if (!scrollController) {
        throw new Error('ScrollController尚未初始化');
    }
    scrollController.stopSinnerScroll();
}

/**
 * 开始人格滚动
 */
export function startPersonaScroll() {
    if (!scrollController) {
        throw new Error('ScrollController尚未初始化');
    }
    scrollController.startPersonaScroll();
}

/**
 * 停止人格滚动
 */
export function stopPersonaScroll() {
    if (!scrollController) {
        throw new Error('ScrollController尚未初始化');
    }
    scrollController.stopPersonaScroll();
}

/**
 * 高亮选中项（只读方法，用于测试）
 */
export function highlightSelectedItem(scrollContainer, selectedIndex, scrollOffset = null, itemsLength = null) {
    if (!scrollController) {
        throw new Error('ScrollController尚未初始化');
    }
    scrollController.highlightSelectedItem(scrollContainer, selectedIndex);
}

/**
 * 清理方法
 */
export function destroyScrollModule() {
    if (scrollController) {
        scrollController.destroy();
        scrollController = null;
    }
}

// 导出scrollController的常用属性和方法（用于调试）
export const Scrolls = {
    initScrollModule,
    createSinnerScrollList,
    createPersonaScrollList,
    startSinnerScroll,
    stopSinnerScroll,
    startPersonaScroll,
    stopPersonaScroll,
    highlightSelectedItem,
    destroyScrollModule,
    getScrollController,
    initScrollCompat
};

export default Scrolls;
