import { Config } from '../data/config.js';
import { secureRandInt } from '../data/utils/helpers.js';
// 导入罪人数据
import { sinnerData } from '../data/characters.js';
import Modal from './modal.js';

// 滚动模块 - 负责所有与滚动功能相关的逻辑

// 罪人滚动相关变量（将从main.js传递或访问）
let sinnerScroll, sinnerItems, itemHeight, sinnerOffset, sinnerScrollInterval, isSinnerScrolling;
let currentSelectedSinner, selectedSinnerEl;

// 人格滚动相关变量
let personaScroll, personaItems, personaOffset, personaScrollInterval, isPersonaScrolling;
let currentSelectedPersona, selectedPersonaEl;

// 按钮元素
let sinnerStartBtn, sinnerStopBtn, personaStartBtn, personaStopBtn;

// 初始化滚动模块
function initScrollModule(domElements, globalState) {
    // 初始化DOM元素
    sinnerScroll = domElements.sinnerScroll;
    personaScroll = domElements.personaScroll;
    sinnerStartBtn = domElements.sinnerStartBtn;
    sinnerStopBtn = domElements.sinnerStopBtn;
    personaStartBtn = domElements.personaStartBtn;
    personaStopBtn = domElements.personaStopBtn;
    selectedSinnerEl = domElements.selectedSinnerEl;
    selectedPersonaEl = domElements.selectedPersonaEl;
    
    // 初始化全局状态
    sinnerItems = globalState.sinnerItems;
    itemHeight = globalState.itemHeight;
    
    // 初始化滚动状态
    sinnerOffset = 0;
    sinnerScrollInterval = null;
    isSinnerScrolling = false;
    personaOffset = 0;
    personaScrollInterval = null;
    isPersonaScrolling = false;
    
    // 【重要】重置选择状态变量，避免残留数据
    currentSelectedSinner = null;
    currentSelectedPersona = null;
}

// 创建罪人滚动列表
function createSinnerScrollList(items) {
    // 【修复】确保所有必要的 DOM 元素引用在动态导入时也有效
    if (!sinnerScroll) {
        sinnerScroll = document.getElementById('sinner-scroll');
    }
    if (!personaStartBtn) {
        personaStartBtn = document.getElementById('persona-start-btn');
    }
    if (!selectedSinnerEl) {
        selectedSinnerEl = document.getElementById('selected-sinner');
    }
    if (!selectedPersonaEl) {
        selectedPersonaEl = document.getElementById('selected-persona');
    }
    
    sinnerScroll.innerHTML = '';
    sinnerItems = items;
    
    // 【重要】创建新的罪人列表时，重置所有选择状态
    currentSelectedSinner = null;
    currentSelectedPersona = null;
    window.currentSelectedSinner = null;
    window.currentSelectedPersona = null;
    
    // 重置显示文本
    if (selectedSinnerEl) selectedSinnerEl.textContent = '未选择';
    if (selectedPersonaEl) selectedPersonaEl.textContent = '未选择';
    
    // 重置人格区域状态，确保显示空状态
    const personaEmpty = document.getElementById('persona-empty');
    if (personaEmpty) {
        personaEmpty.classList.remove('hidden');
    }
    
    // 重置罪人空状态
    const sinnerEmpty = document.getElementById('sinner-empty');
    if (sinnerEmpty) {
        sinnerEmpty.classList.remove('hidden');
    }
    
    // 清除之前的高亮
    clearHighlight(sinnerScroll);
    
    // 计算显示行数 (最小3行，最大5行) - 修复：单个罪人时也至少显示3行
    const visibleRows = Math.min(Math.max(items.length, 3), 5);
    const containerHeight = visibleRows * itemHeight;
    if (sinnerScroll.parentElement) {
        sinnerScroll.parentElement.style.height = `${containerHeight}px`;
    }
    
    // 如果只有一个项目，禁用二级转盘开始按钮
    personaStartBtn.disabled = items.length === 1;
    
    // 创建足够多的项目以实现平滑滚动效果
    const itemCount = items.length * 10;
    for (let i = 0; i < itemCount; i++) {
        const item = document.createElement('div');
        item.className = 'scroll-item';
        item.style.height = `${itemHeight}px`;
        item.dataset.originalIndex = i % items.length; // 存储原始索引
        
        const content = document.createElement('div');
        content.className = 'scroll-item-content';
        
        // 创建头像元素
        const avatarElement = document.createElement('img');
        avatarElement.className = 'avatar-placeholder';
        avatarElement.style.width = '30px';
        avatarElement.style.height = '30px';
        
        // 获取罪人信息 - 支持字符串数组或对象数组
        const currentItem = items[i % items.length];
        const sinnerName = typeof currentItem === 'string' ? currentItem : currentItem.name;
        const sinnerInfo = typeof currentItem === 'string' ? sinnerData.find(s => s.name === currentItem) : currentItem;
        
        if (sinnerInfo && sinnerInfo.avatar) {
            avatarElement.src = sinnerInfo.avatar;
            avatarElement.alt = sinnerInfo.name;
            avatarElement.onerror = function() {
                this.textContent = '?';
                this.style.display = 'flex';
                this.style.alignItems = 'center';
                this.style.justifyContent = 'center';
            };
        } else {
            avatarElement.textContent = '?';
        }
        content.appendChild(avatarElement);
        
        const textSpan = document.createElement('span');
        textSpan.textContent = sinnerName;
        content.appendChild(textSpan);
        
        item.appendChild(content);
        sinnerScroll.appendChild(item);
    }
    
    // 设置scroll-list的高度，确保所有项目都能被滚动到
    sinnerScroll.style.height = `${itemCount * itemHeight}px`;
    
    // 如果只有一个项目，直接高亮显示并自动选中
    if (items.length === 1) {
        setTimeout(() => {
            highlightSelectedItem(sinnerScroll, 0);
            
            // 【修复】自动选中唯一的罪人并更新人格列表
            const sinner = items[0];
            currentSelectedSinner = sinner;
            window.currentSelectedSinner = sinner;
            
            // 更新显示文本
            if (selectedSinnerEl) {
                selectedSinnerEl.textContent = sinner.name;
            }
            
            // 隐藏罪人空状态
            const sinnerEmpty = document.getElementById('sinner-empty');
            if (sinnerEmpty) {
                sinnerEmpty.classList.add('hidden');
            }
            
            // 更新人格列表
            // 【修复】确保人格数据被正确传递给createPersonaScrollList
            // 使用所有人格（不依赖filteredPersonalityData，因为applyFilters是异步的）
            if (sinner.personalities && Array.isArray(sinner.personalities)) {
                createPersonaScrollList(sinner.personalities);
            } else {
                // 如果没有人格数据，显示提示
                createPersonaScrollList([]);
            }
        }, 100);
    }
    
    // 【修复】更新结果显示面板（包括罪人计数）
    updateResultDisplay();
}

