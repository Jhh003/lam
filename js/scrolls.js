import { Config } from '../data/config.js';
import { secureRandInt } from '../data/utils/helpers.js';
// 导入罪人数据
import { sinnerData } from '../data/characters.js';

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
}

// 创建罪人滚动列表
function createSinnerScrollList(items) {
    sinnerScroll.innerHTML = '';
    sinnerItems = items;
    
    // 计算显示行数 (最小1行，最大5行)
    const visibleRows = Math.min(Math.max(items.length, 1), 5);
    const containerHeight = visibleRows * itemHeight;
    sinnerScroll.parentElement.style.height = `${containerHeight}px`;
    
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
    
    // 如果只有一个项目，直接高亮显示
    if (items.length === 1) {
        setTimeout(() => {
            highlightSelectedItem(sinnerScroll, 0);
        }, 100);
    }
}

// 创建人格滚动列表
function createPersonaScrollList(items) {
    console.log('createPersonaScrollList被调用，items:', items);
    // 确保items是一个数组
    if (!Array.isArray(items)) {
        console.error('createPersonaScrollList: items必须是一个数组');
        return;
    }
    
    personaScroll.innerHTML = '';
    personaItems = items;
    
    // 计算显示行数 (最小1行，最大5行)
    const visibleRows = Math.min(Math.max(items.length, 1), 5);
    const containerHeight = visibleRows * itemHeight;
    personaScroll.parentElement.style.height = `${containerHeight}px`;
    
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
    
    // 如果只有一个人格，禁用开始按钮
    personaStartBtn.disabled = items.length === 1;
    
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
        
        // 获取人格信息
        const personaInfo = items[i % items.length];
        if (personaInfo && personaInfo.avatar) {
            avatarElement.src = personaInfo.avatar;
            avatarElement.alt = personaInfo.name;
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
            avatarElement.alt = '未知头像';
        }
        content.appendChild(avatarElement);
        
        const textSpan = document.createElement('span');
        textSpan.textContent = items[i % items.length].name;
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
            console.log('当前选中人格:', currentSelectedPersona);
            if (currentSelectedPersona && currentSelectedPersona.name) {
                selectedPersonaEl.textContent = currentSelectedPersona.name;
                console.log('selectedPersonaEl文本设置为:', currentSelectedPersona.name);
            } else {
                console.error('当前选中人格无效:', currentSelectedPersona);
                selectedPersonaEl.textContent = '未选择';
            }
            personaStartBtn.disabled = true;
        }, 0); // 使用0延迟确保在DOM更新后执行
    } else {
        personaStartBtn.disabled = false;
    }
}

// 开始罪人滚动
function startSinnerScroll() {
    if (window.filteredSinnerData.length < 1) {
        alert('请至少选择一个罪人！');
        return;
    }
    
    // 当罪人数量为1时，直接调用停止函数选择该罪人，不启动滚动
    if (window.filteredSinnerData.length === 1) {
        stopSinnerScroll();
        return;
    }
    
    if (sinnerScrollInterval) return;
    
    sinnerStartBtn.disabled = true;
    sinnerStopBtn.disabled = false;
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
    selectedPersonaEl.textContent = '未选择';
}

// 停止罪人滚动并定位到中心
function stopSinnerScroll() {
    // 如果只有一个罪人，直接选中
    if (window.filteredSinnerData.length <= 1) {
        if (window.filteredSinnerData.length === 0) {
            alert('请至少选择一个罪人！');
            return;
        }
        
        // 直接选中唯一罪人
        currentSelectedSinner = window.filteredSinnerData[0];
        selectedSinnerEl.textContent = currentSelectedSinner.name;
        selectedPersonaEl.textContent = "未选择";
        
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
        
        return;
    }
    
    if (!sinnerScrollInterval) return;
    
    clearInterval(sinnerScrollInterval);
    sinnerScrollInterval = null;
    isSinnerScrolling = false;
    
    // 从筛选后的罪人中随机选择
    if (window.filteredSinnerData.length === 0) {
        alert('请至少选择一个罪人！');
        sinnerStartBtn.disabled = false;
        sinnerStopBtn.disabled = true;
        return;
    }
    
    const randomIndex = secureRandInt(window.filteredSinnerData.length);
    currentSelectedSinner = window.filteredSinnerData[randomIndex];
    selectedSinnerEl.textContent = currentSelectedSinner.name;
    selectedPersonaEl.textContent = "未选择";
    
    // 计算在当前筛选后数据中的索引用于定位
    const filteredIndex = window.filteredSinnerData.findIndex(s => s.id === currentSelectedSinner.id);
    
    // 计算显示行数和中心行索引
    const visibleRows = Math.min(Math.max(window.filteredSinnerData.length, 1), 5);
    const centerIndex = Math.floor(visibleRows / 2);
    const centerOffset = centerIndex * itemHeight;
    
    // 计算目标偏移量，确保选中项显示在中心行
    const loopCount = 5; // 使用第5次循环的项目进行定位，确保前后都有足够项目
    const targetOffset = (filteredIndex + loopCount * window.filteredSinnerData.length) * itemHeight - centerOffset;
    
    // 平滑过渡到目标位置
    sinnerScroll.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
    sinnerScroll.style.transform = `translateY(-${targetOffset}px)`;
    
    // 更新当前偏移量
    sinnerOffset = targetOffset;
    
    // 高亮显示选中的项目
    setTimeout(() => {
        highlightSelectedItem(sinnerScroll, filteredIndex);
    }, 800); // 等待过渡动画完成
    
    sinnerStartBtn.disabled = false;
    sinnerStopBtn.disabled = true;
    
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
}

