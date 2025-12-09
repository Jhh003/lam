// UI模块 - 界面元素创建和管理

// UI模块
const UI = {
    // 初始化页面导航
    initPageNavigation(mainPageBtn, settingsPageBtn, mainSelectorPage, settingsPage) {
        // 主页面按钮的点击事件已在main.js中处理，此处不再重复添加
        
        // 设置页面按钮点击事件
        settingsPageBtn.addEventListener('click', () => {
            import('./settings.js').then(({ createPersonalitySettings }) => {
                mainSelectorPage.style.display = 'none';
                settingsPage.style.display = 'block';
                settingsPageBtn.classList.add('active');
                mainPageBtn.classList.remove('active');
                
                // 创建人格筛选设置
                createPersonalitySettings();
            });
        });
    },
    
    // 设置按钮点击事件
    setupButtonEvents(sinnerStartBtn, sinnerStopBtn, personaStartBtn, personaStopBtn, selectAllBtn, deselectAllBtn, invertBtn) {
        import('./scrolls.js').then(({ startSinnerScroll, stopSinnerScroll, startPersonaScroll, stopPersonaScroll }) => {
            // 滚动控制按钮
            sinnerStartBtn.addEventListener('click', startSinnerScroll);
            sinnerStopBtn.addEventListener('click', stopSinnerScroll);
            personaStartBtn.addEventListener('click', startPersonaScroll);
            personaStopBtn.addEventListener('click', stopPersonaScroll);
        });
        
        // 筛选控制按钮
        import('./filters.js').then(({ default: Filters }) => {
            if (selectAllBtn) selectAllBtn.addEventListener('click', () => Filters.toggleAllCheckboxes(true));
            if (deselectAllBtn) deselectAllBtn.addEventListener('click', () => Filters.toggleAllCheckboxes(false));
            if (invertBtn) invertBtn.addEventListener('click', () => Filters.invertSelection());
        });
    },
    
    // 添加应用筛选按钮
    addApplyFilterButton() {
        import('./filters.js').then(({ default: Filters }) => {
            // 为设置页面添加应用按钮
            const applyButton = document.createElement('button');
            applyButton.id = 'apply-filters-btn';
            applyButton.className = 'control-btn primary-btn';
            applyButton.textContent = '应用筛选';
            applyButton.addEventListener('click', () => Filters.applyFilters());
            
            // 添加应用按钮到设置页面
            const controlsSection = document.querySelector('.settings-controls');
            if (controlsSection) {
                controlsSection.appendChild(applyButton);
            }
        });
    },
    
    // 初始化UI
    init() {
        // 为设置页面添加应用按钮
        this.addApplyFilterButton();
    }
};

export default UI;