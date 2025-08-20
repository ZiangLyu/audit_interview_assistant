// API 基础URL
const API_BASE_URL = 'http://localhost:8000';

// 全局变量存储处理结果
let currentResult = null;

// DOM 元素
const elements = {
    auditType: document.getElementById('auditType'),
    companyName: document.getElementById('companyName'),
    intervieweePosition: document.getElementById('intervieweePosition'),
    intervieweeName: document.getElementById('intervieweeName'),
    transcript: document.getElementById('transcript'),
    customPrompt: document.getElementById('customPrompt'),
    useCustomPrompt: document.getElementById('useCustomPrompt'),
    submitBtn: document.getElementById('submitBtn'),
    resetBtn: document.getElementById('resetBtn'),
    exportBtn: document.getElementById('exportBtn'),
    resultSection: document.getElementById('resultSection'),
    meetingMinutes: document.getElementById('meetingMinutes'),
    auditIssues: document.getElementById('auditIssues'),
    requiredMaterials: document.getElementById('requiredMaterials'),
    rawResponse: document.getElementById('rawResponse'),
    toast: document.getElementById('toast'),
    // 文件上传相关元素
    wordFile: document.getElementById('wordFile'),
    uploadPlaceholder: document.getElementById('uploadPlaceholder'),
    fileInfoDisplay: document.getElementById('fileInfoDisplay'),
    selectedFilename: document.getElementById('selectedFilename'),
    removeFile: document.getElementById('removeFile'),
    fileContentPreview: document.getElementById('fileContentPreview')
};

// 提示词模板占位符
const placeholders = {
    auditTypePreview: document.getElementById('auditTypePreview'),
    companyNamePreview: document.getElementById('companyNamePreview'),
    companyNamePreview2: document.getElementById('companyNamePreview2'),
    intervieweePositionPreview: document.getElementById('intervieweePositionPreview'),
    intervieweeNamePreview: document.getElementById('intervieweeNamePreview')
};

// 初始化事件监听器
function initializeEventListeners() {
    // 输入框实时更新提示词模板
    elements.auditType.addEventListener('input', updatePromptTemplate);
    elements.companyName.addEventListener('input', updatePromptTemplate);
    elements.intervieweePosition.addEventListener('input', updatePromptTemplate);
    elements.intervieweeName.addEventListener('input', updatePromptTemplate);

    // 自定义提示词复选框
    elements.useCustomPrompt.addEventListener('change', (e) => {
        elements.customPrompt.disabled = !e.target.checked;
        if (e.target.checked) {
            elements.customPrompt.focus();
        }
    });

    // 输入方式切换
    document.querySelectorAll('.method-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchInputMethod(e.target.dataset.method);
        });
    });

    // 文件上传相关事件
    elements.uploadPlaceholder.addEventListener('click', () => elements.wordFile.click());
    elements.wordFile.addEventListener('change', handleFileSelect);
    elements.removeFile.addEventListener('click', removeSelectedFile);
    
    // 拖拽上传
    const fileUploadArea = document.getElementById('fileUpload');
    fileUploadArea.addEventListener('dragover', handleDragOver);
    fileUploadArea.addEventListener('dragleave', handleDragLeave);
    fileUploadArea.addEventListener('drop', handleDrop);

    // 提交按钮
    elements.submitBtn.addEventListener('click', handleSubmit);

    // 重置按钮
    elements.resetBtn.addEventListener('click', handleReset);

    // 导出按钮
    elements.exportBtn.addEventListener('click', handleExport);

    // Tab 切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });
}

// 切换输入方式
function switchInputMethod(method) {
    // 更新标签状态
    document.querySelectorAll('.method-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.method === method);
    });

    // 更新内容显示
    document.querySelectorAll('.input-method-content').forEach(content => {
        content.classList.remove('active');
    });

    if (method === 'manual') {
        document.getElementById('manualInput').classList.add('active');
    } else if (method === 'upload') {
        document.getElementById('fileUpload').classList.add('active');
    }
}

// 处理文件选择
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        await processSelectedFile(file);
    }
}