// 创建人格滚动列表
function createPersonaScrollList(items) {
    console.log('createPersonaScrollList被调用，items:', items);
    // 确保items是一个数组
    if (!Array.isArray(items)) {
        console.error('createPersonaScrollList: items必须是一个数组');
        return;
    }
    
    // 【修复】确保所有必要的 DOM 元素引用在动态导入时也有效
    if (!personaScroll) {
        personaScroll = document.getElementById('persona-scroll');
    }
    if (!personaStartBtn) {
        personaStartBtn = document.getElementById('persona-start-btn');
    }
    if (!selectedPersonaEl) {
        selectedPersonaEl = document.getElementById('selected-persona');
    }
    
    // 【修复】隐藏空状态提示，显示滚动列表
    const personaEmpty = document.getElementById('persona-empty');
    if (personaEmpty) {
        personaEmpty.classList.add('hidden');
    }
    
    personaScroll.innerHTML = '';
    personaItems = items;
    
    // 计算显示行数 (最小3行，最大5行)
    const visibleRows = Math.min(Math.max(items.length, 3), 5);
    const containerHeight = visibleRows * itemHeight;
    if (personaScroll.parentElement) {
        personaScroll.parentElement.style.height = `${containerHeight}px`;
    }
    
    // 特殊处理：如果是提示字符串，则不循环创建
    if (items.length === 1 && typeof items[0] === 'string') {
        const item = document.createElement('div');
        item.className = 'scroll-item';
        item.style.height = `${itemHeight}px`;
        
        const content = document.createElement('div');
        content.className = 'scroll-item-content';
        
        const avatarElement = document.createElement('div');
        avatarElement.className = 'avatar-placeholder';
        avatarElement.style.width = '30px';
        avatarElement.style.height = '30px';
        avatarElement.style.backgroundColor = '#ccc';
        avatarElement.style.borderRadius = '50%';
        avatarElement.style.display = 'flex';
        avatarElement.style.alignItems = 'center';
        avatarElement.style.justifyContent = 'center';
        avatarElement.textContent = '?';
        avatarElement.alt = '未知头像';
        content.appendChild(avatarElement);
        
        const textSpan = document.createElement('span');
        textSpan.textContent = items[0];
        content.appendChild(textSpan);
        
        item.appendChild(content);
        personaScroll.appendChild(item);
        
        // 【修复】显示空状态提示（即消息字符串时显示）
        const personaEmpty = document.getElementById('persona-empty');
        if (personaEmpty) {
            personaEmpty.classList.remove('hidden');
        }
        
        personaStartBtn.disabled = true;
        return;
    }
    
    // 如果没有项目，显示提示
    if (items.length === 0) {
        const item = document.createElement('div');
        item.className = 'scroll-item';
        item.style.height = `${itemHeight}px`;
        
        const content = document.createElement('div');
        content.className = 'scroll-item-content';
        
        const avatarElement = document.createElement('div');
        avatarElement.className = 'avatar-placeholder';
        avatarElement.style.width = '30px';
        avatarElement.style.height = '30px';
        avatarElement.style.backgroundColor = '#ccc';
        avatarElement.style.borderRadius = '50%';
        avatarElement.style.display = 'flex';
        avatarElement.style.alignItems = 'center';
        avatarElement.style.justifyContent = 'center';
        avatarElement.textContent = '?';
        avatarElement.alt = '未知头像';
        content.appendChild(avatarElement);
        
        const textSpan = document.createElement('span');
        textSpan.textContent = '请先选择罪人';
        content.appendChild(textSpan);
        
        item.appendChild(content);
        personaScroll.appendChild(item);
        
        personaStartBtn.disabled = true;
        return;
    }
    
    // 如果只有一个人格，启用开始按钮（与罪人滚动保持一致的逻辑）
    personaStartBtn.disabled = false;
    
    // 创建足够多的项目以实现平滑滚动效果
    const itemCount = items.length * 10;
    for (let i = 0; i < itemCount; i++) {
        const item = document.createElement('div');
        item.className = 'scroll-item';
        item.style.height = `${itemHeight}px`;
        item.dataset.originalIndex = i % items.length;
        
        const content = document.createElement('div');
        content.className = 'scroll-item-content';
        
        // 创建头像元素
        const avatarElement = document.createElement('img');
        avatarElement.className = 'avatar-placeholder';
        avatarElement.style.width = '30px';
        avatarElement.style.height = '30px';
        
        // 获取人格信息 - 支持字符串数组或对象数组
        const currentItem = items[i % items.length];
        const personaName = typeof currentItem === 'string' ? currentItem : currentItem.name;
        const personaInfo = typeof currentItem === 'object' ? currentItem : null;
        
        if (personaInfo && personaInfo.avatar) {
            avatarElement.src = personaInfo.avatar;
            avatarElement.alt = personaName;
            avatarElement.onerror = function() {
                this.src = '';
                this.alt = '未知头像';
                this.style.backgroundColor = '#ccc';
                this.style.borderRadius = '50%';
                this.style.display = 'flex';
                this.style.alignItems = 'center';
                this.style.justifyContent = 'center';
                this.textContent = '?';
            };
        } else {
            avatarElement.style.backgroundColor = '#ccc';
            avatarElement.style.borderRadius = '50%';
            avatarElement.style.display = 'flex';
            avatarElement.style.alignItems = 'center';
            avatarElement.style.justifyContent = 'center';
            avatarElement.textContent = '?';
            avatarElement.alt = personaName;
        }
        content.appendChild(avatarElement);
        
        const textSpan = document.createElement('span');
        textSpan.textContent = personaName;
        content.appendChild(textSpan);
        
        item.appendChild(content);
        personaScroll.appendChild(item);
    }
    
    // 设置scroll-list的高度，确保所有项目都能被滚动到
    personaScroll.style.height = `${itemCount * itemHeight}px`;
    
    // 如果只有一个项目，直接高亮显示
    if (items.length === 1) {
        console.log('只有一个项目，直接高亮显示');
        
        // 确保DOM元素已创建完成后再执行高亮
        setTimeout(() => {
            highlightSelectedItem(personaScroll, 0);
            // 直接选择该人格
            currentSelectedPersona = items[0];
            window.currentSelectedPersona = currentSelectedPersona; // 更新window对象
            console.log('当前选中人格:', currentSelectedPersona);
            if (currentSelectedPersona && currentSelectedPersona.name) {
                selectedPersonaEl.textContent = currentSelectedPersona.name;
                console.log('selectedPersonaEl文本设置为:', currentSelectedPersona.name);
            } else {
                console.error('当前选中人格无效:', currentSelectedPersona);
                selectedPersonaEl.textContent = '未选择';
            }
            personaStartBtn.disabled = true;
            
            // 注意：此处不触发彩蛋检测，因为这只是创建列表和显示
            // 彩蛋检测仅在 stopPersonaScroll() 中真正完成随机抽取后才触发
        }, 0); // 使用0延迟确保在DOM更新后执行
    } else {
        personaStartBtn.disabled = false;
    }
    
    // 【修复】更新结果显示面板
    updateResultDisplay();
}

