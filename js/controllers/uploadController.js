/**
 * 上传控制器 - 管理全球排行榜上传功能
 * 
 * 职责：
 * - 处理上传流程
 * - 验证上传数据
 * - 生成GitHub Issue URL
 * - 管理上传模态框
 * 
 * @module UploadController
 */

import { appState } from '../core/appState.js';
import { eventBus, GameEvents } from '../core/eventBus.js';
import { logger } from '../core/logger.js';
import { uiController } from './uiController.js';

// GitHub仓库配置
const REPO_OWNER = 'Jhh003';
const REPO_NAME = 'lam';
const MIN_UPLOAD_TIME = 7200; // 最小上传时间（秒）：2小时

export class UploadController {
    constructor() {
        this.dom = {
            uploadModal: null,
            uploadTypeCards: null,
            fullRecordForm: null,
            floorOnlyForm: null,
            confirmButton: null,
            cancelButton: null
        };
        
        this.currentUploadType = 'full'; // 'full' 或 'floor-only'
        this.initialized = false;
    }
    
    /**
     * 初始化DOM元素
     * @param {Object} domElements - DOM元素映射
     */
    initDOM(domElements) {
        Object.assign(this.dom, domElements);
        this.initialized = true;
        logger.info('[UploadController] DOM初始化完成');
    }
    
    /**
     * 显示上传模态框
     */
    showUploadModal() {
        // 验证是否有选中的罪人和人格
        const sinner = appState.getSinner();
        const persona = appState.getPersona();
        
        if (!sinner) {
            uiController.showError('请先选择罪人');
            return;
        }
        
        if (!persona) {
            uiController.showError('请先选择人格');
            return;
        }
        
        // 打开模态框
        uiController.openModal('upload-modal');
        
        // 初始化表单
        this.initUploadForm();
        
        logger.info('[UploadController] 上传模态框已打开');
    }
    
    /**
     * 初始化上传表单
     */
    initUploadForm() {
        // 设置默认选择为完整记录
        this.selectUploadType('full');
        
        // 填充时间信息
        const elapsedSeconds = appState.getElapsedSeconds();
        const timeDisplay = document.getElementById('upload-time-display');
        if (timeDisplay) {
            timeDisplay.textContent = this.formatTime(elapsedSeconds);
        }
        
        // 绑定上传类型切换事件
        this.bindUploadTypeEvents();
        
        // 绑定表单提交事件
        this.bindFormSubmitEvents();
    }
    