// 处理拖拽上传
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')) {
            processSelectedFile(file);
        } else {
            showToast('请选择Word文档文件（.docx或.doc格式）', 'error');
        }
    }
}

// 处理选中的文件
async function processSelectedFile(file) {
    try {
        // 显示加载状态
        elements.uploadPlaceholder.innerHTML = '<div class="loader"></div><p>正在读取文件...</p>';
        
        // 创建FormData
        const formData = new FormData();
        formData.append('file', file);
        
        // 上传文件到后端
        const response = await fetch(`${API_BASE_URL}/api/upload-word`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`上传失败: ${response.status}`);
        }
        
        const result = await response.json();
        
        // 显示文件信息
        displayFileInfo(file.name, result.content);
        
        // 自动切换到手动输入模式并填充内容
        switchInputMethod('manual');
        elements.transcript.value = result.content;
        
        showToast('Word文档读取成功！', 'success');
        
    } catch (error) {
        console.error('File processing error:', error);
        showToast('文件处理失败: ' + error.message, 'error');
        
        // 恢复上传区域
        resetUploadArea();
    }
}

// 显示文件信息
function displayFileInfo(filename, content) {
    elements.selectedFilename.textContent = filename;
    elements.fileContentPreview.textContent = content.substring(0, 200) + (content.length > 200 ? '...' : '');
    
    elements.uploadPlaceholder.style.display = 'none';
    elements.fileInfoDisplay.style.display = 'block';
}

// 移除选中的文件
function removeSelectedFile() {
    elements.wordFile.value = '';
    resetUploadArea();
}

// 重置上传区域
function resetUploadArea() {
    elements.uploadPlaceholder.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <p>点击选择文件或拖拽文件到此处</p>
        <p class="file-info">支持 .docx 和 .doc 格式</p>
    `;
    elements.uploadPlaceholder.style.display = 'block';
    elements.fileInfoDisplay.style.display = 'none';
}

// 更新提示词模板预览
function updatePromptTemplate() {
    const values = {
        auditType: elements.auditType.value || 'XX',
        companyName: elements.companyName.value || 'XX公司',
        intervieweePosition: elements.intervieweePosition.value || 'XX岗位',
        intervieweeName: elements.intervieweeName.value || 'XX'
    };

    placeholders.auditTypePreview.textContent = values.auditType;
    placeholders.companyNamePreview.textContent = values.companyName;
    placeholders.companyNamePreview2.textContent = values.companyName;
    placeholders.intervieweePositionPreview.textContent = values.intervieweePosition;
    placeholders.intervieweeNamePreview.textContent = values.intervieweeName;

    // 更新占位符样式
    Object.values(placeholders).forEach(placeholder => {
        if (placeholder.textContent !== 'XX' && 
            placeholder.textContent !== 'XX公司' && 
            placeholder.textContent !== 'XX岗位') {
            placeholder.classList.add('filled');
        } else {
            placeholder.classList.remove('filled');
        }
    });
}

// 表单验证
function validateForm() {
    const required = [
        { field: elements.auditType, name: '审计类型' },
        { field: elements.companyName, name: '被审计单位' },
        { field: elements.intervieweePosition, name: '被访谈人岗位' },
        { field: elements.intervieweeName, name: '被访谈人姓名' },
        { field: elements.transcript, name: '访谈内容' }
    ];

    for (const item of required) {
        if (!item.field.value.trim()) {
            showToast(`请填写${item.name}`, 'error');
            item.field.focus();
            return false;
        }
    }

    return true;
}

// 处理提交
async function handleSubmit() {
    if (!validateForm()) return;

    // 禁用提交按钮
    elements.submitBtn.disabled = true;
    elements.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';

    try {
        const requestData = {
            audit_type: elements.auditType.value.trim(),
            company_name: elements.companyName.value.trim(),
            interviewee_position: elements.intervieweePosition.value.trim(),
            interviewee_name: elements.intervieweeName.value.trim(),
            transcript: elements.transcript.value.trim()
        };

        if (elements.useCustomPrompt.checked && elements.customPrompt.value.trim()) {
            requestData.custom_prompt = elements.customPrompt.value.trim();
        }

        const response = await fetch(`${API_BASE_URL}/api/process-interview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`请求失败: ${response.status}`);
        }

        const result = await response.json();
        currentResult = { ...result, ...requestData };
        
        displayResults(result);
        showToast('访谈记录处理成功！', 'success');
        
        // 滚动到结果区域
        elements.resultSection.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error:', error);
        showToast('处理失败: ' + error.message, 'error');
    } finally {
        // 恢复提交按钮
        elements.submitBtn.disabled = false;
        elements.submitBtn.innerHTML = '<i class="fas fa-cogs"></i> 生成访谈纪要';
    }
}