// 开始罪人滚动
function startSinnerScroll() {
    console.log('startSinnerScroll被调用', {sinnerStartBtn, sinnerStopBtn, sinnerScroll});
    if (window.filteredSinnerData.length < 1) {
        Modal.alert('请至少选择一个罪人！', '提示');
        return;
    }
    
    // 当罪人数量为1时，直接调用停止函数选择该罪人，不启动滚动
    if (window.filteredSinnerData.length === 1) {
        stopSinnerScroll();
        return;
    }
    
    if (sinnerScrollInterval) return;
    
    // 隐藏空状态
    const sinnerEmpty = document.getElementById('sinner-empty');
    if (sinnerEmpty) {
        sinnerEmpty.classList.add('hidden');
    }
    
    // 添加滚动状态CSS类
    const sinnerScrollContainer = document.getElementById('sinner-scroll-container');
    if (sinnerScrollContainer) {
        sinnerScrollContainer.classList.add('scrolling');
    }
    
    // 直接获取按钮元素（绕过模块变量缓存问题）
    const startBtn = document.getElementById('sinner-start-btn') || sinnerStartBtn;
    const stopBtn = document.getElementById('sinner-stop-btn') || sinnerStopBtn;
    if (startBtn) startBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
    isSinnerScrolling = true;
    
    // 清除之前选中的高亮
    clearHighlight(sinnerScroll);
    
    // 快速滚动
    const speed = Config.scrollSpeed;
    sinnerScroll.style.transition = `transform ${Config.transitionDuration} ${Config.transitionType}`;
    
    sinnerScrollInterval = setInterval(() => {
        sinnerOffset += speed;
        sinnerScroll.style.transform = `translateY(-${sinnerOffset}px)`;
        
        // 循环重置逻辑 - 使用筛选后的数据长度确保循环正确
        const totalHeight = window.filteredSinnerData.length * itemHeight * Config.totalHeightMultiplier;
        if (sinnerOffset > totalHeight) {
            sinnerOffset = sinnerOffset % totalHeight;
            sinnerScroll.style.transition = 'none';
            sinnerScroll.style.transform = `translateY(-${sinnerOffset}px)`;
            setTimeout(() => {
                sinnerScroll.style.transition = `transform ${Config.transitionDuration} ${Config.transitionType}`;
            }, Config.scrollInterval);
        }
    }, Config.scrollInterval);
}

// 重置二级转盘状态
function resetPersonaScrollState() {
    // 清除滚动间隔
    if (personaScrollInterval) {
        clearInterval(personaScrollInterval);
        personaScrollInterval = null;
    }
    
    // 重置滚动状态
    isPersonaScrolling = false;
    personaOffset = 0;
    
    // 重置滚动容器的样式
    personaScroll.style.transition = '';
    personaScroll.style.transform = '';
    
    // 重置按钮状态
    personaStopBtn.disabled = true;
    
    // 初始化当前选中的罪人人格
    currentSelectedPersona = null;
    window.currentSelectedPersona = null; // 更新window对象
    selectedPersonaEl.textContent = '未选择';
}

