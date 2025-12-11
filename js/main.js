// 边狱公司 - 今天蛋筒什么？主应用逻辑

// 导入罪人数据
import { sinnerData } from '../data/characters.js';
// 导入工具函数
import { secureRandInt } from '../data/utils/helpers.js';
// 导入配置
import { Config } from '../data/config.js';
// 导入筛选模块
import Filters from './filters.js';
// 导入弹窗模块
import Modal from './modal.js';
// 导入滚动模块
import {
    initScrollModule,
    createSinnerScrollList,
    createPersonaScrollList,
    startSinnerScroll,
    resetPersonaScrollState,
    stopSinnerScroll,
    startPersonaScroll,
    stopPersonaScroll,
    clearHighlight,
    highlightSelectedItem
} from './scrolls.js';
// 导入设置模块
import {
    updatePersonalityFilter,
    toggleAllPersonalities,
    invertAllPersonalities,
    toggleSinnerPersonalities,
    invertSinnerPersonalities,
    createPersonalitySettings
} from './settings.js';
// 导入UI模块
import UI from './ui.js';

// 获取DOM元素
const sinnerScroll = document.getElementById('sinner-scroll');
const personaScroll = document.getElementById('persona-scroll');
const sinnerScrollContainer = document.getElementById('sinner-scroll-container');
const personaScrollContainer = document.getElementById('persona-scroll-container');
const sinnerStartBtn = document.getElementById('sinner-start-btn');
const sinnerStopBtn = document.getElementById('sinner-stop-btn');
const personaStartBtn = document.getElementById('persona-start-btn');
const personaStopBtn = document.getElementById('persona-stop-btn');
const selectedSinnerEl = document.getElementById('selected-sinner');
const selectedPersonaEl = document.getElementById('selected-persona');

// 页面导航元素
const mainPageBtn = document.getElementById('main-page-btn');
const settingsPageBtn = document.getElementById('settings-page-btn');
const mainSelectorPage = document.getElementById('main-selector-page');
const settingsPage = document.getElementById('settings-page');

// 滚动状态
let sinnerScrollInterval = null;
let personaScrollInterval = null;
let currentSelectedSinner = null;
let currentSelectedPersona = null;
let sinnerItems = [];
let personaItems = [];
let sinnerOffset = 0;
let personaOffset = 0;
let isSinnerScrolling = false;
let isPersonaScrolling = false;
const itemHeight = Config.itemHeight; // 每个项目高度

// 直接在window对象上定义筛选相关变量，确保所有模块使用相同的数据
window.filteredSinnerData = [...sinnerData]; // 默认包含所有罪人
window.filteredPersonalityData = {};
window.originalFilteredSinnerData = [...sinnerData]; // 默认包含所有罪人
window.originalFilteredPersonalityData = {};
window.hasUnsavedChanges = false;
// 初始化当前选中的角色信息
window.currentSelectedSinner = null;
window.currentSelectedPersona = null;



// 页面导航功能
mainPageBtn.addEventListener('click', async () => {
    // 检查是否有未保存的更改
    if (window.hasUnsavedChanges) {
        const choice = await Modal.confirm('您有未保存的更改，是否保存后再离开？\n\n点击“确定”保存并返回，点击“取消”不保存直接返回。', '确认');
        if (choice) {
            // 保存筛选设置（applyFilters内部会调用validateFilterSettings）
            Filters.applyFilters();
        } else {
            // 不保存直接返回主页面，但仍需要验证人格选择
            if (Filters.validateFilterSettings()) {
                mainSelectorPage.style.display = 'block';
                settingsPage.style.display = 'none';
                mainPageBtn.classList.add('active');
                settingsPageBtn.classList.remove('active');
                Filters.refreshScrollsOnReturn();
            }
        }
    } else {
        // 没有未保存的更改，直接返回主页面
        mainSelectorPage.style.display = 'block';
        settingsPage.style.display = 'none';
        mainPageBtn.classList.add('active');
        settingsPageBtn.classList.remove('active');
        Filters.refreshScrollsOnReturn();
    }
});
// 页面导航功能
settingsPageBtn.addEventListener('click', () => {
    mainSelectorPage.style.display = 'none';
    settingsPage.style.display = 'block';
    mainPageBtn.classList.remove('active');
    settingsPageBtn.classList.add('active');
    createPersonalitySettings();
});

// 应用筛选设置按钮
const applyFiltersBtn = document.getElementById('apply-filters-btn');
if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
        Filters.applyFilters();
    });
}

