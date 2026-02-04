/**
 * UploadController - 上传模块
 * 负责向GitHub提交通关记录到全球排行榜
 * 
 * 功能�?
 * - 显示/隐藏上传模态窗�?
 * - 处理上传表单
 * - 验证上传数据
 * - 生成GitHub Issue URL
 * - 处理完整记录和简化记录的上传
 */

export class UploadController {
    constructor(appState, eventBus, logger, modal) {
        this.appState = appState;
        this.eventBus = eventBus;
        this.logger = logger;
        this.modal = modal;
        
        // DOM元素（延迟初始化�?
        this.uploadModal = null;
        this.uploadModalCloseBtn = null;
        this.cancelUploadBtn = null;
        this.uploadGlobalBtn = null;
        this.uploadGlobalForm = null;
        this.uploadTypeRadios = null;
        this.fullUploadFields = null;
        this.floorOnlyUploadFields = null;
        this.fullTimeDisplay = null;
        
        // 配置
        this.repoOwner = 'Jhh003';
        this.repoName = 'lam';
        this.minUploadTime = 7200; // 2小时（秒�?
        
        // 绑定方法
        this.showUploadModal = this.showUploadModal.bind(this);
        this.hideUploadModal = this.hideUploadModal.bind(this);
        this.handleUploadTypeChange = this.handleUploadTypeChange.bind(this);
        this.handleUploadSubmit = this.handleUploadSubmit.bind(this);
        
        this.logger.debug('UploadController已初始化');
    }
    
