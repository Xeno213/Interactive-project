let categories = [];
let tasks = [];
let editTaskIndex = null;
let deleteCategoryIndex = null;

window.onload = function() {
    updateAnalytics();
};

function addCategory() {
    const categoryInput = document.getElementById('categoryInput');
    const categoryName = categoryInput.value.trim();
    if (categoryName && !categories.includes(categoryName)) {
        categories.push(categoryName);
        updateCategoryList();
        updateCategorySelect();
        categoryInput.value = '';
    }
}

function updateCategoryList() {
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = '';
    categories.forEach((category, index) => {
        const div = document.createElement('div');
        div.classList.add('category-item');
        div.innerHTML = `${category} <button class="delete-btn" onclick="deleteCategory(${index})">DELETE</button>`;
        categoryList.appendChild(div);
    });
}

function deleteCategory(index) {
    const categoryToDelete = categories[index];
    const confirmDelete = confirm(`Are you sure you want to delete the category "${categoryToDelete}"?`);

    if (confirmDelete) {
        categories.splice(index, 1);
        updateCategoryList();
        updateCategorySelect();
        alert(`Category "${categoryToDelete}" deleted successfully!`);
    }
}

function updateCategorySelect() {
    const categorySelects = [document.getElementById('taskCategorySelect'), document.getElementById('editTaskCategorySelect')];
    categorySelects.forEach(select => {
        select.innerHTML = '<option value="" disabled selected>Category</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    });
}

function addTask() {
    const taskNameInput = document.getElementById('taskNameInput');
    const taskDateInput = document.getElementById('taskDateInput');
    const taskCategorySelect = document.getElementById('taskCategorySelect');
    const taskName = taskNameInput.value.trim();
    const taskDate = taskDateInput.value;
    const taskCategory = taskCategorySelect.value;
    if (taskName && taskCategory) {
        const task = {
            name: taskName,
            date: taskDate,
            category: taskCategory,
            completed: false
        };
        tasks.push(task);
        updateTaskList();
        updateAnalytics();
        taskNameInput.value = '';
        taskDateInput.value = '';
        taskCategorySelect.value = '';
        showPopupNotification(`Task "${task.name}" added successfully!`);
    }
}

function showPopupNotification(message) {
    const popup = document.createElement('div');
    popup.classList.add('popup-notification');
    popup.textContent = message;
    document.body.appendChild(popup);
    setTimeout(() => {
        popup.remove();
    }, 3000);
}

function updateTaskList() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        const div = document.createElement('div');
        div.classList.add('task-item');
        div.style.backgroundColor = task.completed ? 'rgb(255, 109, 116)' : '';
        div.innerHTML = `
            <div style="${task.completed ? 'text-decoration: line-through; color: white;' : ''}">
                <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="toggleTaskCompletion(${index})">
                ${task.name} - ${task.category} ${task.date ? `Due: ${task.date}` : ''}
            </div>
            <button class="edit-btn" onclick="openEditModal(${index})" ${task.completed ? 'disabled' : ''}>EDIT</button>
        `;
        taskList.appendChild(div);
    });
}

function toggleTaskCompletion(index) {
    tasks[index].completed = !tasks[index].completed;
    updateTaskList();
    updateAnalytics();
}

function openEditModal(index) {
    editTaskIndex = index;
    const task = tasks[index];
    document.getElementById('editTaskNameInput').value = task.name;
    document.getElementById('editTaskDateInput').value = task.date;
    document.getElementById('editTaskCategorySelect').value = task.category;
    document.getElementById('editTaskModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editTaskModal').style.display = 'none';
}

function confirmEditTask() {
    if (confirm("Are you sure you want to update this task?")) {
        saveEditedTask();
        closeEditModal();
    }
}

function saveEditedTask() {
    if (editTaskIndex !== null) {
        const taskName = document.getElementById('editTaskNameInput').value.trim();
        const taskDate = document.getElementById('editTaskDateInput').value;
        const taskCategory = document.getElementById('editTaskCategorySelect').value;
        tasks[editTaskIndex] = { 
            ...tasks[editTaskIndex],
            name: taskName,
            date: taskDate,
            category: taskCategory
        };
        updateTaskList();
        updateAnalytics();
        editTaskIndex = null;
    }
}

function updateAnalytics() {
    const analyticsProgress = document.getElementById('analyticsProgress');
    analyticsProgress.innerHTML = '';

    const categoryStats = {};
    
    if (tasks.length === 0) {
        categoryStats['No tasks'] = { total: 0, completed: 0 };
    } else {
        tasks.forEach(task => {
            if (!categoryStats[task.category]) {
                categoryStats[task.category] = { total: 0, completed: 0 };
            }
            categoryStats[task.category].total += 1;
            if (task.completed) {
                categoryStats[task.category].completed += 1;
            }
        });
    }

    Object.keys(categoryStats).forEach(category => {
        const { total, completed } = categoryStats[category];
        const percentage = total ? Math.round((completed / total) * 100) : 0;
        const div = document.createElement('div');
        div.classList.add('progress-bar-container');
        div.innerHTML = `
            <span>${category} (${percentage}%)</span>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%;"></div>
            </div>
        `;
        analyticsProgress.appendChild(div);
    });

    updateChart(categoryStats);
}

let completionChart = null;

function updateChart(categoryStats) {
    const categories = Object.keys(categoryStats);
    const completionRates = categories.map(category => {
        const { total, completed } = categoryStats[category];
        return total ? Math.round((completed / total) * 100) : 0;
    });

    const overallTotal = tasks.length;
    const overallCompleted = tasks.filter(task => task.completed).length;
    const overallRate = overallTotal ? Math.round((overallCompleted / overallTotal) * 100) : 0;
    
    if (categories.length === 0) {
        categories.push("No tasks");
        completionRates.push(0);
    }
    
    categories.unshift("Overall");
    completionRates.unshift(overallRate);

    if (completionChart) {
        completionChart.destroy();
    }

    const ctx = document.getElementById('completionChart').getContext('2d');
    completionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Completion Rate (%)',
                data: completionRates,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        values: [0, 20, 40, 60, 80, 100],
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Completion Rate (%)'
                    }
                }
            }
        }
    });
}
