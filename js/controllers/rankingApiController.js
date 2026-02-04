/**
 * RankingApiController - 排行榜API模块
 * 负责与排行榜相关的API调用、数据管�?
 * 
 * 功能�?
 * - 保存到本地排行榜
 * - 获取服务器时�?
 * - 验证URL
 * - 查看排行�?
 */

export class RankingApiController {
    constructor(appState, eventBus, logger, modal) {
        this.appState = appState;
        this.eventBus = eventBus;
        this.logger = logger;
        this.modal = modal;
        
        this.logger.debug('RankingApiController已初始化');
    }
    
    /**
     * 保存到本地排行榜
     * @param {number} seconds - 通关时间（秒�?
     * @param {Object} sinner - 选中的罪�?
     * @param {Object} persona - 选中的人�?
     * @param {string} playerNote - 玩家备注
     */
    async saveToLocalRanking(seconds, sinner, persona, playerNote = '') {
        try {
            if (seconds === 0) {
                await this.modal.alert('请先完成一次游戏计时再保存�?, '提示');
                return false;
            }
            
            // 从localStorage获取现有记录
            const records = JSON.parse(localStorage.getItem('personalRanking') || '[]');
            
            // 创建新记�?
            const newRecord = {
                time: seconds,
                comment: playerNote.trim(),
                timestamp: new Date().toISOString(),
                sinner: sinner ? {
                    name: sinner.name,
                    avatar: persona ? persona.avatar : sinner.avatar
                } : null,
                persona: persona ? {
                    name: persona.name,
                    avatar: persona.avatar
                } : null
            };
            
            // 添加新记�?
            records.push(newRecord);
            
            // 保存回localStorage
            localStorage.setItem('personalRanking', JSON.stringify(records));
            
            // 发出事件
            this.eventBus.emit('RANKING_SAVED_LOCAL', {
                record: newRecord,
                totalRecords: records.length
            });
            
            this.logger.debug('记录已保存到本地排行�?);
            return true;
        } catch (error) {
            this.logger.error('保存到本地排行榜失败', error);
            await this.modal.alert(`保存失败: ${error.message}`, '错误');
            return false;
        }
    }
    
    /**
     * 获取本地排行榜记�?
     * @returns {Array} 排行榜记录数�?
     */
    getLocalRecords() {
        try {
            const records = JSON.parse(localStorage.getItem('personalRanking') || '[]');
            return records.sort((a, b) => a.time - b.time); // 按时间升序排�?
        } catch (error) {
            this.logger.error('获取本地排行榜失�?, error);
            return [];
        }
    }
    
    /**
     * 清空本地排行�?
     */
    clearLocalRecords() {
        try {
            localStorage.removeItem('personalRanking');
            this.eventBus.emit('RANKING_CLEARED_LOCAL', {});
            this.logger.debug('本地排行榜已清空');
        } catch (error) {
            this.logger.error('清空本地排行榜失�?, error);
        }
    }
    
    /**
     * 打开排行榜页�?
     */
    viewRanking() {
        try {
            window.open('ranking.html', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
            this.eventBus.emit('RANKING_PAGE_OPENED', {});
            this.logger.debug('排行榜页面已打开');
        } catch (error) {
            this.logger.error('打开排行榜页面失�?, error);
        }
    }
    
    /**
     * 获取当前时间（优先使用API，失败则使用本地时间�?
     * @returns {Promise<Date>} 当前时间
     */
    async getCurrentTime() {
        try {
            const response = await fetch('https://cn.apihz.cn/api/time/getapi.php?id=10010737&key=949afa1fb7d14d5ea210b69a761595a5&type=20');
            
            if (!response.ok) {
                throw new Error('API响应失败');
            }
            
            const data = await response.json();
            const timestamp = parseInt(data.sjc) * 1000;
            return new Date(timestamp);
        } catch (error) {
            this.logger.warn('获取服务器时间失败，使用本地时间', error);
            return new Date();
        }
    }
    
    /**
     * 验证URL有效�?
     * @param {string} url - 要验证的URL
     * @returns {boolean} URL是否有效
     */
    isValidUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }
    
    /**
     * 清理方法
     */
    destroy() {
        this.logger.debug('RankingApiController已销�?);
    }
}

export default RankingApiController;



