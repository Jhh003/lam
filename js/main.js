// 边狱公司 - 今天蛋筒什么？主应用逻辑

// 导入罪人数据
import { sinnerData } from '../data/characters.js';

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
const itemHeight = 50; // 每个项目高度

// 新增变量：筛选后的罪人数据
let filteredSinnerData = [...sinnerData]; // 默认包含所有罪人

// 新增变量：筛选后的人格数据
let filteredPersonalityData = {};

// 新增变量：存储原始筛选状态，用于检测是否有更改
let originalFilteredSinnerData = [];
let originalFilteredPersonalityData = {};
let hasUnsavedChanges = false;

// 安全随机整数生成函数 [0, max)
function secureRandInt(max) {
    if (max <= 0) return 0;
    try {
        if (window.crypto && crypto.randomInt) {
            return crypto.randomInt(0, max);
        }
        if (window.crypto && crypto.getRandomValues) {
            const arr = new Uint32Array(1);
            crypto.getRandomValues(arr);
            return arr[0] % max;
        }
    } catch (e) {
        console.warn('安全随机数失败，回退到 Math.random', e);
    }
    return Math.floor(Math.random() * max);
}

// 页面导航功能
mainPageBtn.addEventListener('click', () => {
    if (!checkUnsavedChanges()) {
        return; // 用户选择取消操作
    }
    
    // 检查是否满足保底条件
    if (!validateFilterSettings()) {
        return; // 不满足保底条件，阻止返回主页面
    }
    
    mainSelectorPage.style.display = 'block';
    settingsPage.style.display = 'none';
    mainPageBtn.classList.add('active');
    settingsPageBtn.classList.remove('active');
    refreshScrollsOnReturn();
});

settingsPageBtn.addEventListener('click', () => {
    mainSelectorPage.style.display = 'none';
    settingsPage.style.display = 'block';
    settingsPageBtn.classList.add('active');
    mainPageBtn.classList.remove('active');
    createPersonalitySettings();
});

