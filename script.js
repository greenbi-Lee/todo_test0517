// ==========================================
// DOM 요소 선택 (웹 페이지의 HTML 요소를 찾아옴)
// ==========================================
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const itemsLeftText = document.getElementById('items-left');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIcon = themeToggleBtn.querySelector('i');

// ==========================================
// 애플리케이션 상태 관리 변수
// ==========================================
// 로컬 스토리지(Local Storage, 브라우저가 제공하는 간이 데이터 저장소)에서 기존 할 일을 가져오거나, 없으면 빈 배열로 시작합니다.
let todos = JSON.parse(localStorage.getItem('todos')) || [];

// ==========================================
// 할 일(To-Do) 제어 함수 정의
// ==========================================

// 1. 화면에 할 일 리스트를 그려주는 렌더링(Rendering, 화면 표시) 함수
function renderTodos() {
    // 이전 리스트를 깨끗하게 비웁니다.
    todoList.innerHTML = '';

    // todos 배열에 담긴 할 일 객체들을 돌면서 HTML 요소를 생성합니다.
    todos.forEach(todo => {
        // li (목록 항목) 태그 생성
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', todo.id);

        // li 태그 내부 구성
        li.innerHTML = `
            <div class="todo-content">
                <div class="custom-checkbox">
                    ${todo.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <span class="todo-text">${escapeHtml(todo.text)}</span>
            </div>
            <button class="delete-btn" aria-label="할 일 삭제">
                <i class="far fa-trash-alt"></i>
            </button>
        `;

        // 완료 토글(반전) 이벤트 리스너(사건 감지기) 연결
        const contentDiv = li.querySelector('.todo-content');
        contentDiv.addEventListener('click', () => toggleTodo(todo.id));

        // 삭제 이벤트 리스너(사건 감지기) 연결
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // 부모 요소인 li의 클릭 이벤트가 발생하는 것을 방지 (버블링 전파 차단)
            deleteTodo(todo.id);
        });

        // 최종적으로 ul 태그(todoList) 자식으로 추가
        todoList.appendChild(li);
    });

    // 화면 하단의 통계 및 미완료 할 일 갯수를 갱신합니다.
    updateStats();
    // 최신 상태를 브라우저 저장소에 저장합니다.
    saveToLocalStorage();
}

// 2. 새로운 할 일을 추가하는 함수
function addTodo(text) {
    if (text.trim() === '') return; // 공백만 입력되었을 경우 무시

    const newTodo = {
        id: Date.now(), // 고유한 ID 식별자로 현재 시간을 밀리초 단위로 사용
        text: text,
        completed: false // 기본값은 완료되지 않은 상태
    };

    todos.push(newTodo); // 배열 맨 뒤에 추가
    renderTodos(); // 화면 다시 그리기
}

// 3. 할 일 완료 상태를 토글(참/거짓 변경)하는 함수
function toggleTodo(id) {
    todos = todos.map(todo => {
        if (todo.id === id) {
            return { ...todo, completed: !todo.completed };
        }
        return todo;
    });
    renderTodos();
}

// 4. 할 일을 목록에서 삭제하는 함수
function deleteTodo(id) {
    // 클릭된 요소를 바로 부드럽게 사라지는 효과를 주고 싶을 때 사용
    const itemElement = todoList.querySelector(`[data-id="${id}"]`);
    if (itemElement) {
        itemElement.style.opacity = '0';
        itemElement.style.transform = 'translateY(10px)';
        // 0.25초 애니메이션이 끝난 후 배열 필터링 및 리렌더링 진행
        setTimeout(() => {
            todos = todos.filter(todo => todo.id !== id);
            renderTodos();
        }, 250);
    } else {
        todos = todos.filter(todo => todo.id !== id);
        renderTodos();
    }
}

// 5. 하단 통계(남은 할 일 개수 등) 갱신 함수
function updateStats() {
    const uncompletedCount = todos.filter(todo => !todo.completed).length;
    itemsLeftText.textContent = `완료되지 않은 항목: ${uncompletedCount}개`;
}

// 6. 브라우저 저장소(LocalStorage) 저장 함수
function saveToLocalStorage() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// 7. XSS(Cross-Site Scripting, 악성 스크립트 주입 공격) 방지를 위해 텍스트 이스케이프 처리 함수
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// ==========================================
// 이벤트 핸들러(Event Handlers, 사용자 상호작용 연결)
// ==========================================

// 폼 서브밋(Submit, 전송) 이벤트 처리
todoForm.addEventListener('submit', (event) => {
    event.preventDefault(); // 페이지가 새로고침되는 브라우저 기본 동작 방지
    const text = todoInput.value;
    addTodo(text);
    todoInput.value = ''; // 입력창 초기화
    todoInput.focus(); // 입력창으로 마우스 포커스 이동
});

// 완료된 할 일 일괄 삭제 버튼 이벤트 처리
clearCompletedBtn.addEventListener('click', () => {
    // 완료되지 않은 할 일만 필터링해서 남깁니다.
    const completedExist = todos.some(todo => todo.completed);
    if (!completedExist) return; // 완료된 항목이 없으면 작동하지 않음

    todos = todos.filter(todo => !todo.completed);
    renderTodos();
});

// ==========================================
// 다크모드 / 라이트모드 토글 설정
// ==========================================
// 사용자가 이전에 선택한 테마를 브라우저 저장소에서 읽어오거나 기본 테마로 시작합니다.
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // HTML 루트 요소에 새로운 테마 속성값 할당
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme); // 바뀐 테마 설정을 브라우저 저장소에 기억시킴
    updateThemeIcon(newTheme);
});

// 테마에 따른 달/해 아이콘 모양 갱신 함수
function updateThemeIcon(theme) {
    if (theme === 'dark') {
        themeIcon.className = 'fas fa-sun'; // 다크모드일 때는 해 아이콘으로 변경
        themeIcon.style.color = '#f59e0b'; // 노란색 해 빛깔 지정
    } else {
        themeIcon.className = 'fas fa-moon'; // 라이트모드일 때는 달 아이콘으로 변경
        themeIcon.style.color = ''; // 기본 스타일 컬러 사용
    }
}

// ==========================================
// 앱 최초 실행 시 렌더링 호출
// ==========================================
renderTodos();