// 停止罪人滚动并定位到中心
function stopSinnerScroll() {
    // 如果只有一个罪人，直接选中
    if (window.filteredSinnerData.length <= 1) {
        if (window.filteredSinnerData.length === 0) {
            Modal.alert('请至少选择一个罪人！', '提示');
            return;
        }
        
        // 直接选中唯一罪人
        currentSelectedSinner = window.filteredSinnerData[0];
        window.currentSelectedSinner = currentSelectedSinner; // 更新window对象
        selectedSinnerEl.textContent = currentSelectedSinner.name;
        selectedPersonaEl.textContent = "未选择";
        updateResultDisplay();
        
        // 高亮显示
        highlightSelectedItem(sinnerScroll, window.filteredSinnerData.findIndex(s => s.id === currentSelectedSinner.id));
        
        // 重置二级转盘状态
        resetPersonaScrollState();
        
        // 创建对应罪人的人格列表
        console.log('当前选中罪人:', currentSelectedSinner);
        console.log('人格筛选数据:', window.filteredPersonalityData[currentSelectedSinner.id]);
        
        // 确保该罪人的筛选状态已初始化
        if (!window.filteredPersonalityData[currentSelectedSinner.id]) {
            window.filteredPersonalityData[currentSelectedSinner.id] = {};
            // 默认选择所有人格
            currentSelectedSinner.personalities.forEach((_, index) => {
                window.filteredPersonalityData[currentSelectedSinner.id][index] = true;
            });
        }
        
        const filteredPersonalities = currentSelectedSinner.personalities.filter((persona, index) => {
            // 如果没有设置该人格的筛选状态，默认为true
            const isSelected = window.filteredPersonalityData[currentSelectedSinner.id][index] !== false;
            console.log(`人格${index} (${persona.name}) 筛选状态: ${isSelected}`);
            return isSelected;
        });
        
        console.log('过滤后的人格:', filteredPersonalities);
        
        // 确保personasToShow始终是人格对象数组
        const personasToShow = filteredPersonalities.length > 0 ? filteredPersonalities : [];
        console.log('即将显示的人格:', personasToShow);
        createPersonaScrollList(personasToShow);
        
        // 【修复多罪人彩蛋触发】如果只有一个人格，触发彩蛋检测
        // 这种情况发生在完成罪人抽取后，人格列表已创建且只有一个人格
        if (personasToShow.length === 1 && typeof personasToShow[0] === 'object') {
            // 延迟执行，确保 createPersonaScrollList 已完成DOM更新和状态设置
            setTimeout(() => {
                checkEasterEgg();
            }, 50);
        }
        
        return;
    }
    
    if (!sinnerScrollInterval) return;
    
    clearInterval(sinnerScrollInterval);
    sinnerScrollInterval = null;
    isSinnerScrolling = false;
    
    // 从筛选后的罪人中随机选择
    if (window.filteredSinnerData.length === 0) {
        Modal.alert('请至少选择一个罪人！', '提示');
        sinnerStartBtn.disabled = false;
        sinnerStopBtn.disabled = true;
        return;
    }
    
    const randomIndex = secureRandInt(window.filteredSinnerData.length);
    currentSelectedSinner = window.filteredSinnerData[randomIndex];
    window.currentSelectedSinner = currentSelectedSinner; // 更新window对象
    selectedSinnerEl.textContent = currentSelectedSinner.name;
    selectedPersonaEl.textContent = "未选择";
    
    // 计算在当前筛选后数据中的索引用于定位
    const filteredIndex = window.filteredSinnerData.findIndex(s => s.id === currentSelectedSinner.id);
    
    // 计算显示行数和中心行索引
    const visibleRows = Math.min(Math.max(window.filteredSinnerData.length, 1), 5);
    const centerIndex = Math.floor(visibleRows / 2);
    // 修正：centerOffset应该是到可视区域中心的距离，而不是到中心行顶部
    const centerOffset = centerIndex * itemHeight + itemHeight / 2;
    
    // 计算目标偏移量，确保选中项显示在中心行
    const loopCount = 5; // 使用第5次循环的项目进行定位，确保前后都有足够项目
    const targetOffset = (filteredIndex + loopCount * window.filteredSinnerData.length) * itemHeight - centerOffset;
    
    // 增加随机减速效果：额外滚动整数圈（1-3圈），确保选中项仍在中心位置
    const randomExtraSpins = 1 + Math.floor(Math.random() * 3); // 1到3整圈
    const extraOffset = randomExtraSpins * window.filteredSinnerData.length * itemHeight;
    const finalOffset = targetOffset + extraOffset;
    
    // 平滑过渡到目标位置（使用更有趣的缓动函数）
    sinnerScroll.style.transition = 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    sinnerScroll.style.transform = `translateY(-${finalOffset}px)`;
    
    // 更新当前偏移量
    sinnerOffset = finalOffset;
    
    // 高亮显示选中的项目
    setTimeout(() => {
        highlightSelectedItem(sinnerScroll, filteredIndex, sinnerOffset, window.filteredSinnerData.length);
    }, 1200); // 等待过渡动画完成
    
    sinnerStartBtn.disabled = false;
    sinnerStopBtn.disabled = true;
    
    // 移除滚动状态CSS类
    const sinnerScrollContainer = document.getElementById('sinner-scroll-container');
    if (sinnerScrollContainer) {
        sinnerScrollContainer.classList.remove('scrolling');
    }
    
    // 人格选择按钮状态由createPersonaScrollList函数自动处理
    // personaStartBtn.disabled = false;
    
    // 重置二级转盘状态
    resetPersonaScrollState();
      
    // 创建对应罪人的人格列表
    console.log('当前选中罪人:', currentSelectedSinner);
    console.log('人格筛选数据:', window.filteredPersonalityData[currentSelectedSinner.id]);
    
    // 确保filteredPersonalityData中存在该罪人的数据
    if (!window.filteredPersonalityData[currentSelectedSinner.id]) {
        window.filteredPersonalityData[currentSelectedSinner.id] = {};
        // 默认选择所有人格
        currentSelectedSinner.personalities.forEach((_, index) => {
            window.filteredPersonalityData[currentSelectedSinner.id][index] = true;
        });
    }
    
    const filteredPersonalities = currentSelectedSinner.personalities.filter((persona, index) => {
        // 如果没有设置该人格的筛选状态，默认为true
        const isSelected = window.filteredPersonalityData[currentSelectedSinner.id][index] !== false;
        console.log(`人格${index} (${persona.name}) 筛选状态: ${isSelected}`);
        return isSelected;
    });
    
    console.log('过滤后的人格:', filteredPersonalities);
    
    // 如果没有筛选的人格，则显示提示信息
    const personasToShow = filteredPersonalities.length > 0 ? filteredPersonalities : ['请先选择人格'];
    createPersonaScrollList(personasToShow);
    
    // 【修复多罪人彩蛋触发】如果只有一个人格，触发彩蛋检测
    // 这种情况发生在完成罪人抽取后，人格列表已创建且只有一个人格
    if (personasToShow.length === 1 && typeof personasToShow[0] === 'object') {
        // 延迟执行，确保 createPersonaScrollList 已完成DOM更新和状态设置
        setTimeout(() => {
            checkEasterEgg();
        }, 50);
    }
    
    // 更新结果展示面板
    updateResultDisplay();
}

