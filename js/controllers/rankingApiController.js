/**
 * 排行榜API控制器 - 管理本地排行榜数据
 * 
 * 职责：
 * - 本地排行榜保存和读取
 * - 排行榜数据排序和筛选
 * - 记录删除和管理
 * 
 * @module RankingApiController
 */

import { appState } from '../core/appState.js';
import { eventBus, GameEvents } from '../core/eventBus.js';
import { logger } from '../core/logger.js';

export class RankingApiController {
    constructor() {
        this.storageKey = 'local_ranking';
    }
    
    /**
     * 保存到本地排行榜
     * @param {Object} sinner - 罪人对象
     * @param {Object} persona - 人格对象
     * @param {number} time - 用时（秒）
     * @param {string} note - 备注
     * @param {Object} options - 额外选项
     */
    saveToLocalRanking(sinner, persona, time, note = '', options = {}) {
        if (!sinner || !persona || typeof time !== 'number') {
            logger.error('[RankingApiController] 保存失败：参数无效');
            return false;
        }
        
        const record = {
            timestamp: this.getCurrentTime(),
            sinner: sinner.name || sinner.id,
            sinnerId: sinner.id,
            persona: persona.name,
            time: time,
            note: note,
            ...options
        };
        
        // 添加到AppState
        appState.addLocalRecord(record);
        
        eventBus.emit(GameEvents.LOCAL_RECORD_SAVED, record);
        
        logger.info(`[RankingApiController] 记录已保存: ${sinner.name} - ${persona.name} (${time}秒)`);
        
        return true;
    }
    
    /**
     * 获取本地排行榜记录
     * @param {string} type - 排序类型 'time' 或 'date'
     * @returns {Array} 排序后的记录列表
     */
    getLocalRecords(type = 'time') {
        const records = appState.get('ranking.localRecords') || [];
        
        if (type === 'time') {
            // 按时间升序排序（快到慢）
            return [...records].sort((a, b) => a.time - b.time);
        } else if (type === 'date') {
            // 按日期降序排序（新到旧）
            return [...records].sort((a, b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
        }
        
        return records;
    }
    
    /**
     * 删除本地记录
     * @param {number} index - 记录索引
     */
    deleteLocalRecord(index) {
        const records = appState.get('ranking.localRecords') || [];
        
        if (index < 0 || index >= records.length) {
            logger.error('[RankingApiController] 删除失败：索引无效');
            return false;
        }
        
        records.splice(index, 1);
        appState.set('ranking.localRecords', records);
        
        eventBus.emit(GameEvents.RANKING_UPDATED, { records });
        
        logger.info(`[RankingApiController] 记录已删除: 索引 ${index}`);
        
        return true;
    }
    
    /**
     * 清空本地排行榜
     */
    clearLocalRecords() {
        appState.set('ranking.localRecords', []);
        
        eventBus.emit(GameEvents.RANKING_UPDATED, { records: [] });
        
        logger.info('[RankingApiController] 本地排行榜已清空');
    }
    
    /**
     * 获取当前时间字符串
     * @returns {string} 格式化的时间字符串
     */
    getCurrentTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    
    /**
     * 打开排行榜页面
     */
    viewRanking() {
        window.location.href = 'ranking.html';
    }
    
    /**
     * 验证URL格式
     * @param {string} url - URL字符串
     * @returns {boolean} 是否有效
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * 获取排行榜统计信息
     * @returns {Object} 统计信息
     */
    getStatistics() {
        const records = this.getLocalRecords();
        
        if (records.length === 0) {
            return {
                totalRecords: 0,
                bestTime: null,
                averageTime: null,
                mostUsedSinner: null,
                mostUsedPersona: null
            };
        }
        
        const totalRecords = records.length;
        const bestTime = Math.min(...records.map(r => r.time));
        const averageTime = records.reduce((sum, r) => sum + r.time, 0) / totalRecords;
        
        // 统计最常用的罪人
        const sinnerCounts = {};
        records.forEach(r => {
            sinnerCounts[r.sinner] = (sinnerCounts[r.sinner] || 0) + 1;
        });
        const mostUsedSinner = Object.keys(sinnerCounts).reduce((a, b) => 
            sinnerCounts[a] > sinnerCounts[b] ? a : b
        );
        
        // 统计最常用的人格
        const personaCounts = {};
        records.forEach(r => {
            personaCounts[r.persona] = (personaCounts[r.persona] || 0) + 1;
        });
        const mostUsedPersona = Object.keys(personaCounts).reduce((a, b) => 
            personaCounts[a] > personaCounts[b] ? a : b
        );
        
        return {
            totalRecords,
            bestTime,
            averageTime,
            mostUsedSinner,
            mostUsedPersona
        };
    }
}

// 导出单例
export const rankingApiController = new RankingApiController();
