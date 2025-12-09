// 人格设置模块

// 更新人格筛选
function updatePersonalityFilter(event) {
    const checkbox = event.target;
    const sinnerId = parseInt(checkbox.dataset.sinnerId);
    const personaIndex = parseInt(checkbox.dataset.personaIndex);
    
    // 初始化该罪人的筛选数据
    if (!window.filteredPersonalityData[sinnerId]) {
        window.filteredPersonalityData[sinnerId] = {};
    }
    
    // 更新该人格的筛选状态
    window.filteredPersonalityData[sinnerId][personaIndex] = checkbox.checked;
    
    window.hasUnsavedChanges = true;
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

// 创建人格设置界面
function createPersonalitySettings() {
    const container = document.getElementById('personality-settings-container');
    container.innerHTML = '';
    
    // 创建全局筛选控制区
    const globalControlDiv = document.createElement('div');
    globalControlDiv.className = 'filter-controls';
    
    const selectAllBtn = document.createElement('button');
    selectAllBtn.className = 'control-btn';
    selectAllBtn.textContent = '全选所有人格';
    selectAllBtn.addEventListener('click', () => toggleAllPersonalities(true));
    
    const deselectAllBtn = document.createElement('button');
    deselectAllBtn.className = 'control-btn';
    deselectAllBtn.textContent = '取消所有人格';
    deselectAllBtn.addEventListener('click', () => toggleAllPersonalities(false));
    
    const invertSelectionBtn = document.createElement('button');
    invertSelectionBtn.className = 'control-btn';
    invertSelectionBtn.textContent = '反选所有人格';
    invertSelectionBtn.addEventListener('click', invertAllPersonalities);
    
    globalControlDiv.appendChild(selectAllBtn);
    globalControlDiv.appendChild(deselectAllBtn);
    globalControlDiv.appendChild(invertSelectionBtn);
    container.appendChild(globalControlDiv);
    
    // 获取当前选中的罪人ID
    const selectedIds = [];
    const checkboxes = document.querySelectorAll('#sinner-filter input[type="checkbox"]');
    checkboxes.forEach(cb => {
        if (cb.checked) {
            selectedIds.push(parseInt(cb.value));
        }
    });
    
    // 如果有选中的罪人，创建对应的人格设置页面
    if (selectedIds.length > 0) {
        // 导入罪人数据
        import('../data/characters.js').then(({ sinnerData }) => {
            const selectedSinnerData = sinnerData.filter(sinner => selectedIds.includes(sinner.id));
            
            // 创建分页容器
            const paginationContainer = document.createElement('div');
            paginationContainer.className = 'pagination';
            paginationContainer.id = 'personality-pagination';
            
            // 创建人格页面
            let firstPage = true;
            
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
                pageControlDiv.className = 'filter-controls personality-page-controls';
                
                const pageSelectAllBtn = document.createElement('button');
                pageSelectAllBtn.className = 'control-btn';
                pageSelectAllBtn.textContent = '全选';
                pageSelectAllBtn.dataset.sinnerId = sinner.id;
                pageSelectAllBtn.addEventListener('click', (e) => {
                    toggleSinnerPersonalities(parseInt(e.target.dataset.sinnerId), true);
                });
                
                const pageDeselectAllBtn = document.createElement('button');
                pageDeselectAllBtn.className = 'control-btn';
                pageDeselectAllBtn.textContent = '全不选';
                pageDeselectAllBtn.dataset.sinnerId = sinner.id;
                pageDeselectAllBtn.addEventListener('click', (e) => {
                    toggleSinnerPersonalities(parseInt(e.target.dataset.sinnerId), false);
                });
                
                const pageInvertBtn = document.createElement('button');
                pageInvertBtn.className = 'control-btn';
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
                    if (persona.avatar) {
                        avatar.src = persona.avatar;
                        avatar.alt = persona.name;
                        avatar.onerror = function() {
                            this.textContent = '?';
                            this.classList.add('avatar-placeholder');
                        };
                    } else {
                        avatar.textContent = '?';
                        avatar.classList.add('avatar-placeholder');
                    }
                    
                    const name = document.createElement('div');
                    name.className = 'personality-name';
                    name.textContent = persona.name;
                    
                    const toggle = document.createElement('label');
                    toggle.className = 'personality-toggle';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    // 检查是否已经设置过筛选状态，如果有则使用，否则默认为true
                    checkbox.checked = window.filteredPersonalityData[sinner.id] ? 
                                      (window.filteredPersonalityData[sinner.id][index] !== false) : 
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
                    pageBtn.title = sinner.name;
                    pageBtn.dataset.sinnerId = sinner.id;
                    if (sinnerIndex === 0) {
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
                        const targetPage = document.querySelector(`.personality-page[data-sinner-id="${targetSinnerId}"]`);
                        targetPage.classList.add('active');
                        e.target.classList.add('active');
                        
                        // 移除自动滚动到顶部功能
                    });
                
                paginationContainer.appendChild(pageBtn);
            });
            
            container.appendChild(paginationContainer);
        });
    } else {
        // 如果没有选中的罪人，显示提示信息
        const noSinnerMsg = document.createElement('p');
        noSinnerMsg.className = 'no-sinner-message';
        noSinnerMsg.textContent = '请先在罪人筛选设置中选择至少一个罪人';
        container.appendChild(noSinnerMsg);
    }
}

export { 
    updatePersonalityFilter, 
    toggleAllPersonalities, 
    invertAllPersonalities, 
    toggleSinnerPersonalities, 
    invertSinnerPersonalities, 
    createPersonalitySettings 
};