    /**
     * 选择上传类型
     * @param {string} type - 'full' 或 'floor-only'
     */
    selectUploadType(type) {
        this.currentUploadType = type;
        
        // 更新UI选择状态
        const cards = document.querySelectorAll('.upload-type-card');
        cards.forEach(card => {
            if (card.dataset.type === type) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
        
        // 显示对应的表单
        const fullForm = document.getElementById('full-record-form');
        const floorForm = document.getElementById('floor-only-form');
        
        if (type === 'full') {
            if (fullForm) fullForm.style.display = 'block';
            if (floorForm) floorForm.style.display = 'none';
        } else {
            if (fullForm) fullForm.style.display = 'none';
            if (floorForm) floorForm.style.display = 'block';
        }
        
        logger.debug(`[UploadController] 上传类型选择: ${type}`);
    }
    
    /**
     * 绑定上传类型切换事件
     */
    bindUploadTypeEvents() {
        const cards = document.querySelectorAll('.upload-type-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const type = card.dataset.type;
                this.selectUploadType(type);
            });
        });
    }
    
    /**
     * 绑定表单提交事件
     */
    bindFormSubmitEvents() {
        const confirmBtn = document.getElementById('upload-confirm-btn');
        const cancelBtn = document.getElementById('upload-cancel-btn');
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.handleUploadSubmit();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                uiController.closeModal('upload-modal');
            });
        }
    }
    
    /**
     * 处理上传提交
     */
    handleUploadSubmit() {
        if (this.currentUploadType === 'full') {
            this.submitFullRecord();
        } else {
            this.submitFloorOnlyRecord();
        }
    }
    
    /**
     * 提交完整记录
     */
    submitFullRecord() {
        // 获取数据
        const sinner = appState.getSinner();
        const persona = appState.getPersona();
        const elapsedSeconds = appState.getElapsedSeconds();
        
        // 验证时间
        if (elapsedSeconds < MIN_UPLOAD_TIME) {
            uiController.showError(`完整记录需要至少 ${MIN_UPLOAD_TIME / 3600} 小时的通关时间`);
            return;
        }
        
        // 获取表单数据
        const floorLevel = document.querySelector('input[name="floor-level"]:checked')?.value;
        const usedEgo = document.getElementById('used-ego')?.checked || false;
        const note = document.getElementById('upload-note')?.value || '';
        
        // 验证层数
        if (!floorLevel) {
            uiController.showError('请选择单通层数');
            return;
        }
        
        // 生成Issue URL
        const issueUrl = this.generateIssueUrl({
            type: 'full',
            sinner: sinner.name,
            persona: persona.name,
            time: elapsedSeconds,
            floorLevel,
            usedEgo,
            note
        });
        
        // 显示确认对话框
        uiController.showConfirm(
            '即将跳转到 GitHub 提交记录，确认继续？',
            () => {
                window.open(issueUrl, '_blank');
                uiController.closeModal('upload-modal');
                eventBus.emit(GameEvents.RECORD_SUBMITTED, { type: 'full' });
            },
            null
        );
        
        logger.info('[UploadController] 提交完整记录');
    }
    
    /**
     * 提交简化记录
     */
    submitFloorOnlyRecord() {
        // 获取数据
        const sinner = appState.getSinner();
        const persona = appState.getPersona();
        
        // 获取表单数据
        const floorLevel = document.querySelector('input[name="floor-level-simple"]:checked')?.value;
        const note = document.getElementById('upload-note-simple')?.value || '';
        
        // 验证层数
        if (!floorLevel) {
            uiController.showError('请选择单通层数');
            return;
        }
        
        // 生成Issue URL
        const issueUrl = this.generateIssueUrl({
            type: 'floor-only',
            sinner: sinner.name,
            persona: persona.name,
            floorLevel,
            note
        });
        
        // 显示确认对话框
        uiController.showConfirm(
            '即将跳转到 GitHub 提交记录（仅层数记录），确认继续？',
            () => {
                window.open(issueUrl, '_blank');
                uiController.closeModal('upload-modal');
                eventBus.emit(GameEvents.RECORD_SUBMITTED, { type: 'floor-only' });
            },
            null
        );
        
        logger.info('[UploadController] 提交简化记录');
    }
    
    /**
     * 生成GitHub Issue URL
     * @param {Object} data - 记录数据
     * @returns {string} Issue URL
     */
    generateIssueUrl(data) {
        const baseUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/new`;
        
        const params = new URLSearchParams();
        
        if (data.type === 'full') {
            params.append('template', 'submit-clear-run.yml');
            params.append('title', `通关记录 - ${data.sinner} / ${data.persona}`);
            params.append('labels', '通关记录');
            params.append('sinner', data.sinner);
            params.append('persona', data.persona);
            params.append('time', data.time);
            params.append('floor', data.floorLevel);
            params.append('ego', data.usedEgo ? '是' : '否');
            if (data.note) params.append('note', data.note);
        } else {
            params.append('template', 'submit-floor-only.yml');
            params.append('title', `层数记录 - ${data.sinner} / ${data.persona}`);
            params.append('labels', '层数记录');
            params.append('sinner', data.sinner);
            params.append('persona', data.persona);
            params.append('floor', data.floorLevel);
            if (data.note) params.append('note', data.note);
        }
        
        return `${baseUrl}?${params.toString()}`;
    }
    
    /**
     * 格式化时间
     * @param {number} totalSeconds - 总秒数
     * @returns {string} 格式化的时间字符串
     */
    formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * 验证上传数据
     * @param {Object} data - 上传数据
     * @returns {boolean} 是否有效
     */
    validateUploadData(data) {
        if (!data.sinner || !data.persona) {
            return false;
        }
        
        if (data.type === 'full') {
            if (!data.time || data.time < MIN_UPLOAD_TIME) {
                return false;
            }
        }
        
        if (!data.floorLevel) {
            return false;
        }
        
        return true;
    }
}

// 导出单例
export const uploadController = new UploadController();
