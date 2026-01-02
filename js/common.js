// 倒计时功能实现
(function () {
    // 导入弹窗模块
    let modalLoadPromise = import('./modal.js').then(({ default: Modal }) => {
        window.Modal = Modal; // 全局可用
        console.log('Modal 模块已加载');
        return Modal;
    }).catch(error => {
        console.error('Modal 模块加载失败:', error);
        return null;
    });
    
    // 确保 Modal 模块已加载的辅助函数
    async function ensureModal() {
        if (!window.Modal) {
            console.log('等待 Modal 模块加载...');
            await modalLoadPromise;
        }
        if (!window.Modal) {
            console.error('Modal 模块加载失败！');
            return null;
        }
        return window.Modal;
    }
    
    // URL 验证辅助函数
    function isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }
    // 获取当前时间的函数，优先使用API获取服务器时间，失败则回退到本地时间
    function getCurrentTime() {
        // 尝试从API获取服务器时间
        return fetch('https://cn.apihz.cn/api/time/getapi.php?id=10010737&key=949afa1fb7d14d5ea210b69a761595a5&type=20')
            .then(response => {
                if (!response.ok) {
                    throw new Error('API响应失败');
                }
                return response.json();
            })
            .then(data => {
                // 解析API响应，获取时间戳（秒）并转换为毫秒
                const timestamp = parseInt(data.sjc) * 1000;
                return new Date(timestamp);
            })
            .catch(error => {
                console.warn('获取服务器时间失败，使用本地时间', error);
                // 回退到本地时间
                return new Date();
            });
    }

    // 创建带有闪烁动画效果的文本
    function createAnimatedText(text) {
        // 处理换行符，将文本分成多行
        const lines = text.split('<br>');
        let result = '';
        
        lines.forEach((line, lineIndex) => {
            if (lineIndex > 0) {
                result += '<br>';
            }
            
            // 为整行添加season-text类
            result += '<div class="season-text">';
            
            // 为每个字符添加glowIn类的span
            for (let i = 0; i < line.length; i++) {
                if (line[i] === ' ') {
                    // 空格保持原样
                    result += ' ';
                } else {
                    // 其他字符用span包裹并应用动画
                    result += `<span class="glowIn"><span>${line[i]}</span></span>`;
                }
            }
            
            result += '</div>';
        });
        
        return result;
    }
    
    // 直接显示赛季到来文字
    const countdownElement = document.getElementById('countdown');
    if (countdownElement) {
        const countdownText = `第七赛季-蛛丝赤已经到来！`;
        const animatedText = createAnimatedText(countdownText);
        countdownElement.innerHTML = animatedText;
    }
    
    // 计时器功能实现
    function initTimer() {
        // DOM元素引用
        const timerModal = document.getElementById('timer-modal');
        const timerToggleBtn = document.getElementById('timer-toggle-btn');
        const timerCloseBtn = document.getElementById('timer-close-btn');
        const timerDisplay = document.getElementById('timer-display');
        const startBtn = document.getElementById('timer-start-btn');
        const pauseBtn = document.getElementById('timer-pause-btn');
        const resetBtn = document.getElementById('timer-reset-btn');
        
        // 排行榜按钮
        const rankingPageBtn = document.getElementById('ranking-page-btn');
        const uploadGlobalBtn = document.getElementById('upload-global-btn');
        console.log('ranking-page-btn:', rankingPageBtn);
        console.log('upload-global-btn:', uploadGlobalBtn);
        
        // 上传模态窗口元素
        const uploadModal = document.getElementById('upload-modal');
        const uploadModalCloseBtn = document.getElementById('upload-modal-close-btn');
        const cancelUploadBtn = document.getElementById('cancel-upload-btn');
        const uploadGlobalForm = document.getElementById('upload-global-form');
        const uploadTypeRadios = document.querySelectorAll('input[name="uploadType"]');
        const fullUploadFields = document.getElementById('full-upload-fields');
        const floorOnlyUploadFields = document.getElementById('floor-only-upload-fields');
        const fullTimeDisplay = document.getElementById('full-time-display');
        console.log('upload-modal:', uploadModal);
        console.log('upload-global-form:', uploadGlobalForm);
        console.log('full-upload-fields:', fullUploadFields);
        console.log('floor-only-upload-fields:', floorOnlyUploadFields);
        
        // 排行榜功能元素
const rankingForm = document.getElementById('ranking-form');
const playerNoteInput = document.getElementById('player-note');
const uploadRankingBtn = document.getElementById('upload-ranking-btn');
const viewRankingBtn = document.getElementById('view-ranking-btn');
        
        // 确保所有元素都存在
        if (!timerModal || !timerToggleBtn || !timerCloseBtn || !timerDisplay || !startBtn || !pauseBtn || !resetBtn) {
            console.warn('计时器元素未找到');
            return;
        }
        
        // 计时器变量
        let timerInterval = null;
        let seconds = 0;
        let isRunning = false;
        
        // 从配置文件获取排行榜API地址
        // 排行榜API配置
        const rankingApiUrl = window.appConfig?.ranking?.apiUrl || 'https://your-aliyun-fc-endpoint.rg-cn-beijing.fc.aliyuncs.com/2016-08-15/proxy/limbus-ranking/';
        // 使用新的API路径/ranking（兼容旧路径/upload和/query）
        const rankingUploadPath = '/ranking'; // 新路径
        const rankingQueryPath = '/ranking'; // 新路径
        
        // 保存到本地排行榜
        function saveToLocalRanking() {
            if (seconds === 0) {
                // 使用自定义弹窗
                setTimeout(() => window.Modal?.alert('请先完成一次游戏计时再保存！', '提示'), 100);
                return;
            }
            
            // 安全获取玩家备注（检查元素是否存在）
            const playerNote = playerNoteInput ? playerNoteInput.value.trim() : '';
            
            try {
                uploadRankingBtn.disabled = true;
                uploadRankingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';
                
                // 从localStorage获取现有记录
                const records = JSON.parse(localStorage.getItem('personalRanking') || '[]');
                
                // 获取当前选中的角色信息
                const selectedSinner = window.currentSelectedSinner;
                const selectedPersona = window.currentSelectedPersona;
                
                // 创建新记录
                const newRecord = {
                    time: seconds,
                    comment: playerNote,
                    timestamp: new Date().toISOString(),
                    sinner: selectedSinner ? {
                        name: selectedSinner.name,
                        avatar: selectedPersona ? selectedPersona.avatar : selectedSinner.avatar  // 使用人格头像
                    } : null,
                    persona: selectedPersona ? {
                        name: selectedPersona.name,
                        avatar: selectedPersona.avatar
                    } : null
                };
                
                // 添加新记录
                records.push(newRecord);
                
                // 保存回localStorage
                localStorage.setItem('personalRanking', JSON.stringify(records));
                
                // 使用自定义弹窗
                setTimeout(() => window.Modal?.alert('保存成功！记录已添加到本地排行榜', '成功'), 100);
                
                // 重置备注输入框（安全检查元素是否存在）
                if (playerNoteInput) {
                    playerNoteInput.value = '';
                }
            } catch (error) {
                console.error('保存失败:', error);
                // 使用自定义弹窗
                setTimeout(() => window.Modal?.alert(`保存失败: ${error.message}\n\n详细信息请查看浏览器控制台`, '错误'), 100);
            } finally {
                uploadRankingBtn.disabled = false;
                uploadRankingBtn.innerHTML = '<i class="fas fa-save"></i> 保存到排行榜';
            }
        }
        
        // 查看排行榜
        function viewRanking() {
            // 在新窗口中打开排行榜页面
            window.open('ranking.html', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        }
        
        // 上传到全球排行榜 - 打开上传模态窗口
        async function uploadToGlobalRanking() {
            console.log('上传全球排行榜按钮被点击');
            
            // 1. 验证罪人和人格是否选择
            const selectedSinner = window.currentSelectedSinner;
            const selectedPersona = window.currentSelectedPersona;
            
            console.log('选中的罪人:', selectedSinner);
            console.log('选中的人格:', selectedPersona);
            
            if (!selectedSinner || !selectedPersona) {
                console.log('未选择罪人或人格');
                
                // 确保 Modal 模块已加载
                const Modal = await ensureModal();
                if (Modal) {
                    await Modal.alert(
                        '检测到您当前未选择罪人或人格。\n\n' +
                        '您需要先在主界面完成罪人和人格的随机抽取，' +
                        '然后再进行上传。',
                        '需要先抽取'
                    );
                } else {
                    alert('请先完成罪人和人格的随机抽取！');
                }
                return;
            }
            
            // 2. 显示上传模态窗口
            console.log('调用 showUploadModal');
            showUploadModal();
        }
        
        // 显示上传模态窗口
        async function showUploadModal() {
            // 安全检查所有必需元素
            if (!uploadModal || !uploadGlobalForm || !fullUploadFields || !floorOnlyUploadFields) {
                console.error('上传模态窗口元素未找到');
                
                // 确保 Modal 模块已加载
                const Modal = await ensureModal();
                if (Modal) {
                    await Modal.alert('上传功能初始化失败，请刷新页面重试。', '错误');
                } else {
                    alert('上传功能初始化失败，请刷新页面重试。');
                }
                return;
            }
            
            // 填充时间显示
            if (fullTimeDisplay) {
                fullTimeDisplay.value = formatTime(seconds);
            }
            
            // 重置表单
            if (uploadGlobalForm) {
                uploadGlobalForm.reset();
            }
            
            // 默认选中完整记录上传
            const fullRadio = document.querySelector('input[name="uploadType"][value="full"]');
            if (fullRadio) {
                fullRadio.checked = true;
            }
            fullUploadFields.style.display = 'block';
            floorOnlyUploadFields.style.display = 'none';
            
            // 显示模态窗口
            uploadModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            console.log('上传模态窗口已打开');
        }
        
        // 隐藏上传模态窗口
        function hideUploadModal() {
            uploadModal.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // 处理上传类型切换
        function handleUploadTypeChange() {
            const selectedType = document.querySelector('input[name="uploadType"]:checked')?.value;
            
            if (selectedType === 'full') {
                fullUploadFields.style.display = 'block';
                floorOnlyUploadFields.style.display = 'none';
            } else if (selectedType === 'floor-only') {
                fullUploadFields.style.display = 'none';
                floorOnlyUploadFields.style.display = 'block';
            }
        }
        
        // 处理表单提交
        async function handleUploadSubmit(e) {
            console.log('表单提交事件触发');
            e.preventDefault();
            e.stopPropagation();
            
            const selectedSinner = window.currentSelectedSinner;
            const selectedPersona = window.currentSelectedPersona;
            const uploadType = document.querySelector('input[name="uploadType"]:checked')?.value;
            
            console.log('上传类型:', uploadType);
            
            if (uploadType === 'full') {
                await submitFullRecord(selectedSinner, selectedPersona);
            } else if (uploadType === 'floor-only') {
                await submitFloorOnlyRecord(selectedSinner, selectedPersona);
            }
            
            console.log('handleUploadSubmit 执行完成');
            return false;
        }
        
        // 提交完整记录
        async function submitFullRecord(selectedSinner, selectedPersona) {
            console.log('开始提交完整记录');
            
            // 确保 Modal 模块已加载
            const Modal = await ensureModal();
            if (!Modal) {
                alert('弹窗模块加载失败，请刷新页面重试！');
                return;
            }
            
            // 验证时间
            if (seconds < 7200) {
                console.log('时间验证失败:', seconds);
                await Modal.alert(
                    '很抱歉，完整记录上传需要通关时间≥ 2小时（7200秒）。\n\n' +
                    '您当前的时间为：' + formatTime(seconds),
                    '提示'
                );
                return;
            }
            
            // 验证层数选择
            const floorLevel = document.querySelector('input[name="fullFloorLevel"]:checked')?.value;
            console.log('选择的层数:', floorLevel);
            if (!floorLevel) {
                console.log('层数验证失败');
                await Modal.alert('请选择单通层数！', '提示');
                return;
            }
            
            // 获取表单数据
            const usedEgo = document.getElementById('full-used-ego')?.checked || false;
            const screenshot = document.getElementById('full-screenshot')?.value.trim() || '';
            const comment = document.getElementById('full-comment')?.value.trim() || '';
            const runDate = new Date().toISOString().split('T')[0];
            
            // 验证图片链接（可选但推荐）
            if (screenshot && !isValidUrl(screenshot)) {
                await Modal.alert('请输入有效的图片链接！', '提示');
                return;
            }
            
            // 生成确认信息
            const info = `您即将上传以下完整记录到全球排行榜：\n\n` +
                `罪人：${selectedSinner.name}\n` +
                `人格：${selectedPersona.name}\n` +
                `时间：${formatTime(seconds)}\n` +
                `层数：第${floorLevel}层\n` +
                `E.G.O：${usedEgo ? '是' : '否'}\n` +
                `通关图片：${screenshot || '未提供'}\n` +
                `备注：${comment || '无'}\n\n` +
                `点击确定后将跳转到 GitHub 页面提交记录。\n` +
                `（您需要有 GitHub 账号）`;
            
            console.log('准备显示确认弹窗');
            const confirmed = await Modal.confirm(info, '上传确认');
            console.log('确认弹窗返回值:', confirmed);
            
            if (confirmed) {
                // 生成 GitHub Issue URL
                const repoOwner = 'Jhh003';
                const repoName = 'lam';
                
                const issueUrl = `https://github.com/${repoOwner}/${repoName}/issues/new?` +
                    `labels=通关记录&` +
                    `template=submit-clear-run.yml&` +
                    `title=[通关记录] ${selectedSinner.name} - ${selectedPersona.name} - ${formatTime(seconds)}`;
                
                // 打开 GitHub
                window.open(issueUrl, '_blank');
                
                // 关闭模态窗口
                hideUploadModal();
                
                // 同时保存到本地
                saveToLocalRanking();
                
                await Modal.alert(
                    '已在新窗口打开 GitHub 提交页面。\n\n' +
                    '请在那里填写表单（包括通关图片链接）并提交 Issue。\n\n' +
                    '管理员审核通过后，您的记录将出现在全球排行榜中。',
                    '提示'
                );
            }
        }
        
        // 提交简化记录（仅层数）
        async function submitFloorOnlyRecord(selectedSinner, selectedPersona) {
            console.log('开始提交简化记录');
            
            // 确保 Modal 模块已加载
            const Modal = await ensureModal();
            if (!Modal) {
                alert('弹窗模块加载失败，请刷新页面重试！');
                return;
            }
            
            // 验证层数选择
            const floorLevel = document.querySelector('input[name="floorOnlyFloorLevel"]:checked')?.value;
            console.log('选择的层数:', floorLevel);
            if (!floorLevel) {
                console.log('层数验证失败');
                await Modal.alert('请选择单通层数！', '提示');
                return;
            }
            
            // 获取表单数据
            const screenshot = document.getElementById('floor-only-screenshot')?.value.trim() || '';
            const comment = document.getElementById('floor-only-comment')?.value.trim() || '';
            const runDate = new Date().toISOString().split('T')[0];
            
            // 验证图片链接（可选但推荐）
            if (screenshot && !isValidUrl(screenshot)) {
                await Modal.alert('请输入有效的图片链接！', '提示');
                return;
            }
            
            // 生成确认信息
            const info = `您即将上传以下简化记录到全球排行榜：\n\n` +
                `罪人：${selectedSinner.name}\n` +
                `人格：${selectedPersona.name}\n` +
                `层数：第${floorLevel}层\n` +
                `通关图片：${screenshot || '未提供'}\n` +
                `备注：${comment || '无'}\n\n` +
                `注：此记录不包含通关时间，仅显示在层数排行榜中。\n\n` +
                `点击确定后将跳转到 GitHub 页面提交记录。\n` +
                `（您需要有 GitHub 账号）`;
            
            console.log('准备显示确认弹窗');
            const confirmed = await Modal.confirm(info, '上传确认');
            console.log('确认弹窗返回值:', confirmed);
            
            if (confirmed) {
                // 生成 GitHub Issue URL
                const repoOwner = 'Jhh003';
                const repoName = 'lam';
                
                const issueUrl = `https://github.com/${repoOwner}/${repoName}/issues/new?` +
                    `labels=层数记录&` +
                    `template=submit-floor-only.yml&` +
                    `title=[层数记录] ${selectedSinner.name} - ${selectedPersona.name} - 第${floorLevel}层`;
                
                // 打开 GitHub
                window.open(issueUrl, '_blank');
                
                // 关闭模态窗口
                hideUploadModal();
                
                await Modal.alert(
                    '已在新窗口打开 GitHub 提交页面。\n\n' +
                    '请在那里填写表单（包括通关图片链接）并提交 Issue。\n\n' +
                    '管理员审核通过后，您的记录将出现在层数排行榜中。',
                    '提示'
                );
            }
        }
        
        // 格式化时间（秒 -> HH:MM:SS）
        function formatTime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;
            
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        
        // 更新计时器显示
        function updateTimerDisplay() {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;
            
            // 格式化时间，确保两位数
            const formattedHours = hours.toString().padStart(2, '0');
            const formattedMinutes = minutes.toString().padStart(2, '0');
            const formattedSeconds = remainingSeconds.toString().padStart(2, '0');
            
            timerDisplay.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
        }
        
        // 开始计时
        function startTimer() {
            if (isRunning) return;
            
            isRunning = true;
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            
            timerInterval = setInterval(() => {
                seconds++;
                updateTimerDisplay();
            }, 1000);
        }
        
        // 暂停计时
        function pauseTimer() {
            if (!isRunning) return;
            
            isRunning = false;
            clearInterval(timerInterval);
            timerInterval = null;
            
            startBtn.disabled = false;
            pauseBtn.disabled = true;
        }
        
        // 重置计时
        function resetTimer() {
            pauseTimer();
            seconds = 0;
            updateTimerDisplay();
        }
        
        // 显示排行榜使用说明弹窗
        async function showRankingGuide() {
            const Modal = await ensureModal();
            if (!Modal) {
                console.error('Modal 模块未加载');
                return;
            }
            
            const guideMessage = 
                '📊 排行榜功能使用说明\n\n' +
                '1️⃣ 个人排行榜\n' +
                '   • 点击"保存到排行榜"可将本次通关记录保存到您的个人排行榜\n' +
                '   • 点击"查看排行榜"可查看您的历史最佳记录\n' +
                '   • 个人排行榜数据存储在浏览器本地，仅您可见\n\n' +
                '2️⃣ 全球排行榜\n' +
                '   • 点击"上传全球榜"可将记录提交到全球排行榜\n' +
                '   • 完整记录上传：需通关时间≥2小时（7200秒）\n' +
                '   • 简化记录上传：仅提交成功单通层数（第5/10/15层）\n' +
                '   • 上传需跳转到 GitHub 提交 Issue，管理员审核后展示\n\n' +
                '💡 提示：建议先保存到个人排行榜，再根据需要上传到全球榜！';
            
            await Modal.alert(guideMessage, '排行榜使用说明');
        }
        
        // 显示计时器弹窗
        async function showTimerModal() {
            // 先显示排行榜使用说明
            await showRankingGuide();
            
            // 然后显示计时器弹窗
            timerModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // 防止背景滚动
        }
        
        // 隐藏计时器弹窗
        function hideTimerModal() {
            timerModal.classList.remove('active');
            document.body.style.overflow = ''; // 恢复背景滚动
        }
        
        // 点击弹窗外部关闭
        function handleModalClick(e) {
            if (e.target === timerModal) {
                hideTimerModal();
            }
        }
        
        // 添加事件监听器
        timerToggleBtn.addEventListener('click', showTimerModal);
        timerCloseBtn.addEventListener('click', hideTimerModal);
        timerModal.addEventListener('click', handleModalClick);
        startBtn.addEventListener('click', startTimer);
        pauseBtn.addEventListener('click', pauseTimer);
        resetBtn.addEventListener('click', resetTimer);
        
        // 排行榜事件监听器
        if (rankingForm && uploadRankingBtn) {
            rankingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                saveToLocalRanking();
            });
        }
        
        if (viewRankingBtn) {
            viewRankingBtn.addEventListener('click', viewRanking);
        }
        
        // 上传全球排行榜按钮
        if (uploadGlobalBtn) {
            console.log('找到上传全球排行榜按钮，绑定事件...');
            uploadGlobalBtn.addEventListener('click', uploadToGlobalRanking);
            console.log('上传全球排行榜按钮事件已绑定');
        } else {
            console.error('未找到 upload-global-btn 按钮元素！');
        }
        
        // 主页面排行榜按钮点击事件
        if (rankingPageBtn) {
            rankingPageBtn.addEventListener('click', () => {
                window.location.href = 'ranking.html';
            });
        }
        
        // 上传模态窗口事件监听
        if (uploadModal) {
            // 关闭按钮
            if (uploadModalCloseBtn) {
                uploadModalCloseBtn.addEventListener('click', hideUploadModal);
            }
            
            if (cancelUploadBtn) {
                cancelUploadBtn.addEventListener('click', hideUploadModal);
            }
            
            // 点击背景关闭
            uploadModal.addEventListener('click', (e) => {
                if (e.target === uploadModal) {
                    hideUploadModal();
                }
            });
        }
        
        // 上传类型切换
        if (uploadTypeRadios) {
            uploadTypeRadios.forEach(radio => {
                radio.addEventListener('change', handleUploadTypeChange);
            });
        }
        
        // 上传表单提交
        if (uploadGlobalForm) {
            console.log('绑定表单提交事件');
            uploadGlobalForm.addEventListener('submit', handleUploadSubmit);
            console.log('表单提交事件已绑定');
        } else {
            console.error('未找到 upload-global-form 表单元素！');
        }
        
        // 初始化显示
        updateTimerDisplay();
    }
    
    // 页面加载完成后初始化计时器
    window.addEventListener('DOMContentLoaded', initTimer);
})();