// 开始人格滚动
function startPersonaScroll() {
    // 【修复bug】强制验证currentSelectedSinner是否在筛选列表中
    if (currentSelectedSinner && window.filteredSinnerData) {
        const sinnerStillInList = window.filteredSinnerData.some(s => s.id === currentSelectedSinner.id);
        if (!sinnerStillInList) {
            // 如果当前选中的罪人不在筛选列表中，清空并重新获取
            currentSelectedSinner = null;
            window.currentSelectedSinner = null;
        }
    }
    
    // 先尝试从window对象同步currentSelectedSinner
    if (!currentSelectedSinner && window.currentSelectedSinner) {
        // 再次验证window.currentSelectedSinner是否在筛选列表中
        if (window.filteredSinnerData) {
            const sinnerStillInList = window.filteredSinnerData.some(s => s.id === window.currentSelectedSinner.id);
            if (sinnerStillInList) {
                currentSelectedSinner = window.currentSelectedSinner;
            } else {
                window.currentSelectedSinner = null;
            }
        }
    }
    
    // 检查当前是否有选中的罪人，如果没有，尝试从filteredSinnerData中获取
    if (!currentSelectedSinner) {
        // 如果只有一个罪人，直接选中该罪人
        if (window.filteredSinnerData && window.filteredSinnerData.length === 1) {
            currentSelectedSinner = window.filteredSinnerData[0];
            window.currentSelectedSinner = currentSelectedSinner;
            selectedSinnerEl.textContent = currentSelectedSinner.name;
            // 高亮显示选中的罪人
            highlightSelectedItem(sinnerScroll, 0);
        } else {
            Modal.alert('请先选择一个罪人！', '提示');
            return;
        }
    }
    
    // 检查当前罪人的人格数量（修复异常2：正确过滤人格）
    const filteredPersonalities = currentSelectedSinner.personalities.filter((persona, index) => {
        // 如果没有设置该罪人的筛选数据，默认选中所有人格
        if (!window.filteredPersonalityData[currentSelectedSinner.id]) {
            return true;
        }
        // 如果设置了筛选数据，只有明确不为false的才选中
        return window.filteredPersonalityData[currentSelectedSinner.id][index] !== false;
    });
    
    const personasToShow = filteredPersonalities.length > 0 ? filteredPersonalities : ['请先选择人格'];
    if (personasToShow.length < 1) {
        Modal.alert(Config.errorMessages.noPersonasSelected, '提示');
        return;
    }
    
    // 当人格数量为1时，直接调用停止函数选择该人格，不启动滚动
    if (personasToShow.length === 1) {
        stopPersonaScroll();
        return;
    }
    
    // 隐藏空状态
    const personaEmpty = document.getElementById('persona-empty');
    if (personaEmpty) {
        personaEmpty.classList.add('hidden');
    }
    
    // 添加滚动状态CSS类
    const personaScrollContainer = document.getElementById('persona-scroll-container');
    if (personaScrollContainer) {
        personaScrollContainer.classList.add('scrolling');
    }
    
    if (personaScrollInterval) return;
    
    personaStartBtn.disabled = true;
    personaStopBtn.disabled = false;
    isPersonaScrolling = true;
    
    // 清除之前选中的高亮
    clearHighlight(personaScroll);
    
    // 快速滚动
    const speed = Config.scrollSpeed;
    personaScroll.style.transition = `transform ${Config.transitionDuration} ${Config.transitionType}`;
    
    personaScrollInterval = setInterval(() => {
        personaOffset += speed;
        personaScroll.style.transform = `translateY(-${personaOffset}px)`;
        
        // 循环重置逻辑
        const totalHeight = personaItems.length * itemHeight * 5;
        if (personaOffset > totalHeight) {
            personaOffset = personaOffset % totalHeight;
            personaScroll.style.transition = 'none';
            personaScroll.style.transform = `translateY(-${personaOffset}px)`;
            setTimeout(() => {
                personaScroll.style.transition = 'transform 0.05s linear';
            }, 10);
        }
    }, 10);
}

