// 自定义弹窗模块 - 替换浏览器原生alert/confirm
const Modal = (() => {
    let modalContainer = null;
    
    // 初始化弹窗容器
    const initModal = () => {
        if (modalContainer) return;
        
        modalContainer = document.createElement('div');
        modalContainer.id = 'custom-modal-container';
        modalContainer.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-box">
                    <div class="modal-header">
                        <h3 class="modal-title"></h3>
                    </div>
                    <div class="modal-body">
                        <p class="modal-message"></p>
                    </div>
                    <div class="modal-footer"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modalContainer);
    };
    
    // 显示弹窗
    const showModal = (title, message, buttons, onClose) => {
        initModal();
        
        const overlay = modalContainer.querySelector('.modal-overlay');
        const titleEl = modalContainer.querySelector('.modal-title');
        const messageEl = modalContainer.querySelector('.modal-message');
        const footer = modalContainer.querySelector('.modal-footer');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        footer.innerHTML = '';
        
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `modal-btn ${btn.className || ''}`;
            button.textContent = btn.text;
            button.onclick = () => {
                hideModal();
                if (btn.callback) btn.callback();
            };
            footer.appendChild(button);
        });
        
        modalContainer.style.display = 'block';
        setTimeout(() => overlay.classList.add('active'), 10);
        
        // 点击遮罩关闭
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                hideModal();
                if (onClose) onClose();
            }
        };
    };
    
    // 隐藏弹窗
    const hideModal = () => {
        if (!modalContainer) return;
        
        const overlay = modalContainer.querySelector('.modal-overlay');
        overlay.classList.remove('active');
        setTimeout(() => {
            modalContainer.style.display = 'none';
        }, 300);
    };
    
    // Alert弹窗
    const alert = (message, title = '提示') => {
        return new Promise((resolve) => {
            showModal(title, message, [
                {
                    text: '确定',
                    className: 'modal-btn-primary',
                    callback: resolve
                }
            ], resolve);
        });
    };
    
    // Confirm弹窗
    const confirm = (message, title = '确认') => {
        return new Promise((resolve) => {
            showModal(title, message, [
                {
                    text: '取消',
                    className: 'modal-btn-secondary',
                    callback: () => resolve(false)
                },
                {
                    text: '确定',
                    className: 'modal-btn-primary',
                    callback: () => resolve(true)
                }
            ], () => resolve(false));
        });
    };
    
    return { alert, confirm };
})();

export default Modal;