// 创建滚动列表
function createSinnerScrollList(items) {
    sinnerScroll.innerHTML = '';
    sinnerItems = items;
    
    // 计算显示行数 (最小1行，最大5行)
    const visibleRows = Math.min(Math.max(items.length, 1), 5);
    const containerHeight = visibleRows * itemHeight;
    sinnerScrollContainer.style.height = `${containerHeight}px`;
    
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
        const sinnerInfo = sinnerData.find(s => s.name === items[i % items.length]);
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
        textSpan.textContent = items[i % items.length];
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
    personaScrollContainer.style.height = `${containerHeight}px`;
    
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
    if (filteredSinnerData.length < 1) {
        alert('请至少选择一个罪人！');
        return;
    }
    
    // 当罪人数量为1时，直接调用停止函数选择该罪人，不启动滚动
    if (filteredSinnerData.length === 1) {
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
    const speed = 150;
    sinnerScroll.style.transition = 'transform 0.05s linear';
    
    sinnerScrollInterval = setInterval(() => {
        sinnerOffset += speed;
        sinnerScroll.style.transform = `translateY(-${sinnerOffset}px)`;
        
        // 循环重置逻辑
        const totalHeight = sinnerItems.length * itemHeight * 5;
        if (sinnerOffset > totalHeight) {
            sinnerOffset = sinnerOffset % totalHeight;
            sinnerScroll.style.transition = 'none';
            sinnerScroll.style.transform = `translateY(-${sinnerOffset}px)`;
            setTimeout(() => {
                sinnerScroll.style.transition = 'transform 0.05s linear';
            }, 10);
        }
    }, 10);
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
    if (filteredSinnerData.length <= 1) {
        if (filteredSinnerData.length === 0) {
            alert('请至少选择一个罪人！');
            return;
        }
        
        // 直接选中唯一罪人
        currentSelectedSinner = filteredSinnerData[0];
        selectedSinnerEl.textContent = currentSelectedSinner.name;
        selectedPersonaEl.textContent = "未选择";
        
        // 高亮显示
        highlightSelectedItem(sinnerScroll, sinnerData.findIndex(s => s.id === currentSelectedSinner.id));
        
        // 重置二级转盘状态
        resetPersonaScrollState();
        
        // 创建对应罪人的人格列表
        console.log('当前选中罪人:', currentSelectedSinner);
        console.log('人格筛选数据:', filteredPersonalityData[currentSelectedSinner.id]);
        
        // 重置当前罪人的筛选状态（解决从多人格切换到单人格时的问题）
        filteredPersonalityData[currentSelectedSinner.id] = {};
        // 默认选择所有人格
        currentSelectedSinner.personalities.forEach((_, index) => {
            filteredPersonalityData[currentSelectedSinner.id][index] = true;
        });
        
        const filteredPersonalities = currentSelectedSinner.personalities.filter((persona, index) => {
            // 如果没有设置该人格的筛选状态，默认为true
            const isSelected = filteredPersonalityData[currentSelectedSinner.id][index] !== false;
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
    if (filteredSinnerData.length === 0) {
        alert('请至少选择一个罪人！');
        sinnerStartBtn.disabled = false;
        sinnerStopBtn.disabled = true;
        return;
    }
    
    const randomIndex = secureRandInt(filteredSinnerData.length);
    currentSelectedSinner = filteredSinnerData[randomIndex];
    selectedSinnerEl.textContent = currentSelectedSinner.name;
    selectedPersonaEl.textContent = "未选择";
    
    // 计算在原始sinnerData中的索引用于定位
    const originalIndex = sinnerData.findIndex(s => s.id === currentSelectedSinner.id);
    
    // 计算显示行数和中心行索引
    const visibleRows = Math.min(Math.max(filteredSinnerData.length, 1), 5);
    const centerIndex = Math.floor(visibleRows / 2);
    const centerOffset = centerIndex * itemHeight;
    
    // 计算目标偏移量，确保选中项显示在中心行
    const loopCount = 5; // 使用第5次循环的项目进行定位，确保前后都有足够项目
    const targetOffset = (originalIndex + loopCount * sinnerItems.length) * itemHeight - centerOffset;
    
    // 平滑过渡到目标位置
    sinnerScroll.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
    sinnerScroll.style.transform = `translateY(-${targetOffset}px)`;
    
    // 更新当前偏移量
    sinnerOffset = targetOffset;
    
    // 高亮显示选中的项目
    setTimeout(() => {
        highlightSelectedItem(sinnerScroll, originalIndex);
    }, 800); // 等待过渡动画完成
    
    sinnerStartBtn.disabled = false;
    sinnerStopBtn.disabled = true;
    
    // 人格选择按钮状态由createPersonaScrollList函数自动处理
    // personaStartBtn.disabled = false;
    
    // 重置二级转盘状态
    resetPersonaScrollState();
    
    // 创建对应罪人的人格列表
    console.log('当前选中罪人:', currentSelectedSinner);
    console.log('人格筛选数据:', filteredPersonalityData[currentSelectedSinner.id]);
    
    // 确保filteredPersonalityData中存在该罪人的数据
    if (!filteredPersonalityData[currentSelectedSinner.id]) {
        filteredPersonalityData[currentSelectedSinner.id] = {};
        // 默认选择所有人格
        currentSelectedSinner.personalities.forEach((_, index) => {
            filteredPersonalityData[currentSelectedSinner.id][index] = true;
        });
    }
    
    const filteredPersonalities = currentSelectedSinner.personalities.filter((persona, index) => {
        // 如果没有设置该人格的筛选状态，默认为true
        const isSelected = filteredPersonalityData[currentSelectedSinner.id][index] !== false;
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
        return filteredPersonalityData[currentSelectedSinner.id] && 
               filteredPersonalityData[currentSelectedSinner.id][index] !== false;
    });
    
    const personasToShow = filteredPersonalities.length > 0 ? filteredPersonalities : ['请先选择人格'];
    if (personasToShow.length < 1) {
        alert('请至少选择一个人格！');
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
    const speed = 150;
    personaScroll.style.transition = 'transform 0.05s linear';
    
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

// 创建罪人筛选复选框
function createSinnerFilter() {
    const filterContainer = document.getElementById('sinner-filter');
    filterContainer.innerHTML = '';
    
    sinnerData.forEach(sinner => {
        const label = document.createElement('label');
        label.className = 'sinner-checkbox-label';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = sinner.id;
        checkbox.checked = true; // 默认全选
        checkbox.addEventListener('change', updateFilteredSinnerData);
        
        // 创建头像元素
        if (sinner.avatar) {
            const avatarImg = document.createElement('img');
            avatarImg.className = 'filter-avatar';
            avatarImg.style.width = '20px';
            avatarImg.style.height = '20px';
            avatarImg.src = sinner.avatar;
            avatarImg.alt = sinner.name;
            avatarImg.onerror = function() {
                // 如果图片加载失败，显示占位符
                this.parentNode.replaceChild(createAvatarPlaceholder(sinner), this);
            };
            label.appendChild(checkbox);
            label.appendChild(avatarImg);
        } else {
            const placeholder = createAvatarPlaceholder(sinner);
            label.appendChild(checkbox);
            label.appendChild(placeholder);
        }
        
        label.appendChild(document.createTextNode(sinner.name));
        
        filterContainer.appendChild(label);
    });
}

// 人格筛选的全选/全不选功能
function toggleAllPersonalities(selectAll) {
    const allCheckboxes = document.querySelectorAll('#personality-settings-container input[type="checkbox"]');
    allCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAll;
        // 触发change事件以更新内部状态
        checkbox.dispatchEvent(new Event('change'));
    });
}

// 人格筛选的反选功能
function invertAllPersonalities() {
    const allCheckboxes = document.querySelectorAll('#personality-settings-container input[type="checkbox"]');
    allCheckboxes.forEach(checkbox => {
        checkbox.checked = !checkbox.checked;
        // 触发change事件以更新内部状态
        checkbox.dispatchEvent(new Event('change'));
    });
}

// 特定罪人的全选/全不选功能
function toggleSinnerPersonalities(sinnerId, selectAll) {
    const sinnerCheckboxes = document.querySelectorAll(`#personality-settings-container .personality-page[data-sinner-id="${sinnerId}"] input[type="checkbox"]`);
    sinnerCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAll;
        // 触发change事件以更新内部状态
        checkbox.dispatchEvent(new Event('change'));
    });
}

// 特定罪人的反选功能
function invertSinnerPersonalities(sinnerId) {
    const sinnerCheckboxes = document.querySelectorAll(`#personality-settings-container .personality-page[data-sinner-id="${sinnerId}"] input[type="checkbox"]`);
    sinnerCheckboxes.forEach(checkbox => {
        checkbox.checked = !checkbox.checked;
        // 触发change事件以更新内部状态
        checkbox.dispatchEvent(new Event('change'));
    });
}

// 创建人格筛选设置（分页形式）
function createPersonalitySettings() {
    const container = document.getElementById('personality-settings-container');
    container.innerHTML = '';
    
    // 获取当前选中的罪人ID列表
    const selectedSinnerCheckboxes = document.querySelectorAll('#sinner-filter input[type="checkbox"]:checked');
    const selectedSinnerIds = Array.from(selectedSinnerCheckboxes).map(cb => parseInt(cb.value));
    
    // 添加全局控制按钮
    const globalControlDiv = document.createElement('div');
    globalControlDiv.className = 'filter-controls';
    globalControlDiv.style.marginBottom = '20px';
    
    const selectAllBtn = document.createElement('button');
    selectAllBtn.className = 'control-btn';
    selectAllBtn.style.margin = '10px 5px';
    selectAllBtn.style.padding = '8px 15px';
    selectAllBtn.style.fontSize = '0.9rem';
    selectAllBtn.textContent = '全选所有人格';
    selectAllBtn.addEventListener('click', () => toggleAllPersonalities(true));
    
    const deselectAllBtn = document.createElement('button');
    deselectAllBtn.className = 'control-btn';
    deselectAllBtn.style.margin = '10px 5px';
    deselectAllBtn.style.padding = '8px 15px';
    deselectAllBtn.style.fontSize = '0.9rem';
    deselectAllBtn.textContent = '全不选所有人格';
    deselectAllBtn.addEventListener('click', () => toggleAllPersonalities(false));
    
    const invertSelectionBtn = document.createElement('button');
    invertSelectionBtn.className = 'control-btn';
    invertSelectionBtn.style.margin = '10px 5px';
    invertSelectionBtn.style.padding = '8px 15px';
    invertSelectionBtn.style.fontSize = '0.9rem';
    invertSelectionBtn.textContent = '反选所有人格';
    invertSelectionBtn.addEventListener('click', invertAllPersonalities);
    
    globalControlDiv.appendChild(selectAllBtn);
    globalControlDiv.appendChild(deselectAllBtn);
    globalControlDiv.appendChild(invertSelectionBtn);
    container.appendChild(globalControlDiv);
    
    // 如果有选中的罪人，创建对应的人格设置页面
    if (selectedSinnerIds.length > 0) {
        // 创建分页容器
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination';
        paginationContainer.id = 'personality-pagination';
        
        // 创建人格页面
        let firstPage = true;
        selectedSinnerData = sinnerData.filter(sinner => selectedSinnerIds.includes(sinner.id));
        
        selectedSinnerData.forEach((sinner, sinnerIndex) => {
            // 创建页面容器
            const pageDiv = document.createElement('div');
            pageDiv.className = 'personality-page';
            pageDiv.dataset.sinnerId = sinner.id;
            if (firstPage) {
                pageDiv.classList.add('active');
                firstPage = false;
            }
            
            // 创建页面标题
            const pageTitle = document.createElement('h4');
            pageTitle.className = 'settings-section-title';
            pageTitle.innerHTML = `<i class="fas fa-user"></i> ${sinner.name}`;
            pageDiv.appendChild(pageTitle);
            
            // 创建页面控制按钮
            const pageControlDiv = document.createElement('div');
            pageControlDiv.className = 'filter-controls';
            pageControlDiv.style.marginBottom = '20px';
            
            const pageSelectAllBtn = document.createElement('button');
            pageSelectAllBtn.className = 'control-btn';
            pageSelectAllBtn.style.margin = '10px 5px';
            pageSelectAllBtn.style.padding = '8px 15px';
            pageSelectAllBtn.style.fontSize = '0.9rem';
            pageSelectAllBtn.textContent = '全选';
            pageSelectAllBtn.dataset.sinnerId = sinner.id;
            pageSelectAllBtn.addEventListener('click', (e) => {
                toggleSinnerPersonalities(parseInt(e.target.dataset.sinnerId), true);
            });
            
            const pageDeselectAllBtn = document.createElement('button');
            pageDeselectAllBtn.className = 'control-btn';
            pageDeselectAllBtn.style.margin = '10px 5px';
            pageDeselectAllBtn.style.padding = '8px 15px';
            pageDeselectAllBtn.style.fontSize = '0.9rem';
            pageDeselectAllBtn.textContent = '全不选';
            pageDeselectAllBtn.dataset.sinnerId = sinner.id;
            pageDeselectAllBtn.addEventListener('click', (e) => {
                toggleSinnerPersonalities(parseInt(e.target.dataset.sinnerId), false);
            });
            
            const pageInvertBtn = document.createElement('button');
            pageInvertBtn.className = 'control-btn';
            pageInvertBtn.style.margin = '10px 5px';
            pageInvertBtn.style.padding = '8px 15px';
            pageInvertBtn.style.fontSize = '0.9rem';
            pageInvertBtn.textContent = '反选';
            pageInvertBtn.dataset.sinnerId = sinner.id;
            pageInvertBtn.addEventListener('click', (e) => {
                invertSinnerPersonalities(parseInt(e.target.dataset.sinnerId));
            });
            
            pageControlDiv.appendChild(pageSelectAllBtn);
            pageControlDiv.appendChild(pageDeselectAllBtn);
            pageControlDiv.appendChild(pageInvertBtn);
            pageDiv.appendChild(pageControlDiv);
            
            // 创建人格网格
            const personalityGrid = document.createElement('div');
            personalityGrid.className = 'personality-settings-grid';
            
            sinner.personalities.forEach((persona, index) => {
                const card = document.createElement('div');
                card.className = 'personality-setting-card';
                
                const avatar = document.createElement('img');
                avatar.className = 'personality-avatar';
                avatar.style.width = '60px';
                avatar.style.height = '60px';
                if (persona.avatar) {
                    avatar.src = persona.avatar;
                    avatar.alt = persona.name;
                    avatar.onerror = function() {
                        this.textContent = '?';
                        this.style.display = 'flex';
                        this.style.alignItems = 'center';
                        this.style.justifyContent = 'center';
                    };
                } else {
                    avatar.textContent = '?';
                    avatar.style.display = 'flex';
                    avatar.style.alignItems = 'center';
                    avatar.style.justifyContent = 'center';
                }
                
                const name = document.createElement('div');
                name.className = 'personality-name';
                name.textContent = persona.name;
                
                const toggle = document.createElement('label');
                toggle.className = 'personality-toggle';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                // 检查是否已经设置过筛选状态，如果有则使用，否则默认为true
                checkbox.checked = filteredPersonalityData[sinner.id] ? 
                                  (filteredPersonalityData[sinner.id][index] !== false) : 
                                  true;
                checkbox.dataset.sinnerId = sinner.id;
                checkbox.dataset.personaIndex = index;
                checkbox.addEventListener('change', updatePersonalityFilter);
                
                const toggleText = document.createElement('span');
                toggleText.textContent = '启用';
                
                toggle.appendChild(checkbox);
                toggle.appendChild(toggleText);
                
                card.appendChild(avatar);
                card.appendChild(name);
                card.appendChild(toggle);
                
                personalityGrid.appendChild(card);
            });
            
            pageDiv.appendChild(personalityGrid);
            container.appendChild(pageDiv);
            
            // 创建分页按钮
            const pageBtn = document.createElement('button');
            pageBtn.className = 'page-btn';
            pageBtn.textContent = sinnerIndex + 1;
            pageBtn.dataset.sinnerId = sinner.id;
            if (firstPage === false && sinnerIndex === 0) {
                pageBtn.classList.add('active');
            }
            pageBtn.addEventListener('click', (e) => {
                // 切换页面
                document.querySelectorAll('.personality-page').forEach(page => {
                    page.classList.remove('active');
                });
                document.querySelectorAll('.page-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                const targetSinnerId = e.target.dataset.sinnerId;
                document.querySelector(`.personality-page[data-sinner-id="${targetSinnerId}"]`).classList.add('active');
                e.target.classList.add('active');
            });
            
            paginationContainer.appendChild(pageBtn);
        });
        
        container.appendChild(paginationContainer);
    } else {
        // 如果没有选中的罪人，显示提示信息
        const noSinnerMsg = document.createElement('p');
        noSinnerMsg.textContent = '请先在罪人筛选设置中选择至少一个罪人';
        noSinnerMsg.style.textAlign = 'center';
        noSinnerMsg.style.color = '#aaa';
        noSinnerMsg.style.marginTop = '20px';
        container.appendChild(noSinnerMsg);
    }
}

// 更新人格筛选
function updatePersonalityFilter(event) {
    const checkbox = event.target;
    const sinnerId = parseInt(checkbox.dataset.sinnerId);
    const personaIndex = parseInt(checkbox.dataset.personaIndex);
    
    // 初始化该罪人的筛选数据
    if (!filteredPersonalityData[sinnerId]) {
        filteredPersonalityData[sinnerId] = {};
    }
    
    // 更新该人格的筛选状态
    filteredPersonalityData[sinnerId][personaIndex] = checkbox.checked;
    
    hasUnsavedChanges = true;
}

// 辅助函数：创建头像占位符
function createAvatarPlaceholder(sinner) {
    const placeholder = document.createElement('span');
    placeholder.className = 'filter-avatar-placeholder';
    placeholder.style.width = '20px';
    placeholder.style.height = '20px';
    placeholder.style.backgroundColor = sinner.color;
    placeholder.textContent = '?';
    return placeholder;
}

// 更新筛选后的罪人数据
function updateFilteredSinnerData() {
    const checkboxes = document.querySelectorAll('#sinner-filter input[type="checkbox"]');
    const selectedIds = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => parseInt(cb.value));
    
    filteredSinnerData = sinnerData.filter(sinner => selectedIds.includes(sinner.id));
    
    // 如果没有选中任何罪人或只有一个罪人，禁用开始按钮
    sinnerStartBtn.disabled = selectedIds.length === 0 || filteredSinnerData.length === 1;
    
    hasUnsavedChanges = true;
    
    // 如果当前在设置页面，更新人格设置显示
    if (settingsPage.style.display !== 'none') {
        createPersonalitySettings();
    }
}

// 全选/全不选
function toggleAllCheckboxes(selectAll) {
    const checkboxes = document.querySelectorAll('#sinner-filter input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = selectAll);
    updateFilteredSinnerData();
    
    // 更新人格设置显示
    if (document.getElementById('settings-page').style.display !== 'none') {
        createPersonalitySettings();
    }
}

// 反选
function invertSelection() {
    const checkboxes = document.querySelectorAll('#sinner-filter input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = !cb.checked);
    updateFilteredSinnerData();
    
    // 更新人格设置显示
    if (document.getElementById('settings-page').style.display !== 'none') {
        createPersonalitySettings();
    }
}

// 验证筛选设置是否满足保底条件
function validateFilterSettings() {
    // 检查是否至少选择了一个罪人
    if (filteredSinnerData.length === 0) {
        alert('请至少选择一个罪人！');
        return false;
    }
    
    // 检查每个罪人是否至少选择了一个人格
    const sinnersWithoutPersonalities = [];
    for (const sinner of filteredSinnerData) {
        let hasPersonality = false;
        if (filteredPersonalityData[sinner.id]) {
            // 检查该罪人的人格对象中是否有值为true的人格
            hasPersonality = Object.values(filteredPersonalityData[sinner.id]).some(value => value === true);
        } else {
            // 如果没有为该罪人设置人格筛选（初始状态），则默认认为所有人格都被选择
            hasPersonality = true;
        }
        
        if (!hasPersonality) {
            sinnersWithoutPersonalities.push(sinner.name);
        }
    }
    
    if (sinnersWithoutPersonalities.length > 0) {
        alert(`请为以下罪人至少选择一个人格：\n${sinnersWithoutPersonalities.join('\n')}`);
        return false;
    }
    
    return true;
}

// 应用筛选设置
function applyFilters() {
    if (!validateFilterSettings()) {
        return;
    }
    
    // 保存当前筛选状态为原始状态
    originalFilteredSinnerData = [...filteredSinnerData];
    originalFilteredPersonalityData = JSON.parse(JSON.stringify(filteredPersonalityData));
    
    hasUnsavedChanges = false;
    
    // 切换到主页面
    mainSelectorPage.style.display = 'block';
    settingsPage.style.display = 'none';
    mainPageBtn.classList.add('active');
    settingsPageBtn.classList.remove('active');
    
    // 更新主页面的滚动列表
    refreshScrollsOnReturn();
}

// 检查是否有未保存的更改
function checkUnsavedChanges() {
    if (hasUnsavedChanges) {
        return confirm('您有未保存的更改，确定要离开吗？');
    }
    return true;
}

// 当从设置页面返回主页面时，刷新滚动列表
function refreshScrollsOnReturn() {
    // 更新罪人列表
    const sinnerNames = filteredSinnerData.map(s => s.name);
    createSinnerScrollList(sinnerNames);
    
    // 如果当前有选中的罪人，检查其是否仍在筛选列表中
    if (currentSelectedSinner) {
        const sinnerStillInList = filteredSinnerData.some(s => s.id === currentSelectedSinner.id);
        if (!sinnerStillInList) {
            // 如果不在，重置选中状态
            currentSelectedSinner = null;
            currentSelectedPersona = null;
            selectedSinnerEl.textContent = '未选择';
            selectedPersonaEl.textContent = '未选择';
        }
    }
    
    // 更新罪人开始按钮的状态
    sinnerStartBtn.disabled = filteredSinnerData.length <= 1;
    
    // 处理特殊情况：当罪人数量为1时
    if (filteredSinnerData.length === 1) {
        // 如果当前没有选中罪人，或者选中的罪人不在筛选列表中
        if (!currentSelectedSinner || filteredSinnerData[0].id !== currentSelectedSinner.id) {
            // 自动选中唯一的罪人
            currentSelectedSinner = filteredSinnerData[0];
            selectedSinnerEl.textContent = currentSelectedSinner.name;
            
            // 重置二级转盘状态
            resetPersonaScrollState();
            
            // 自动选择该罪人的人格
            // 获取该罪人的筛选后人格列表
            const filteredPersonalities = currentSelectedSinner.personalities.filter((persona, index) => {
                // 如果没有设置该人格的筛选状态，默认为true
                const isSelected = filteredPersonalityData[currentSelectedSinner.id] ? 
                                  (filteredPersonalityData[currentSelectedSinner.id][index] !== false) : 
                                  true;
                return isSelected;
            });
            
            // 创建人格列表
            createPersonaScrollList(filteredPersonalities);
            
            // 如果人格列表只有一个人格，自动选中
            if (filteredPersonalities.length === 1) {
                currentSelectedPersona = filteredPersonalities[0];
                selectedPersonaEl.textContent = currentSelectedPersona.name;
            } else {
                selectedPersonaEl.textContent = '未选择';
            }
        }
    }
}

// 初始化函数
function init() {
    // 创建罪人筛选复选框
    createSinnerFilter();
    
    // 默认全选所有罪人
    updateFilteredSinnerData();
    
    // 保存原始筛选状态
    originalFilteredSinnerData = [...filteredSinnerData];
    originalFilteredPersonalityData = JSON.parse(JSON.stringify(filteredPersonalityData));
    
    // 初始化罪人滚动列表
    const sinnerNames = filteredSinnerData.map(s => s.name);
    createSinnerScrollList(sinnerNames);
    
    // 初始化人格滚动列表
    createPersonaScrollList(['请先选择罪人']);
    
    // 设置按钮点击事件
    sinnerStartBtn.addEventListener('click', startSinnerScroll);
    sinnerStopBtn.addEventListener('click', stopSinnerScroll);
    personaStartBtn.addEventListener('click', startPersonaScroll);
    personaStopBtn.addEventListener('click', stopPersonaScroll);
    
    // 页面导航事件
    mainPageBtn.addEventListener('click', () => {
        if (!checkUnsavedChanges()) {
            return;
        }
        
        if (!validateFilterSettings()) {
            return;
        }
        
        mainSelectorPage.style.display = 'block';
        settingsPage.style.display = 'none';
        mainPageBtn.classList.add('active');
        settingsPageBtn.classList.remove('active');
        
        refreshScrollsOnReturn();
    });
    
    settingsPageBtn.addEventListener('click', () => {
        mainSelectorPage.style.display = 'none';
        settingsPage.style.display = 'block';
        settingsPageBtn.classList.add('active');
        mainPageBtn.classList.remove('active');
        
        // 创建人格筛选设置
        createPersonalitySettings();
    });
    
    // 初始化时，应用按钮还不存在，需要在createPersonalitySettings中创建
    
    // 添加罪人点击事件
    /*sinnerScroll.addEventListener('click', (e) => {
        const item = e.target.closest('.scroll-item');
        if (item) {
            const index = parseInt(item.dataset.originalIndex);
            const sinner = filteredSinnerData[index];
            currentSelectedSinner = sinner;
            selectedSinnerEl.textContent = sinner.name;
            
            // 重置人格选择
            currentSelectedPersona = null;
            selectedPersonaEl.textContent = '未选择';
            
            // 更新人格列表
            const filteredPersonalities = sinner.personalities.filter((persona, index) => {
                return filteredPersonalityData[sinner.id] ? 
                       (filteredPersonalityData[sinner.id][index] !== false) : 
                       true;
            });
            createPersonaScrollList(filteredPersonalities);
        }
    });*/
    
    // 添加人格点击事件
    /*personaScroll.addEventListener('click', (e) => {
        const item = e.target.closest('.scroll-item');
        if (item) {
            const index = parseInt(item.dataset.originalIndex);
            const persona = personaItems[index];
            if (typeof persona === 'object' && persona.name) {
                currentSelectedPersona = persona;
                selectedPersonaEl.textContent = persona.name;
            }
        }
    });*/
    
    // 添加筛选控制按钮事件
    const selectAllBtn = document.getElementById('select-all-btn');
    const deselectAllBtn = document.getElementById('deselect-all-btn');
    const invertBtn = document.getElementById('invert-btn');
    
    if (selectAllBtn) selectAllBtn.addEventListener('click', () => toggleAllCheckboxes(true));
    if (deselectAllBtn) deselectAllBtn.addEventListener('click', () => toggleAllCheckboxes(false));
    if (invertBtn) invertBtn.addEventListener('click', invertSelection);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // 为设置页面添加应用按钮
    const applyButton = document.createElement('button');
    applyButton.id = 'apply-filters-btn';
    applyButton.className = 'control-btn';
    applyButton.textContent = '应用筛选';
    applyButton.style.margin = '10px 5px';
    applyButton.style.padding = '8px 15px';
    applyButton.style.fontSize = '0.9rem';
    applyButton.addEventListener('click', applyFilters);
    
    // 添加应用按钮到设置页面
    const controlsSection = document.querySelector('.settings-controls');
    if (controlsSection) {
        controlsSection.appendChild(applyButton);
    }
});