// 停止人格滚动并定位到中心
function stopPersonaScroll() {
    // 【修复bug】强制验证currentSelectedSinner是否在筛选列表中
    if (currentSelectedSinner && window.filteredSinnerData) {
        const sinnerStillInList = window.filteredSinnerData.some(s => s.id === currentSelectedSinner.id);
        if (!sinnerStillInList) {
            // 如果当前选中的罪人不在筛选列表中，清空并重新获取
            currentSelectedSinner = null;
            window.currentSelectedSinner = null;
            
            // 如果只有一个罪人，直接选中
            if (window.filteredSinnerData.length === 1) {
                currentSelectedSinner = window.filteredSinnerData[0];
                window.currentSelectedSinner = currentSelectedSinner;
            } else {
                Modal.alert('请先选择一个罪人！', '提示');
                return;
            }
        }
    }
    
    // 检查当前罪人的人格数量（修复异常2：正确过滤人格）
    if (currentSelectedSinner) {
        const filteredPersonalities = currentSelectedSinner.personalities.filter((persona, index) => {
            // 如果没有设置该罪人的筛选数据，默认选中所有人格
            if (!window.filteredPersonalityData[currentSelectedSinner.id]) {
                return true;
            }
            // 如果设置了筛选数据，只有明确不为false的才选中
            return window.filteredPersonalityData[currentSelectedSinner.id][index] !== false;
        });
        
        const personasToShow = filteredPersonalities.length > 0 ? filteredPersonalities : ['请先选择人格'];
        if (personasToShow.length <= 1) {
            // 直接选中唯一人格（如果有的话）
            if (personasToShow.length === 0) {
                Modal.alert('请至少选择一个人格！', '提示');
                return;
            }
            
            const selectedPersona = personasToShow[0];
            // 设置当前选中的人格
            currentSelectedPersona = selectedPersona;
            window.currentSelectedPersona = selectedPersona;
            selectedPersonaEl.textContent = typeof selectedPersona === 'object' ? selectedPersona.name : selectedPersona;
            updateResultDisplay();
            
            // 高亮显示
            highlightSelectedItem(personaScroll, 0);
            
            // 当只有一个人格时，启用开始按钮（与createPersonaScrollList保持一致）
            personaStartBtn.disabled = false;
            personaStopBtn.disabled = true;
            
            // 彩蛋检测：检查是否触发特殊人格彩蛋
            checkEasterEgg();
            
            return;
        }
    }
    
    if (!personaScrollInterval || !currentSelectedSinner) return;
    
    clearInterval(personaScrollInterval);
    personaScrollInterval = null;
    isPersonaScrolling = false;
    
    // 获取筛选后的人格列表（修复异常2：正确过滤人格）
    const filteredPersonalities = currentSelectedSinner.personalities.filter((persona, index) => {
        // 如果没有设置该罪人的筛选数据，默认选中所有人格
        if (!window.filteredPersonalityData[currentSelectedSinner.id]) {
            return true;
        }
        // 如果设置了筛选数据，只有明确不为false的才选中
        return window.filteredPersonalityData[currentSelectedSinner.id][index] !== false;
    });
    
    const personasToShow = filteredPersonalities.length > 0 ? filteredPersonalities : ['请先选择人格'];
    
    // 检查是否有人格被选中
    if (personasToShow.length === 0) {
        Modal.alert('请至少选择一个人格！', '提示');
        personaStartBtn.disabled = false;
        personaStopBtn.disabled = true;
        return;
    }
    
    // 随机选择一个人格
    const randomIndex = secureRandInt(personasToShow.length);
    const selectedPersona = personasToShow[randomIndex];
    currentSelectedPersona = selectedPersona;
    window.currentSelectedPersona = selectedPersona; // 更新window对象
    selectedPersonaEl.textContent = typeof selectedPersona === 'object' ? selectedPersona.name : selectedPersona;
    updateResultDisplay();
    
    // 计算显示行数和中心行索引
    const visibleRows = Math.min(Math.max(personasToShow.length, 1), 5);
    const centerIndex = Math.floor(visibleRows / 2);
    // 修正：centerOffset应该是到可视区域中心的距离，而不是到中心行顶部
    const centerOffset = centerIndex * itemHeight + itemHeight / 2;
    
    // 计算目标偏移量，确保选中项显示在中心行
    const loopCount = 5; // 使用第5次循环的项目进行定位
    const targetOffset = (randomIndex + loopCount * personasToShow.length) * itemHeight - centerOffset;
    
    // 增加随机减速效果：额外滚动整数圈（1-3圈），确保选中项仍在中心位置
    const randomExtraSpins = 1 + Math.floor(Math.random() * 3); // 1到3整圈
    const extraOffset = randomExtraSpins * personasToShow.length * itemHeight;
    const finalOffset = targetOffset + extraOffset;
    
    // 平滑过渡到目标位置（使用更有趣的缓动函数）
    personaScroll.style.transition = 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    personaScroll.style.transform = `translateY(-${finalOffset}px)`;
    
    // 更新当前偏移量
    personaOffset = finalOffset;
    
    // 高亮显示选中的项目
    setTimeout(() => {
        highlightSelectedItem(personaScroll, randomIndex, personaOffset, personasToShow.length);
    }, 1200); // 等待过渡动画完成
    
    personaStartBtn.disabled = false;
    personaStopBtn.disabled = true;
    
    // 移除滚动状态CSS类
    const personaScrollContainer = document.getElementById('persona-scroll-container');
    if (personaScrollContainer) {
        personaScrollContainer.classList.remove('scrolling');
    }
    
    // 彩蛋检测：检查是否触发特殊人格彩蛋
    checkEasterEgg();
}

// 清除高亮显示
function clearHighlight(scrollContainer) {
    const items = scrollContainer.querySelectorAll('.scroll-item');
    items.forEach(item => {
        item.classList.remove('selected');
    });
}

// 高亮显示选中项 - 重构版本（支持少量项目）
function highlightSelectedItem(scrollContainer, selectedIndex, scrollOffset = null, itemsLength = null) {
    clearHighlight(scrollContainer);
    const items = scrollContainer.querySelectorAll('.scroll-item');
    
    if (!items.length || itemsLength === null || itemsLength === 0) return;
    
    // 简化逻辑：直接找到originalIndex === selectedIndex的元素
    // 因为我们已经知道是哪个原始索引被选中了
    items.forEach(item => {
        const itemOriginalIndex = parseInt(item.dataset.originalIndex) || 0;
        // 高亮所有数据原始索引与选中项相同的元素（10次重复）
        if (itemOriginalIndex === selectedIndex) {
            item.classList.add('selected');
        }
    });
}

// ==================== 通用彩蛋系统框架 ====================

