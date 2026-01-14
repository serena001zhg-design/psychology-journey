// API 基础地址 - 部署后改成你的 Render 地址
const API_BASE = 'https://psychology-journey-api.onrender.com/api';
// 状态
let folders = [];
let notes = [];
let currentFolderId = null;
let currentNoteId = null;

// DOM 元素
const folderList = document.getElementById('folderList');
const noteList = document.getElementById('noteList');
const currentFolderName = document.getElementById('currentFolderName');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const newFolderBtn = document.getElementById('newFolderBtn');
const newNoteBtn = document.getElementById('newNoteBtn');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const deleteNoteBtn = document.getElementById('deleteNoteBtn');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadFolders();
    bindEvents();
});

// 绑定事件
function bindEvents() {
    newFolderBtn.addEventListener('click', createFolder);
    newNoteBtn.addEventListener('click', createNote);
    saveNoteBtn.addEventListener('click', saveNote);
    deleteNoteBtn.addEventListener('click', deleteNote);
}

// 加载文件夹
async function loadFolders() {
    try {
        const response = await fetch(`${API_BASE}/folders`);
        folders = await response.json();
        renderFolders();
    } catch (error) {
        console.error('加载分类失败:', error);
    }
}

// 渲染文件夹
function renderFolders() {
    folderList.innerHTML = folders.map(folder => `
        <div class="folder-item ${folder._id === currentFolderId ? 'active' : ''}" 
             onclick="selectFolder('${folder._id}', '${folder.name}')">
            <span class="folder-name">📁 ${folder.name}</span>
            <span class="folder-count">${folder.noteCount || 0}</span>
        </div>
    `).join('');
}

// 选择文件夹
async function selectFolder(folderId, folderName) {
    currentFolderId = folderId;
    currentFolderName.textContent = folderName;
    renderFolders();
    
    try {
        const response = await fetch(`${API_BASE}/folders/${folderId}/notes`);
        notes = await response.json();
        renderNotes();
    } catch (error) {
        console.error('加载笔记失败:', error);
    }
}

// 渲染笔记列表
function renderNotes() {
    if (notes.length === 0) {
        noteList.innerHTML = '<p style="padding: 20px; color: #999;">暂无笔记</p>';
        return;
    }
    
    noteList.innerHTML = notes.map(note => `
        <div class="note-item ${note._id === currentNoteId ? 'active' : ''}" 
             onclick="selectNote('${note._id}')">
            <div class="note-item-title">${note.title || '无标题'}</div>
            <div class="note-item-preview">${note.content ? note.content.substring(0, 50) : '无内容'}...</div>
            <div class="note-item-date">${new Date(note.updatedAt).toLocaleString('zh-CN')}</div>
        </div>
    `).join('');
}

// 选择笔记
function selectNote(noteId) {
    currentNoteId = noteId;
    const note = notes.find(n => n._id === noteId);
    if (note) {
        noteTitle.value = note.title || '';
        noteContent.value = note.content || '';
    }
    renderNotes();
}

// 创建文件夹
async function createFolder() {
    const name = prompt('请输入分类名称：');
    if (!name) return;
    
    try {
        const response = await fetch(`${API_BASE}/folders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const newFolder = await response.json();
        folders.push(newFolder);
        renderFolders();
    } catch (error) {
        console.error('创建分类失败:', error);
    }
}

// 创建笔记
async function createNote() {
    if (!currentFolderId) {
        alert('请先选择一个分类');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: '新笔记',
                content: '',
                folderId: currentFolderId
            })
        });
        const newNote = await response.json();
        notes.unshift(newNote);
        selectNote(newNote._id);
        renderNotes();
        loadFolders();
    } catch (error) {
        console.error('创建笔记失败:', error);
    }
}

// 保存笔记
async function saveNote() {
    if (!currentNoteId) {
        alert('请先选择一个笔记');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/notes/${currentNoteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: noteTitle.value,
                content: noteContent.value
            })
        });
        const updatedNote = await response.json();
        const index = notes.findIndex(n => n._id === currentNoteId);
        if (index !== -1) {
            notes[index] = updatedNote;
        }
        renderNotes();
        alert('保存成功！');
    } catch (error) {
        console.error('保存失败:', error);
    }
}

// 删除笔记
async function deleteNote() {
    if (!currentNoteId) {
        alert('请先选择一个笔记');
        return;
    }
    
    if (!confirm('确定要删除这篇笔记吗？')) return;
    
    try {
        await fetch(`${API_BASE}/notes/${currentNoteId}`, {
            method: 'DELETE'
        });
        notes = notes.filter(n => n._id !== currentNoteId);
        currentNoteId = null;
        noteTitle.value = '';
        noteContent.value = '';
        renderNotes();
        loadFolders();
    } catch (error) {
        console.error('删除失败:', error);
    }
}