// 显示处理结果
function displayResults(result) {
    // 显示结果区域
    elements.resultSection.style.display = 'block';

    // 显示会议纪要
    elements.meetingMinutes.innerHTML = marked.parse(result.meeting_minutes || '无内容');

    // 显示审计疑点
    elements.auditIssues.innerHTML = '';
    if (result.audit_issues && result.audit_issues.length > 0) {
        result.audit_issues.forEach(issue => {
            const li = document.createElement('li');
            li.textContent = issue;
            elements.auditIssues.appendChild(li);
        });
    } else {
        elements.auditIssues.innerHTML = '<li>暂无审计疑点</li>';
    }

    // 显示资料清单
    elements.requiredMaterials.innerHTML = '';
    if (result.required_materials && result.required_materials.length > 0) {
        result.required_materials.forEach(material => {
            const li = document.createElement('li');
            li.textContent = material;
            elements.requiredMaterials.appendChild(li);
        });
    } else {
        elements.requiredMaterials.innerHTML = '<li>暂无资料清单</li>';
    }

    // 显示原始响应
    elements.rawResponse.textContent = result.raw_response || '';

    // 默认显示会议纪要标签
    switchTab('minutes');
}

// 切换标签
function switchTab(tabName) {
    // 更新标签按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // 更新标签内容显示
    const tabMap = {
        'minutes': 'minutesTab',
        'issues': 'issuesTab',
        'materials': 'materialsTab',
        'raw': 'rawTab'
    };

    Object.entries(tabMap).forEach(([key, id]) => {
        const pane = document.getElementById(id);
        pane.classList.toggle('active', key === tabName);
    });
}

// 处理导出
async function handleExport() {
    if (!currentResult) {
        showToast('没有可导出的内容', 'error');
        return;
    }

    elements.exportBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/export-word`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(currentResult)
        });

        if (!response.ok) {
            throw new Error(`导出失败: ${response.status}`);
        }

        // 获取文件名
        const contentDisposition = response.headers.get('content-disposition');
        const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
        const filename = filenameMatch ? filenameMatch[1] : 'audit_interview.docx';

        // 下载文件
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast('Word文档导出成功！', 'success');

    } catch (error) {
        console.error('Export error:', error);
        showToast('导出失败: ' + error.message, 'error');
    } finally {
        elements.exportBtn.disabled = false;
    }
}

// 重置表单
function handleReset() {
    if (confirm('确定要重置所有内容吗？')) {
        // 清空表单
        elements.auditType.value = '';
        elements.companyName.value = '';
        elements.intervieweePosition.value = '';
        elements.intervieweeName.value = '';
        elements.transcript.value = '';
        elements.customPrompt.value = '';
        elements.useCustomPrompt.checked = false;
        elements.customPrompt.disabled = true;

        // 重置文件上传
        elements.wordFile.value = '';
        resetUploadArea();
        
        // 切换到手动输入模式
        switchInputMethod('manual');

        // 隐藏结果区域
        elements.resultSection.style.display = 'none';
        
        // 清空结果
        currentResult = null;

        // 更新提示词模板
        updatePromptTemplate();

        showToast('表单已重置', 'success');
    }
}

// 显示提示消息
function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.add('show');

    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// 加载 marked.js 用于解析 Markdown
function loadMarked() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    script.onload = () => {
        console.log('Marked.js loaded');
    };
    document.head.appendChild(script);
}

// 初始化应用
function initialize() {
    loadMarked();
    initializeEventListeners();
    updatePromptTemplate();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initialize);