/**
 * 彩蛋视频配置表：定义触发特定彩蛋的条件和视频资源路径
 * 格式：{ sinnerId: { personaName: videoPath } }
 * 
 * 使用说明：
 * 1. 准备视频文件，放入 assets/videos/ 目录
 * 2. 在此配置表中添加映射关系：罪人ID -> 人格名称 -> 视频路径
 * 3. 人格名称必须与 characters.js 中的 name 字段完全一致
 * 4. 视频路径相对于项目根目录
 * 
 * 示例：为李箱的某个人格添加彩蛋
 * 1: {
 *     '脑叶公司E.G.O:庄严哀悼': 'assets/videos/yi_sang_ego_demo.mp4'
 * }
 */
const easterEggConfig = {
    2: { // 浮士德 (Faust)
        '黑兽-卯魁首': 'assets/videos/faust_mao_kui_shou.mp4'
    },
    5: { // 默尔索 (Meursault)
        '拇指东部指挥官IIII': 'assets/videos/meursault_thumbs.mp4'
    },
    6: { // 鸿璐 (Hong Lu)
        "鸿园的君主": 'assets/videos/Hong_Lu_Hong_Yuan_The_King.mp4'
    },
    9: { // 罗佳 (Rodion)
        '脑叶公司E.G.O:泪锋之剑': 'assets/videos/rodion_tear_sword.mp4'
    }
    // 扩展示例（取消注释并替换为实际视频路径即可使用）：
    // 1: { // 李箱 (Yi Sang)
    //     '脑叶公司E.G.O:庄严哀悼': 'assets/videos/yi_sang_sorrow.mp4'
    // },
    // 3: { // 堂吉诃德 (Don Quixote)
    //     '脑叶公司E.G.O:提灯': 'assets/videos/don_lantern.mp4'
    // }
};

/**
 * 彩蛋检测与触发函数
 * 在人格抽取完成后调用，检查当前选中的罪人和人格是否匹配彩蛋配置
 * 采用配置驱动模式，自动匹配并播放对应视频
 */
function checkEasterEgg() {
    if (!currentSelectedSinner || !currentSelectedPersona) return;

    const sinnerId = currentSelectedSinner.id;
    const personaName = typeof currentSelectedPersona === 'object'
        ? currentSelectedPersona.name
        : currentSelectedPersona;

    // 检查彩蛋配置表中是否有对应的罪人配置
    if (!easterEggConfig[sinnerId]) return;

    // 检查该罪人的人格配置中是否有当前选中的人格
    const videoPath = easterEggConfig[sinnerId][personaName];
    if (!videoPath) return;

    // 触发彩蛋：播放指定视频
    triggerUniversalEasterEgg(videoPath);
}

/**
 * 通用彩蛋视频播放器
 * 采用单例模式，所有彩蛋共用一个播放框架，仅动态切换视频源
 * @param {string} videoPath - 视频文件路径（相对于项目根目录）
 */
function triggerUniversalEasterEgg(videoPath) {
    const modalId = 'universal-easter-egg-modal';
    const videoId = 'universal-easter-egg-video';
    const closeBtnId = 'universal-easter-egg-close-btn';
    
    const modal = document.getElementById(modalId);
    const video = document.getElementById(videoId);
    const closeBtn = document.getElementById(closeBtnId);
    
    if (!modal || !video || !closeBtn) {
        console.warn('通用彩蛋播放器元素未找到，请检查 index.html 结构');
        return;
    }

    /**
     * 关闭模态框：渐缓淡出动画 + 清理状态
     */
    const hideModal = () => {
        // 移除淡入类，触发淡出动画
        modal.classList.remove('fade-in');
        
        // 等待淡出动画完成后隐藏并清理
        setTimeout(() => {
            modal.classList.remove('active');
            video.pause();
            video.currentTime = 0;
            // 清空视频源，释放资源
            video.src = '';
        }, 400); // 与 CSS transition 时间一致
    };

    /**
     * 绑定关闭按钮事件（每次打开时重新绑定，避免重复绑定）
     */
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        hideModal();
    };

    /**
     * 点击视频实现暂停/播放切换
     */
    video.onclick = (e) => {
        e.stopPropagation();
        if (video.paused) {
            video.play().catch(() => {
                // 忽略播放失败（可能是用户权限问题）
            });
        } else {
            video.pause();
        }
    };

    /**
     * 点击遮罩空白区域关闭（不包括视频和按钮区域）
     */
    modal.onclick = (e) => {
        if (e.target === modal) {
            hideModal();
        }
    };

    /**
     * 显示模态框并播放视频：渐缓淡入动画
     */
    // 1. 动态设置视频源
    video.src = videoPath;
    video.load(); // 重新加载视频
    
    // 2. 显示模态框（初始透明）
    modal.classList.add('active');
    
    // 3. 触发淡入动画（使用 requestAnimationFrame 确保 CSS transition 生效）
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            modal.classList.add('fade-in');
        });
    });
    
    // 4. 尝试自动播放视频（某些浏览器可能阻止自动播放）
    setTimeout(() => {
        video.currentTime = 0;
        const playPromise = video.play();
        if (playPromise && typeof playPromise.then === 'function') {
            playPromise.catch((error) => {
                console.info('彩蛋视频自动播放被浏览器阻止，用户可点击视频手动播放');
            });
        }
    }, 100); // 稍微延迟，等待视频加载
}

