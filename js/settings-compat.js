/**
 * settings-compat.js - Settings模块向后兼容层
 * 
 * 作用：
 * - 将旧的settings.js API映射到新的SettingsController
 * - 保持现有代码继续工作
 * - 实现平滑迁移过程
 * 
 * 迁移策略：
 * - 所有函数调用都委派给settingsController实例
 * - 支持旧的initDOM调用方式
 * - 逐步将代码调用从这里迁移到新架构
 */

import { SettingsController } from './controllers/settingsController.js';

// 全局 settingsController 实例（延迟初始化）
let settingsController = null;

/**
 * 初始化向后兼容层
 * @param {AppState} appState
 * @param {EventBus} eventBus
 * @param {Logger} logger
 * @returns {SettingsController}
 */
export function initSettingsCompat(appState, eventBus, logger) {
    settingsController = new SettingsController(appState, eventBus, logger);
    return settingsController;
}

/**
 * 获取settingsController实例（用于新代码直接调用）
 */
export function getSettingsController() {
    if (!settingsController) {
        throw new Error('SettingsController尚未初始化，请先调用initSettingsCompat()');
    }
    return settingsController;
}

/**
 * 初始化DOM
 */
export function initSettingsDOM(domElements) {
    if (!settingsController) {
        throw new Error('SettingsController尚未初始化');
    }
    settingsController.initDOM(domElements);
}

/**
 * 更新人格过滤
 */
export function updatePersonalityFilter(event) {
    if (!settingsController) {
        throw new Error('SettingsController尚未初始化');
    }
    
    const checkbox = event.target;
    const sinnerId = parseInt(checkbox.dataset.sinnerId);
    const personaIndex = parseInt(checkbox.dataset.personaIndex);
    
    settingsController.updatePersonalityFilter(sinnerId, personaIndex, checkbox.checked);
}

/**
 * 全选所有人格
 */
export function toggleAllPersonalities(selectAll) {
    if (!settingsController) {
        throw new Error('SettingsController尚未初始化');
    }
    
    if (selectAll) {
        settingsController.selectAllPersonalities();
    } else {
        settingsController.deselectAllPersonalities();
    }
}

/**
 * 反选所有人格
 */
export function invertAllPersonalities() {
    if (!settingsController) {
        throw new Error('SettingsController尚未初始化');
    }
    settingsController.invertAllPersonalities();
}

/**
 * 特定罪人的全选/全不选
 */
export function toggleSinnerPersonalities(sinnerId, selectAll) {
    if (!settingsController) {
        throw new Error('SettingsController尚未初始化');
    }
    
    if (selectAll) {
        settingsController.selectSinnerPersonalities(sinnerId);
    } else {
        settingsController.deselectSinnerPersonalities(sinnerId);
    }
}

/**
 * 特定罪人的反选
 */
export function invertSinnerPersonalities(sinnerId) {
    if (!settingsController) {
        throw new Error('SettingsController尚未初始化');
    }
    settingsController.invertSinnerPersonalities(sinnerId);
}

/**
 * 创建人格设置界面
 */
export function createPersonalitySettings() {
    if (!settingsController) {
        throw new Error('SettingsController尚未初始化');
    }
    settingsController.createPersonalitySettings();
}

/**
 * 清理方法
 */
export function destroySettingsModule() {
    if (settingsController) {
        settingsController.destroy();
        settingsController = null;
    }
}

// 导出为兼容对象
export const Settings = {
    initSettingsDOM,
    updatePersonalityFilter,
    toggleAllPersonalities,
    invertAllPersonalities,
    toggleSinnerPersonalities,
    invertSinnerPersonalities,
    createPersonalitySettings,
    destroySettingsModule,
    getSettingsController,
    initSettingsCompat
};

export default Settings;
