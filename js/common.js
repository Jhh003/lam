// 倒计时功能实现
(function () {
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
        
        // 排行榜功能元素
        const rankingForm = document.getElementById('ranking-form');
        const playerNameInput = document.getElementById('player-name');
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
        
        // 上传到排行榜
        async function uploadToRanking() {
            if (seconds === 0) {
                alert('请先完成一次游戏计时再上传！');
                return;
            }
            
            const playerName = playerNameInput.value.trim();
            if (!playerName) {
                alert('请输入昵称！');
                playerNameInput.focus();
                return;
            }
            
            const playerNote = playerNoteInput.value.trim();
            
            try {
                uploadRankingBtn.disabled = true;
                uploadRankingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 上传中...';
                
                const fullUrl = rankingApiUrl + rankingUploadPath;
                console.log('正在上传到:', fullUrl);
                
                const response = await fetch(fullUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: playerName, // 使用userId参数名（兼容nickname）
                        nickname: playerName,
                        time: seconds,
                        comment: playerNote
                    })
                });
                
                console.log('响应状态:', response.status);
                
                // 检查响应是否成功
                if (!response.ok) {
                    throw new Error(`网络请求失败: ${response.status} ${response.statusText}`);
                }
                
                const result = await response.json();
                console.log('响应数据:', result);
                
                // 兼容新旧两种响应格式
                const success = result.code === 200 || result.success;
                const rank = result.data?.rank;
                const errorMessage = result.message || result.error || '未知错误';
                
                if (success) {
                    alert('上传成功！您的排名：第' + rank + '名');
                    // 可选：重置表单
                    playerNameInput.value = '';
                    playerNoteInput.value = '';
                } else {
                    alert('上传失败：' + errorMessage);
                }
            } catch (error) {
                console.error('上传失败:', error);
                alert(`上传失败: ${error.message}\n\n详细信息请查看浏览器控制台`);
            } finally {
                uploadRankingBtn.disabled = false;
                uploadRankingBtn.innerHTML = '<i class="fas fa-upload"></i> 上传到排行榜';
            }
        }
        
        // 查看排行榜
        async function viewRanking() {
            try {
                viewRankingBtn.disabled = true;
                viewRankingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 加载中...';
                
                // 使用新路径和新参数（limit和offset）
                const response = await fetch(`${rankingApiUrl}${rankingQueryPath}?limit=10&offset=0`);
                const result = await response.json();
                
                // 兼容新旧两种响应格式
                const success = result.code === 200 || result.success;
                let records = [];
                
                // 从新格式中提取数据
                if (Array.isArray(result.data)) {
                    records = result.data;
                } 
                // 从旧格式中提取数据
                else if (result.data?.records && Array.isArray(result.data.records)) {
                    records = result.data.records;
                }
                
                if (success && records.length > 0) {
                    // 创建排行榜显示内容
                    let rankingHtml = '<h4>单通时间排行榜</h4><ol style="list-style: decimal; padding-left: 20px; max-height: 300px; overflow-y: auto;">';
                    
                    records.forEach((entry) => {
                        const timeStr = formatTime(entry.time);
                        // 兼容userId和nickname
                        const playerName = entry.nickname || entry.userId;
                        rankingHtml += `<li style="margin-bottom: 10px; padding: 5px; border-bottom: 1px solid #eee;">
                            <strong>${entry.rank}. ${playerName}</strong><br>
                            <span style="color: #007bff;">时间：${timeStr}</span><br>
                            <span style="font-size: 0.8rem; color: #666;">${entry.comment || '无备注'}</span><br>
                            <span style="font-size: 0.8rem; color: #999;">上传时间：${new Date(entry.timestamp).toLocaleString()}</span>
                        </li>`;
                    });
                    
                    rankingHtml += '</ol>';
                    
                    // 使用alert或自定义弹窗显示排行榜
                    // 这里使用一个简单的alert，实际项目中可以使用更美观的弹窗
                    alert(rankingHtml.replace(/<[^>]+>/g, ''));
                } else {
                    alert('排行榜为空！');
                }
            } catch (error) {
                console.error('加载排行榜失败:', error);
                alert('加载排行榜失败，请检查网络连接或稍后重试！');
            } finally {
                viewRankingBtn.disabled = false;
                viewRankingBtn.innerHTML = '<i class="fas fa-trophy"></i> 查看排行榜';
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
                uploadToRanking();
            });
        }
        
        if (viewRankingBtn) {
            viewRankingBtn.addEventListener('click', viewRanking);
        }
        
        // 初始化显示
        updateTimerDisplay();
    }
    
    // 页面加载完成后初始化计时器
    window.addEventListener('DOMContentLoaded', initTimer);
})();