// 开始人格滚动
function startPersonaScroll() {
    // 检查当前是否有选中的罪人
    if (!currentSelectedSinner) {
        alert('请先选择一个罪人！');
        return;
    }
    
    // 检查当前罪人的人格数量
    const filteredPersonalities = currentSelectedSinner.personalities.filter((persona, index) => {
        return window.filteredPersonalityData[currentSelectedSinner.id] && 
               window.filteredPersonalityData[currentSelectedSinner.id][index] !== false;
    });
    
    const personasToShow = filteredPersonalities.length > 0 ? filteredPersonalities : ['请先选择人格'];
    if (personasToShow.length < 1) {
        alert(Config.errorMessages.noPersonasSelected);
        return;
    }
    
    // 当人格数量为1时，直接调用停止函数选择该人格，不启动滚动
    if (personasToShow.length === 1) {
        stopPersonaScroll();
        return;
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
    // 检查当前罪人的人格数量
    if (currentSelectedSinner) {
        const filteredPersonalities = currentSelectedSinner.personalities.filter((persona, index) => {
            return filteredPersonalityData[currentSelectedSinner.id] && 
                   filteredPersonalityData[currentSelectedSinner.id][index] !== false;
        });
        
        const personasToShow = filteredPersonalities.length > 0 ? filteredPersonalities : ['请先选择人格'];
        if (personasToShow.length <= 1) {
            // 直接选中唯一人格（如果有的话）
            if (personasToShow.length === 0) {
                alert('请至少选择一个人格！');
                return;
            }
            
            const selectedPersona = personasToShow[0];
            selectedPersonaEl.textContent = typeof selectedPersona === 'object' ? selectedPersona.name : selectedPersona;
            
            // 高亮显示
            highlightSelectedItem(personaScroll, 0);
            
            // 当只有一个人格时，禁用开始按钮（与createPersonaScrollList保持一致）
            personaStartBtn.disabled = personasToShow.length === 1;
            personaStopBtn.disabled = true;
            return;
        }
    }
    
    if (!personaScrollInterval || !currentSelectedSinner) return;
    
    clearInterval(personaScrollInterval);
    personaScrollInterval = null;
    isPersonaScrolling = false;
    
    // 获取筛选后的人格列表
    const filteredPersonalities = currentSelectedSinner.personalities.filter((persona, index) => {
        return filteredPersonalityData[currentSelectedSinner.id] && 
               filteredPersonalityData[currentSelectedSinner.id][index] !== false;
    });
    
    const personasToShow = filteredPersonalities.length > 0 ? filteredPersonalities : ['请先选择人格'];
    
    // 检查是否有人格被选中
    if (personasToShow.length === 0) {
        alert('请至少选择一个人格！');
        personaStartBtn.disabled = false;
        personaStopBtn.disabled = true;
        return;
    }
    
    // 随机选择一个人格
    const randomIndex = secureRandInt(personasToShow.length);
    const selectedPersona = personasToShow[randomIndex];
    selectedPersonaEl.textContent = typeof selectedPersona === 'object' ? selectedPersona.name : selectedPersona;
    
    // 计算显示行数和中心行索引
    const visibleRows = Math.min(Math.max(personasToShow.length, 1), 5);
    const centerIndex = Math.floor(visibleRows / 2);
    const centerOffset = centerIndex * itemHeight;
    
    // 计算目标偏移量，确保选中项显示在中心行
    const loopCount = 5; // 使用第5次循环的项目进行定位
    const targetOffset = (randomIndex + loopCount * personasToShow.length) * itemHeight - centerOffset;
    
    // 平滑过渡到目标位置
    personaScroll.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
    personaScroll.style.transform = `translateY(-${targetOffset}px)`;
    
    // 更新当前偏移量
    personaOffset = targetOffset;
    
    // 高亮显示选中的项目
    setTimeout(() => {
        highlightSelectedItem(personaScroll, randomIndex);
    }, 800); // 等待过渡动画完成
    
    personaStartBtn.disabled = false;
    personaStopBtn.disabled = true;
}

// 清除高亮显示
function clearHighlight(scrollContainer) {
    const items = scrollContainer.querySelectorAll('.scroll-item');
    items.forEach(item => {
        item.classList.remove('selected');
    });
}

// 高亮显示选中项
function highlightSelectedItem(scrollContainer, index) {
    clearHighlight(scrollContainer);
    const items = scrollContainer.querySelectorAll('.scroll-item');
    items.forEach(item => {
        const itemOriginalIndex = parseInt(item.dataset.originalIndex);
        // 查找与给定索引匹配的项目（考虑到重复的项目）
        if (itemOriginalIndex === index) {
            item.classList.add('selected');
        }
    });
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
    highlightSelectedItem
};