// 重置筛选设置按钮
const resetFiltersBtn = document.getElementById('reset-filters-btn');
if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', async () => {
        const confirmed = await Modal.confirm('确定要重置所有筛选设置吗？', '确认');
        if (confirmed) {
            // 重置所有筛选设置
            window.filteredSinnerData = [...window.originalFilteredSinnerData];
            window.filteredPersonalityData = JSON.parse(JSON.stringify(window.originalFilteredPersonalityData));
            window.hasUnsavedChanges = false;
            
            // 重新创建筛选界面
            createPersonalitySettings();
            
            // 重置罪人筛选复选框
            const checkboxes = document.querySelectorAll('#sinner-filter input[type="checkbox"]');
            checkboxes.forEach(cb => {
                cb.checked = true;
            });
        }
    });
}

// 滚动函数已在scrolls.js中定义，此处不再重复定义

// 过滤函数已在filters.js中定义，此处不再重复定义
// 人格设置函数已在settings.js中定义，此处不再重复定义

// 更新人格筛选函数已在settings.js中定义，此处不再重复定义

// 过滤函数已在filters.js中定义，此处不再重复定义

// 刷新滚动列表函数已在filters.js中定义，此处不再重复定义

// 初始化函数
function init() {
    // 初始化滚动模块
    initScrollModule(
        // DOM元素
        {
            sinnerScroll,
            personaScroll,
            sinnerStartBtn,
            sinnerStopBtn,
            personaStartBtn,
            personaStopBtn,
            selectedSinnerEl,
            selectedPersonaEl
        },
        // 全局状态
        {
            sinnerItems,
            itemHeight,
            sinnerData,
            filteredSinnerData: window.filteredSinnerData,
            filteredPersonalityData: window.filteredPersonalityData
        }
    );
    
    // 创建罪人筛选复选框（内部会自动初始化筛选数据并保存原始状态）
    Filters.createSinnerFilter();
    
    // 初始化罪人滚动列表
    createSinnerScrollList(window.filteredSinnerData);
    
    // 初始化人格滚动列表
    createPersonaScrollList(['请先选择罪人']);
    
    // 初始化页面导航
    UI.initPageNavigation(mainPageBtn, settingsPageBtn, mainSelectorPage, settingsPage);
    
    // 直接绑定滚动按钮事件监听器
    import('./scrolls.js').then(({ startSinnerScroll, stopSinnerScroll, startPersonaScroll, stopPersonaScroll }) => {
        sinnerStartBtn.addEventListener('click', startSinnerScroll);
        sinnerStopBtn.addEventListener('click', stopSinnerScroll);
        personaStartBtn.addEventListener('click', startPersonaScroll);
        personaStopBtn.addEventListener('click', stopPersonaScroll);
    });
    
    // 初始化时，应用按钮还不存在，需要在createPersonalitySettings中创建
    
    // 【已禁用】添加罪人点击事件 - 根据设计需求，用户不能直接点击选择，只能通过随机抽取
    // sinnerScroll.addEventListener('click', (e) => {
    //     const item = e.target.closest('.scroll-item');
    //     if (item) {
    //         const index = parseInt(item.dataset.originalIndex);
    //         const sinner = window.filteredSinnerData[index];
    //         currentSelectedSinner = sinner;
    //         window.currentSelectedSinner = sinner;
    //         selectedSinnerEl.textContent = sinner.name;
    //         
    //         // 重置人格选择
    //         currentSelectedPersona = null;
    //         window.currentSelectedPersona = null;
    //         selectedPersonaEl.textContent = '未选择';
    //         
    //         // 更新人格列表
    //         const filteredPersonalities = sinner.personalities.filter((persona, index) => {
    //             return window.filteredPersonalityData[sinner.id] ? 
    //                    (window.filteredPersonalityData[sinner.id][index] !== false) : 
    //                    true;
    //         });
    //         createPersonaScrollList(filteredPersonalities);
    //     }
    // });
    
    // 【已禁用】添加人格点击事件 - 根据设计需求，用户不能直接点击选择，只能通过随机抽取
    // personaScroll.addEventListener('click', (e) => {
    //     const item = e.target.closest('.scroll-item');
    //     if (item) {
    //         const index = parseInt(item.dataset.originalIndex);
    //         const persona = personaItems[index];
    //         if (typeof persona === 'object' && persona.name) {
    //             currentSelectedPersona = persona;
    //             window.currentSelectedPersona = persona;
    //             selectedPersonaEl.textContent = persona.name;
    //         }
    //     }
    // });
    
    // 添加筛选控制按钮事件
    const selectAllBtn = document.getElementById('select-all-btn');
    const deselectAllBtn = document.getElementById('deselect-all-btn');
    const invertBtn = document.getElementById('invert-btn');
    
    if (selectAllBtn) selectAllBtn.addEventListener('click', () => Filters.toggleAllCheckboxes(true));
    if (deselectAllBtn) deselectAllBtn.addEventListener('click', () => Filters.toggleAllCheckboxes(false));
    if (invertBtn) invertBtn.addEventListener('click', () => Filters.invertSelection());
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // 初始化UI
    UI.init();
});