// 更新结果展示面板
function updateResultDisplay() {
    console.log('updateResultDisplay被调用', {sinner: currentSelectedSinner?.name, persona: currentSelectedPersona?.name});
    const resultDisplay = document.getElementById('result-display');
    const resultFinal = document.getElementById('result-final');
    const sinnerEmpty = document.getElementById('sinner-empty');
    const personaEmpty = document.getElementById('persona-empty');
    const availableSinnersEl = document.getElementById('available-sinners');
    
    // 更新可用罪人数量
    if (availableSinnersEl && window.filteredSinnerData) {
        availableSinnersEl.textContent = `${window.filteredSinnerData.length}/12`;
    }
    
    // 罪人选择后隐藏空状态
    if (currentSelectedSinner && sinnerEmpty) {
        sinnerEmpty.style.display = 'none';
    }
    
    // 人格选择后隐藏空状态
    if (currentSelectedPersona && personaEmpty) {
        personaEmpty.style.display = 'none';
    }
    
    // 人格选择后更新结果面板（显示详细信息）
    if (currentSelectedSinner && currentSelectedPersona) {
        // 隐藏空状态，显示最终结果
        if (resultDisplay) {
            resultDisplay.style.display = 'none';
        }
        if (resultFinal) {
            resultFinal.style.display = 'block';
        }
        
        // 更新罪人信息
        const sinnerNameEl = document.getElementById('selected-sinner');
        const sinnerImg = document.getElementById('result-sinner-img');
        const sinnerFallback = document.getElementById('result-sinner-fallback');
        
        if (sinnerNameEl) {
            sinnerNameEl.textContent = typeof currentSelectedSinner === 'object' 
                ? currentSelectedSinner.name 
                : currentSelectedSinner;
        }
        
        if (sinnerImg && currentSelectedSinner.avatar) {
            sinnerImg.src = currentSelectedSinner.avatar;
            sinnerImg.alt = currentSelectedSinner.name;
            sinnerImg.style.display = 'block';
            if (sinnerFallback) sinnerFallback.style.display = 'none';
            
            // 图片加载失败时显示fallback
            sinnerImg.onerror = function() {
                this.style.display = 'none';
                if (sinnerFallback) sinnerFallback.style.display = 'flex';
            };
        }
        
        // 更新人格信息
        const personaNameEl = document.getElementById('selected-persona');
        const personaImg = document.getElementById('result-persona-img');
        const personaFallback = document.getElementById('result-persona-fallback');
        
        const personaName = typeof currentSelectedPersona === 'object' 
            ? currentSelectedPersona.name 
            : currentSelectedPersona;
        
        if (personaNameEl) {
            personaNameEl.textContent = personaName;
        }
        
        // 获取人格头像
        let personaAvatar = '';
        if (typeof currentSelectedPersona === 'object' && currentSelectedPersona.avatar) {
            personaAvatar = currentSelectedPersona.avatar;
        } else if (currentSelectedSinner && currentSelectedSinner.personalities) {
            // 从罪人数据中查找对应人格的头像
            const persona = currentSelectedSinner.personalities.find(p => p.name === personaName);
            if (persona && persona.avatar) {
                personaAvatar = persona.avatar;
            }
        }
        
        if (personaImg && personaAvatar) {
            personaImg.src = personaAvatar;
            personaImg.alt = personaName;
            personaImg.style.display = 'block';
            if (personaFallback) personaFallback.style.display = 'none';
            
            personaImg.onerror = function() {
                this.style.display = 'none';
                if (personaFallback) personaFallback.style.display = 'flex';
            };
        }
        
    } else if (currentSelectedSinner) {
        // 只选择了罪人，显示中间状态
        if (resultDisplay) {
            resultDisplay.style.display = 'block'; // 确保显示resultDisplay（修复重新选择罪人后结果不显示的bug）
            resultDisplay.innerHTML = `
                <div class="result-empty">
                    <div class="result-sinner-preview">
                        <div class="result-sinner-avatar" style="margin: 0 auto 16px;">
                            <img src="${currentSelectedSinner.avatar || ''}" alt="${currentSelectedSinner.name}" 
                                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" 
                                style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--lc-gold);">
                            <div class="avatar-fallback" style="display:none;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                            </div>
                        </div>
                        <div class="result-empty-text" style="color: var(--lc-gold);">${currentSelectedSinner.name}</div>
                        <div class="result-empty-hint">已选择罪人，请继续选择人格</div>
                    </div>
                </div>
            `;
        }
        if (resultFinal) {
            resultFinal.style.display = 'none';
        }
    }
}

// 重置结果展示
function resetResultDisplay() {
    const resultDisplay = document.getElementById('result-display');
    const resultFinal = document.getElementById('result-final');
    const sinnerEmpty = document.getElementById('sinner-empty');
    const personaEmpty = document.getElementById('persona-empty');
    
    if (resultDisplay) {
        resultDisplay.style.display = 'block';
        resultDisplay.innerHTML = `
            <div class="result-empty">
                <div class="result-empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                </div>
                <div class="result-empty-text">等待抽取</div>
                <div class="result-empty-hint">完成两级选择查看结果</div>
            </div>
        `;
    }
    if (resultFinal) {
        resultFinal.style.display = 'none';
    }
    if (sinnerEmpty) {
        sinnerEmpty.classList.remove('hidden');
    }
    
    // 【修复】只在没有选择罪人时显示 persona-empty
    // 如果已经选择了罪人，persona-empty 应该保持隐藏状态（因为人格列表已经渲染）
    if (personaEmpty && !currentSelectedSinner) {
        personaEmpty.classList.remove('hidden');
    }
    
    // 重置图片
    const sinnerImg = document.getElementById('result-sinner-img');
    const sinnerFallback = document.getElementById('result-sinner-fallback');
    const personaImg = document.getElementById('result-persona-img');
    const personaFallback = document.getElementById('result-persona-fallback');
    
    if (sinnerImg) { sinnerImg.style.display = 'none'; sinnerImg.src = ''; }
    if (sinnerFallback) sinnerFallback.style.display = 'flex';
    if (personaImg) { personaImg.style.display = 'none'; personaImg.src = ''; }
    if (personaFallback) personaFallback.style.display = 'flex';
}

export {
    initScrollModule,
    createSinnerScrollList,
    createPersonaScrollList,
    startSinnerScroll,
    resetPersonaScrollState,
    stopSinnerScroll,
    startPersonaScroll,
    stopPersonaScroll,
    clearHighlight,
    highlightSelectedItem,
    updateResultDisplay,
    resetResultDisplay
};