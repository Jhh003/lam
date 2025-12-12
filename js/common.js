// 倒计时功能实现
(function () {
    // 导入弹窗模块
    import('./modal.js').then(({ default: Modal }) => {
        window.Modal = Modal; // 全局可用
    });
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

    // 立即显示初始化消息，确保用户知道倒计时正在工作
    const countdownElement = document.getElementById('countdown');
    if (countdownElement) {
        countdownElement.innerHTML = `距离第七赛季更新还有<br>计算中...`;
    }

    // 计算当前时间并开始倒计时
    getCurrentTime().then(currentTime => {
        // 设置目标时间为2025-12-31 11:00:00（北京时间）
        const targetTime = new Date('2025-12-31T11:00:00+08:00');
        
        // 计算剩余时间
        let timeRemaining = targetTime - currentTime;
        
        // 确保剩余时间不小于0
        if (timeRemaining < 0) {
            timeRemaining = 0;
        }
        
        // 更新一次倒计时显示，确保立即显示正确时间
        updateCountdownDisplay(timeRemaining);
        
        // 每秒钟更新一次倒计时
        const countdownInterval = setInterval(() => {
            timeRemaining -= 1000;
            
            // 如果时间到了，清除倒计时
            if (timeRemaining <= 0) {
                clearInterval(countdownInterval);
                timeRemaining = 0;
            }
            
            // 更新页面上的倒计时显示
            updateCountdownDisplay(timeRemaining);
        }, 1000);
    });
    
    // 更新倒计时显示的函数
    function updateCountdownDisplay(timeRemaining) {
        // 计算天、时、分、秒
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
        
        // 格式化时间，确保两位数
        const formattedDays = days.toString();
        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');
        
        // 更新页面上的倒计时显示
        const countdownElement = document.getElementById('countdown');
        if (countdownElement) {
            // 创建带有动画效果的倒计时文本
            const countdownText = `距离第七赛季更新还有<br>${formattedDays}天 ${formattedHours}小时 ${formattedMinutes}分钟 ${formattedSeconds}秒`;
            
            // 将文本拆分为字符，并用span包裹以应用动画效果
            const animatedText = createAnimatedText(countdownText);
            
            countdownElement.innerHTML = animatedText;
        }
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
        
        // 成功单通复选框和层数选择
        const soloClearCheckbox = document.getElementById('solo-clear-checkbox');
        const floorSelection = document.getElementById('floor-selection');
        
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
                        avatar: selectedSinner.avatar
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
        
        // 上传到全球排行榜
        async function uploadToGlobalRanking() {
            // 1. 验证计时器是否有数据
            if (seconds === 0) {
                setTimeout(() => window.Modal?.alert('请先完成一次游戏计时再上传！', '提示'), 100);
                return;
            }
            
            // 2. 验证时间是否达到2小时
            if (seconds < 7200) {
                setTimeout(() => window.Modal?.alert('很抱歉，只有通关时间≥ 2小时（7200秒）的记录才能上传到全球排行榜。', '提示'), 100);
                return;
            }
            
            // 3. 自动检测当前选中的罪人和人格
            const selectedSinner = window.currentSelectedSinner;
            const selectedPersona = window.currentSelectedPersona;
            
            // 4. 如果未选择罪人或人格，提示用户
            if (!selectedSinner || !selectedPersona) {
                const proceed = await window.Modal?.confirm(
                    '检测到您当前未选择罪人或人格。\n\n' +
                    '您需要先在主界面完成罪人和人格的随机抽取，' +
                    '然后再进行上传。\n\n' +
                    '是否立即转到主界面进行抽取？',
                    '需要先抽取'
                );
                
                if (proceed) {
                    hideTimerModal();
                }
                return;
            }
            
            // 5. 生成 GitHub Issue 表单数据
            const comment = playerNoteInput ? playerNoteInput.value.trim() : '';
            const usedEgoCheckbox = document.getElementById('used-ego');
            const usedEgo = usedEgoCheckbox ? usedEgoCheckbox.checked : false;
            
            // 获取成功单通层数
            const soloClear = soloClearCheckbox ? soloClearCheckbox.checked : false;
            let floorLevel = null;
            if (soloClear) {
                const selectedFloor = document.querySelector('input[name="floorLevel"]:checked');
                floorLevel = selectedFloor ? parseInt(selectedFloor.value, 10) : null;
            }
            
            const runDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            
            // 6. 生成 Issue URL（预填表单）
            const repoOwner = 'Jhh003'; // 此处应替换为实际的 GitHub 用户名
            const repoName = 'lam'; // 此处应替换为实际的仓库名
            
            const issueBody = `### 罪人 ID\n${selectedSinner.id}\n\n` +
                `### 罪人名称\n${selectedSinner.name}\n\n` +
                `### 人格名称\n${selectedPersona.name}\n\n` +
                `### 通关时间（秒）\n${seconds}\n\n` +
                `### 通关日期\n${runDate}\n\n` +
                `### 备注（可选）\n${comment || '无'}`;
            
            const issueUrl = `https://github.com/${repoOwner}/${repoName}/issues/new?` +
                `labels=通关记录&` +
                `template=submit-clear-run.yml&` +
                `title=[通关记录] ${selectedSinner.name} - ${selectedPersona.name} - ${formatTime(seconds)}`;
            
            // 7. 显示确认弹窗
            let info = `您即将上传以下记录到全球排行榜：\n\n` +
                `罪人：${selectedSinner.name}\n` +
                `人格：${selectedPersona.name}\n` +
                `时间：${formatTime(seconds)}\n` +
                `备注：${comment || '无'}\n` +
                `使用 E.G.O：${usedEgo ? '是' : '否'}\n`;
            
            if (soloClear && floorLevel) {
                info += `成功单通层数：第${floorLevel}层\n`;
            }
            
            info += `\n点击确定后将跳转到 GitHub 页面提交记录。\n` +
                `（您需要有 GitHub 账号）`;
            
            const confirmed = await window.Modal?.confirm(info, '上传确认');
            
            if (confirmed) {
                // 8. 在新窗口打开 GitHub Issue 页面
                window.open(issueUrl, '_blank');
                
                // 9. 同时保存到本地
                saveToLocalRanking();
                
                setTimeout(() => {
                    window.Modal?.alert(
                        '已在新窗口打开 GitHub 提交页面。\n\n' +
                        '请在那里填写表单并提交 Issue。\n\n' +
                        '管理员审核通过后，您的记录将出现在全球排行榜中。',
                        '提示'
                    );
                }, 500);
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
        
        // 显示计时器弹窗
        function showTimerModal() {
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
            uploadGlobalBtn.addEventListener('click', uploadToGlobalRanking);
        }
        
        // 主页面排行榜按钮点击事件
        if (rankingPageBtn) {
            rankingPageBtn.addEventListener('click', () => {
                window.location.href = 'ranking.html';
            });
        }
        
        // 成功单通复选框事件监听
        if (soloClearCheckbox && floorSelection) {
            soloClearCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    floorSelection.style.display = 'block';
                    // 首次勾选时显示帮助信息
                    const hasSeenGuide = localStorage.getItem('hasSeenFloorGuide');
                    if (!hasSeenGuide) {
                        setTimeout(() => {
                            window.Modal?.alert(
                                '🎯 成功单通层数上传指南\n\n' +
                                '1、选中“是否成功单通？”后，需要选择您成功单通的最高层数。\n\n' +
                                '2、目前支持的层数有：第5层、第10层、第15层。\n\n' +
                                '3、层数排行榜按层数高低排序（15层 > 10层 > 5层）。\n\n' +
                                '4、相同层数的记录按提交时间排序，先提交的排在前面。\n\n' +
                                '5、您可以在排行榜页面的“单通层数（联网）”标签页查看所有层数记录。',
                                '使用说明'
                            );
                            localStorage.setItem('hasSeenFloorGuide', 'true');
                        }, 100);
                    }
                } else {
                    floorSelection.style.display = 'none';
                    // 清除所有选中的层数
                    const floorRadios = document.querySelectorAll('input[name="floorLevel"]');
                    floorRadios.forEach(radio => radio.checked = false);
                }
            });
        }
        
        // 初始化显示
        updateTimerDisplay();
    }
    
    // 页面加载完成后初始化计时器
    window.addEventListener('DOMContentLoaded', initTimer);
})();