    /**
     * 初始化DOM元素
     * @param {Object} domElements - 包含必需DOM元素的对�?
     */
    initDOM(domElements) {
        try {
            this.uploadModal = domElements.uploadModal || document.getElementById('upload-modal');
            this.uploadModalCloseBtn = domElements.uploadModalCloseBtn || document.getElementById('upload-modal-close-btn');
            this.cancelUploadBtn = domElements.cancelUploadBtn || document.getElementById('cancel-upload-btn');
            this.uploadGlobalBtn = domElements.uploadGlobalBtn || document.getElementById('upload-global-btn');
            this.uploadGlobalForm = domElements.uploadGlobalForm || document.getElementById('upload-global-form');
            this.uploadTypeRadios = domElements.uploadTypeRadios || document.querySelectorAll('input[name="uploadType"]');
            this.fullUploadFields = domElements.fullUploadFields || document.getElementById('full-upload-fields');
            this.floorOnlyUploadFields = domElements.floorOnlyUploadFields || document.getElementById('floor-only-upload-fields');
            this.fullTimeDisplay = domElements.fullTimeDisplay || document.getElementById('full-time-display');
            
            // 绑定事件
            this.uploadGlobalBtn?.addEventListener('click', () => this.uploadToGlobalRanking());
            this.uploadModalCloseBtn?.addEventListener('click', this.hideUploadModal);
            this.cancelUploadBtn?.addEventListener('click', this.hideUploadModal);
            this.uploadTypeRadios?.forEach(radio => {
                radio.addEventListener('change', this.handleUploadTypeChange);
            });
            this.uploadGlobalForm?.addEventListener('submit', this.handleUploadSubmit);
            
            // 点击背景关闭
            this.uploadModal?.addEventListener('click', (e) => {
                if (e.target === this.uploadModal) {
                    this.hideUploadModal();
                }
            });
            
            this.logger.debug('UploadController DOM初始化完�?);
        } catch (error) {
            this.logger.error('UploadController DOM初始化失�?, error);
            throw error;
        }
    }
    
    /**
     * 触发上传到全球排行榜
     */
    async uploadToGlobalRanking() {
        try {
            const selectedSinner = this.appState.get('game.selectedSinner');
            const selectedPersona = this.appState.get('game.selectedPersona');
            
            if (!selectedSinner || !selectedPersona) {
                await this.modal.alert(
                    '检测到您当前未选择罪人或人格。\n\n' +
                    '您需要先在主界面完成罪人和人格的随机抽取�? +
                    '然后再进行上传�?,
                    '需要先抽取'
                );
                return;
            }
            
            this.showUploadModal();
        } catch (error) {
            this.logger.error('上传到全球排行榜失败', error);
        }
    }
    
    /**
     * 显示上传模态窗�?
     */
    async showUploadModal() {
        try {
            if (!this.uploadModal || !this.uploadGlobalForm) {
                await this.modal.alert('上传功能初始化失败，请刷新页面重试�?, '错误');
                return;
            }
            
            // 获取当前计时器时�?
            const timerSeconds = this.appState.get('timer.elapsedSeconds') || 0;
            
            // 填充时间显示
            if (this.fullTimeDisplay) {
                this.fullTimeDisplay.value = this.formatTime(timerSeconds);
            }
            
            // 重置表单
            this.uploadGlobalForm.reset();
            
            // 默认选中完整记录上传
            const fullRadio = document.querySelector('input[name="uploadType"][value="full"]');
            if (fullRadio) {
                fullRadio.checked = true;
            }
            
            // 显示完整字段
            if (this.fullUploadFields) {
                this.fullUploadFields.style.display = 'block';
            }
            if (this.floorOnlyUploadFields) {
                this.floorOnlyUploadFields.style.display = 'none';
            }
            
            // 显示模态窗�?
            this.uploadModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            this.logger.debug('上传模态窗口已打开');
        } catch (error) {
            this.logger.error('显示上传模态窗口失�?, error);
        }
    }
    
    /**
     * 隐藏上传模态窗�?
     */
    hideUploadModal() {
        try {
            if (this.uploadModal) {
                this.uploadModal.classList.remove('active');
            }
            document.body.style.overflow = '';
            this.logger.debug('上传模态窗口已关闭');
        } catch (error) {
            this.logger.error('隐藏上传模态窗口失�?, error);
        }
    }
    
    /**
     * 处理上传类型切换
     */
    handleUploadTypeChange = () => {
        try {
            const selectedType = document.querySelector('input[name="uploadType"]:checked')?.value;
            
            if (selectedType === 'full') {
                if (this.fullUploadFields) this.fullUploadFields.style.display = 'block';
                if (this.floorOnlyUploadFields) this.floorOnlyUploadFields.style.display = 'none';
            } else if (selectedType === 'floor-only') {
                if (this.fullUploadFields) this.fullUploadFields.style.display = 'none';
                if (this.floorOnlyUploadFields) this.floorOnlyUploadFields.style.display = 'block';
            }
        } catch (error) {
            this.logger.error('处理上传类型切换失败', error);
        }
    }
    
    /**
     * 处理表单提交
     */
    handleUploadSubmit = async (e) => {
        try {
            e.preventDefault();
            e.stopPropagation();
            
            const selectedType = document.querySelector('input[name="uploadType"]:checked')?.value;
            const selectedSinner = this.appState.get('game.selectedSinner');
            const selectedPersona = this.appState.get('game.selectedPersona');
            
            if (selectedType === 'full') {
                await this.submitFullRecord(selectedSinner, selectedPersona);
            } else if (selectedType === 'floor-only') {
                await this.submitFloorOnlyRecord(selectedSinner, selectedPersona);
            }
            
            return false;
        } catch (error) {
            this.logger.error('处理表单提交失败', error);
        }
    }
    
    /**
     * 提交完整记录
     */
    async submitFullRecord(selectedSinner, selectedPersona) {
        try {
            const timerSeconds = this.appState.get('timer.elapsedSeconds') || 0;
            
            // 验证时间
            if (timerSeconds < this.minUploadTime) {
                await this.modal.alert(
                    '很抱歉，完整记录上传需要通关时间�?2小时�?200秒）。\n\n' +
                    '您当前的时间为：' + this.formatTime(timerSeconds),
                    '提示'
                );
                return;
            }
            
            // 验证层数选择
            const floorLevel = document.querySelector('input[name="fullFloorLevel"]:checked')?.value;
            if (!floorLevel) {
                await this.modal.alert('请选择单通层数！', '提示');
                return;
            }
            
            // 获取表单数据
            const usedEgo = document.getElementById('full-used-ego')?.checked || false;
            const screenshot = document.getElementById('full-screenshot')?.value.trim() || '';
            const comment = document.getElementById('full-comment')?.value.trim() || '';
            
            // 验证图片链接
            if (screenshot && !this.isValidUrl(screenshot)) {
                await this.modal.alert('请输入有效的图片链接�?, '提示');
                return;
            }
            
            // 生成确认信息
            const info = `您即将上传以下完整记录到全球排行榜：\n\n` +
                `罪人�?{selectedSinner.name}\n` +
                `人格�?{selectedPersona.name}\n` +
                `时间�?{this.formatTime(timerSeconds)}\n` +
                `层数：第${floorLevel}层\n` +
                `E.G.O�?{usedEgo ? '�? : '�?}\n` +
                `通关图片�?{screenshot || '未提�?}\n` +
                `备注�?{comment || '�?}\n\n` +
                `点击确定后将跳转�?GitHub 页面提交记录。\n` +
                `（您需要有 GitHub 账号）`;
            
            const confirmed = await this.modal.confirm(info, '上传确认');
            
            if (confirmed) {
                // 生成 GitHub Issue URL
                const issueUrl = `https://github.com/${this.repoOwner}/${this.repoName}/issues/new?` +
                    `labels=通关记录&` +
                    `template=submit-clear-run.yml&` +
                    `title=[通关记录] ${selectedSinner.name} - ${selectedPersona.name} - ${this.formatTime(timerSeconds)}`;
                
                window.open(issueUrl, '_blank');
                this.hideUploadModal();
                
                // 发出事件
                this.eventBus.emit('RECORD_SUBMITTED_FULL', {
                    sinner: selectedSinner,
                    persona: selectedPersona,
                    time: timerSeconds,
                    floorLevel,
                    usedEgo,
                    screenshot,
                    comment
                });
                
                await this.modal.alert(
                    '已在新窗口打开 GitHub 提交页面。\n\n' +
                    '请在那里填写表单（包括通关图片链接）并提交 Issue。\n\n' +
                    '管理员审核通过后，您的记录将出现在全球排行榜中�?,
                    '提示'
                );
            }
        } catch (error) {
            this.logger.error('提交完整记录失败', error);
        }
    }
    
    /**
     * 提交简化记录（仅层数）
     */
    async submitFloorOnlyRecord(selectedSinner, selectedPersona) {
        try {
            // 验证层数选择
            const floorLevel = document.querySelector('input[name="floorOnlyFloorLevel"]:checked')?.value;
            if (!floorLevel) {
                await this.modal.alert('请选择单通层数！', '提示');
                return;
            }
            
            // 获取表单数据
            const screenshot = document.getElementById('floor-only-screenshot')?.value.trim() || '';
            const comment = document.getElementById('floor-only-comment')?.value.trim() || '';
            
            // 验证图片链接
            if (screenshot && !this.isValidUrl(screenshot)) {
                await this.modal.alert('请输入有效的图片链接�?, '提示');
                return;
            }
            
            // 生成确认信息
            const info = `您即将上传以下简化记录到全球排行榜：\n\n` +
                `罪人�?{selectedSinner.name}\n` +
                `人格�?{selectedPersona.name}\n` +
                `层数：第${floorLevel}层\n` +
                `通关图片�?{screenshot || '未提�?}\n` +
                `备注�?{comment || '�?}\n\n` +
                `注：此记录不包含通关时间，仅显示在层数排行榜中。\n\n` +
                `点击确定后将跳转�?GitHub 页面提交记录。\n` +
                `（您需要有 GitHub 账号）`;
            
            const confirmed = await this.modal.confirm(info, '上传确认');
            
            if (confirmed) {
                // 生成 GitHub Issue URL
                const issueUrl = `https://github.com/${this.repoOwner}/${this.repoName}/issues/new?` +
                    `labels=层数记录&` +
                    `template=submit-floor-only.yml&` +
                    `title=[层数记录] ${selectedSinner.name} - ${selectedPersona.name} - �?{floorLevel}层`;
                
                window.open(issueUrl, '_blank');
                this.hideUploadModal();
                
                // 发出事件
                this.eventBus.emit('RECORD_SUBMITTED_FLOOR_ONLY', {
                    sinner: selectedSinner,
                    persona: selectedPersona,
                    floorLevel,
                    screenshot,
                    comment
                });
                
                await this.modal.alert(
                    '已在新窗口打开 GitHub 提交页面。\n\n' +
                    '请在那里填写表单（包括通关图片链接）并提交 Issue。\n\n' +
                    '管理员审核通过后，您的记录将出现在层数排行榜中�?,
                    '提示'
                );
            }
        } catch (error) {
            this.logger.error('提交简化记录失�?, error);
        }
    }
    
    /**
     * 格式化时间（�?-> HH:MM:SS�?
     * @param {number} seconds - 秒数
     * @returns {string} 格式化的时间字符�?
     */
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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
        this.uploadGlobalBtn?.removeEventListener('click', () => this.uploadToGlobalRanking());
        this.uploadModalCloseBtn?.removeEventListener('click', this.hideUploadModal);
        this.cancelUploadBtn?.removeEventListener('click', this.hideUploadModal);
        this.uploadTypeRadios?.forEach(radio => {
            radio.removeEventListener('change', this.handleUploadTypeChange);
        });
        this.uploadGlobalForm?.removeEventListener('submit', this.handleUploadSubmit);
        
        this.logger.debug('UploadController已销�?);
    }
}

export default UploadController;



