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
            countdownElement.innerHTML = `距离第七赛季更新还有<br>${formattedDays}天 ${formattedHours}小时 ${formattedMinutes}分钟 ${formattedSeconds}秒`;
        }
    }
})();