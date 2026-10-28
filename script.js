
const $ = (selector) => document.querySelector(selector);

const STORAGE_KEY = "studybloom_data_v1";

function loadData() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

let data = loadData();

data.profile ||= {};
data.reminders ||= {};
data.tasks ||= {};
data.notes ||= {};
data.reviews ||= {};

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        alert("Your browser could not save the changes. Please check your browser storage.");
    }
}

function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(date) {
    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Today's heading and date

function updateToday() {
    const today = new Date();
    const hour = today.getHours();

    let greeting = "Make today lovely.";

    if (hour < 12) greeting = "Good morning, beautiful.";
    else if (hour < 17) greeting = "Good afternoon, beautiful.";
    else greeting = "Good evening, beautiful.";

    $("#greetingTitle").textContent = greeting;
    $("#dateSubtitle").textContent =
        today.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long"
        }) + " · One day at a time, one dream at a time.";

    $("#todayChip").textContent = today.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// Profile

function renderProfile() {
    const profile = data.profile;

    $("#profileName").value = profile.name || "";
    $("#profileAbout").value = profile.about || "";
    $("#profileGoal").value = profile.goal || "";

    const name = profile.name?.trim();

    $(".profile-label strong").textContent =
        name ? name : "My profile";

    $(".profile-label small").textContent =
        profile.goal?.trim() || "A little about me";

    $(".avatar").textContent =
        name ? name.charAt(0).toUpperCase() : "P";
}

$("#profileButton").addEventListener("click", () => {
    $("#profilePanel").classList.toggle("hidden");
});

$("#closeProfile").addEventListener("click", () => {
    $("#profilePanel").classList.add("hidden");
});

$("#saveProfile").addEventListener("click", () => {
    data.profile = {
        name: $("#profileName").value.trim(),
        about: $("#profileAbout").value.trim(),
        goal: $("#profileGoal").value.trim()
    };

    saveData();
    renderProfile();
    $("#profilePanel").classList.add("hidden");
});

// Important reminders

function renderReminders() {
    const reminders = data.reminders[localDateKey()] || [];
    const list = $("#reminderList");

    list.innerHTML = reminders.map((reminder, index) => `
        <li>
            <span class="reminder-bullet">♡</span>
            <span>${escapeHTML(reminder)}</span>
            <button class="remove-button"
                    data-remove-reminder="${index}"
                    aria-label="Remove reminder">×</button>
        </li>
    `).join("");

    $("#reminderEmpty").classList.toggle("hidden", reminders.length > 0);
}

$("#reminderForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const input = $("#reminderInput");
    const value = input.value.trim();

    if (!value) return;

    const key = localDateKey();
    data.reminders[key] ||= [];
    data.reminders[key].push(value);

    saveData();
    renderReminders();

    input.value = "";
    input.focus();
});

$("#reminderList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-reminder]");
    if (!button) return;

    const index = Number(button.dataset.removeReminder);
    const reminders = data.reminders[localDateKey()] || [];

    reminders.splice(index, 1);

    saveData();
    renderReminders();
});

// Today's tasks

function getTodayTasks() {
    return data.tasks[localDateKey()] || [];
}

function renderTasks() {
    const tasks = getTodayTasks();
    const completed = tasks.filter(task => task.done).length;
    const percentage = tasks.length
        ? Math.round((completed / tasks.length) * 100)
        : 0;

    $("#taskCount").textContent =
        `${completed} of ${tasks.length} tasks completed`;

    $("#progressPercent").textContent = `${percentage}%`;
    $("#progressFill").style.width = `${percentage}%`;

    $("#taskList").innerHTML = tasks.map((task, index) => `
        <div class="task-item ${task.done ? "completed" : ""}">
            <input type="checkbox"
                   data-task-check="${index}"
                   aria-label="Mark ${escapeHTML(task.title)} as complete"
                   ${task.done ? "checked" : ""}>

            <span class="task-title">${escapeHTML(task.title)}</span>

            <button class="remove-button"
                    data-task-remove="${index}"
                    aria-label="Delete task">×</button>
        </div>
    `).join("");

    $("#taskEmpty").classList.toggle("hidden", tasks.length > 0);
}

$("#taskForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const input = $("#taskInput");
    const title = input.value.trim();

    if (!title) return;

    const key = localDateKey();
    data.tasks[key] ||= [];
    data.tasks[key].push({
        title,
        done: false
    });

    saveData();
    renderTasks();

    input.value = "";
    input.focus();
});

$("#taskList").addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-task-check]");
    if (!checkbox) return;

    const tasks = getTodayTasks();
    const index = Number(checkbox.dataset.taskCheck);

    if (!tasks[index]) return;

    tasks[index].done = checkbox.checked;

    saveData();
    renderTasks();
});

$("#taskList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-task-remove]");
    if (!button) return;

    const index = Number(button.dataset.taskRemove);
    const tasks = getTodayTasks();

    tasks.splice(index, 1);

    saveData();
    renderTasks();
});

// Calendar

let displayedMonth = new Date();
displayedMonth.setDate(1);

let selectedDate = localDateKey();

function renderCalendar() {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();

    const todayKey = localDateKey();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    $("#monthTitle").textContent =
        displayedMonth.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric"
        });

    let html = "";

    for (let i = 0; i < firstDay; i++) {
        html += `<span class="calendar-day outside" aria-hidden="true"></span>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const key = localDateKey(date);

        const isToday = key === todayKey;
        const isSelected = key === selectedDate;
        const hasNote = Boolean(data.notes[key]?.trim());

        const classes = [
            "calendar-day",
            isToday ? "today" : "",
            isSelected ? "selected" : "",
            hasNote ? "has-note" : ""
        ].filter(Boolean).join(" ");

        html += `
            <button class="${classes}"
                    data-date="${key}"
                    aria-label="${formatDate(date)}${hasNote ? ", has a note" : ""}"
                    ${isSelected ? 'aria-pressed="true"' : 'aria-pressed="false"'}>
                ${day}
            </button>
        `;
    }

    $("#calendarGrid").innerHTML = html;
    renderSelectedNote();
}

function renderSelectedNote() {
    const date = new Date(`${selectedDate}T12:00:00`);

    $("#selectedDateTitle").textContent = formatDate(date);
    $("#selectedDateHint").textContent =
        selectedDate === localDateKey()
            ? "Today is yours. Make it count. ♡"
            : "Save a little reminder for this day.";

    $("#calendarNote").value = data.notes[selectedDate] || "";
}

$("#calendarGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-date]");
    if (!button) return;

    selectedDate = button.dataset.date;
    renderCalendar();
});

$("#prevMonth").addEventListener("click", () => {
    displayedMonth = new Date(
        displayedMonth.getFullYear(),
        displayedMonth.getMonth() - 1,
        1
    );

    renderCalendar();
    renderHabits();
});

$("#nextMonth").addEventListener("click", () => {
    displayedMonth = new Date(
        displayedMonth.getFullYear(),
        displayedMonth.getMonth() + 1,
        1
    );

    renderCalendar();
    renderHabits();
});

$("#saveNote").addEventListener("click", () => {
    const note = $("#calendarNote").value.trim();

    if (note) {
        data.notes[selectedDate] = note;
    } else {
        delete data.notes[selectedDate];
    }

    saveData();
    renderCalendar();
});

$("#deleteNote").addEventListener("click", () => {
    delete data.notes[selectedDate];

    saveData();
    renderCalendar();
});

// Daily review

function renderReview() {
    const review = data.reviews[localDateKey()] || {};

    $("#dayMood").value = review.mood || "";
    $("#dayReflection").value = review.reflection || "";
    $("#dayTomorrow").value = review.tomorrow || "";
    $("#reviewStatus").textContent = review.saved
        ? "Your reflection is saved for today. ♡"
        : "";
}

$("#reviewButton").addEventListener("click", () => {
    renderReview();
    $("#reviewModal").classList.remove("hidden");
});

$("#closeReview").addEventListener("click", () => {
    $("#reviewModal").classList.add("hidden");
});

$("#reviewModal").addEventListener("click", (event) => {
    if (event.target === $("#reviewModal")) {
        $("#reviewModal").classList.add("hidden");
    }
});

$("#saveReview").addEventListener("click", () => {
    data.reviews[localDateKey()] = {
        mood: $("#dayMood").value,
        reflection: $("#dayReflection").value.trim(),
        tomorrow: $("#dayTomorrow").value.trim(),
        saved: true
    };

    saveData();

    $("#reviewStatus").textContent = "Your day, your thoughts, saved with love. ♡";
});

// Initialize the website

function initializeStudyBloom() {
    updateToday();
    renderProfile();
    renderReminders();
    renderTasks();
    renderCalendar();
}

initializeStudyBloom();

/* WATER TRACKER */

data.water ||= {};

const WATER_GOAL = 8;

function getWaterCount() {
    return data.water[localDateKey()] || 0;
}

function renderWater() {
    const count = getWaterCount();

    $("#waterCount").textContent = `${count} / ${WATER_GOAL}`;

    $("#waterGlasses").innerHTML = Array.from(
        { length: WATER_GOAL },
        (_, index) => `
            <button type="button"
                class="water-glass ${index < count ? "filled" : ""}"
                aria-label="Glass ${index + 1}${index < count ? ", completed" : ""}"
                title="Glass ${index + 1}">
                ${index < count ? "💧" : "♡"}
            </button>
        `
    ).join("");

    $("#waterMessage").textContent =
        count >= WATER_GOAL
            ? "Lovely! You've reached your personal water goal. 💗"
            : `${WATER_GOAL - count} more glasses to reach your daily goal. Take it at your own pace. ♡`;
}

$("#addWater").addEventListener("click", () => {
    data.water[localDateKey()] = Math.min(
        WATER_GOAL,
        getWaterCount() + 1
    );

    saveData();
    renderWater();
});

$("#resetWater").addEventListener("click", () => {
    data.water[localDateKey()] = 0;
    saveData();
    renderWater();
});

/* DAILY MOOD TRACKER */

data.moods ||= {};

const MOODS = {
    happy: { emoji: "😊", label: "Happy" },
    okay: { emoji: "😌", label: "Okay" },
    sad: { emoji: "😔", label: "Sad" },
    stressed: { emoji: "🥹", label: "Overwhelmed" },
    excited: { emoji: "🤩", label: "Excited" }
};

function renderMood() {
    const mood = data.moods[localDateKey()];

    document.querySelectorAll(".mood-option").forEach(button => {
        const selected = button.dataset.mood === mood;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
    });

    $("#moodFeedback").textContent = mood
        ? `Today, you feel ${MOODS[mood].label.toLowerCase()}. Thanks for checking in with yourself. ♡`
        : "Every feeling is welcome here. Choose one emoji for today. ♡";

    renderMoodStats();
}

$("#moodOptions").addEventListener("click", event => {
    const button = event.target.closest("[data-mood]");
    if (!button) return;

    data.moods[localDateKey()] = button.dataset.mood;

    saveData();
    renderMood();
    renderCalendar();
});

function renderMoodStats() {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();

    const counts = {};

    Object.entries(data.moods).forEach(([dateKey, mood]) => {
        const date = new Date(`${dateKey}T12:00:00`);

        if (
            date.getFullYear() === year &&
            date.getMonth() === month &&
            MOODS[mood]
        ) {
            counts[mood] = (counts[mood] || 0) + 1;
        }
    });

    const stats = Object.entries(MOODS)
        .filter(([mood]) => counts[mood])
        .map(([mood, details]) => `
            <div class="mood-stat">
                <span>${details.emoji}</span>
                <span>${details.label}</span>
                <strong>${counts[mood]} ${counts[mood] === 1 ? "day" : "days"}</strong>
            </div>
        `);

    $("#moodStats").innerHTML = stats.length
        ? stats.join("")
        : '<p class="muted">Your mood story for this month will appear here. ♡</p>';
}

/* CALENDAR MOOD EMOJIS */

const originalRenderCalendar = renderCalendar;

renderCalendar = function () {
    originalRenderCalendar();

    document.querySelectorAll("#calendarGrid [data-date]").forEach(button => {
        const mood = data.moods[button.dataset.date];

        if (mood && MOODS[mood]) {
            const symbol = document.createElement("span");
            symbol.className = "mood-symbol";
            symbol.textContent = MOODS[mood].emoji;
            button.appendChild(symbol);
        }
    });

    renderMoodStats();
};

/* DAILY THOUGHTS */

data.thoughts ||= {};

function renderThought() {
    $("#dailyThought").value =
        data.thoughts[localDateKey()] || "";

    $("#thoughtStatus").textContent = "";
}

$("#saveThought").addEventListener("click", () => {
    const thought = $("#dailyThought").value.trim();
    const key = localDateKey();

    if (thought) {
        data.thoughts[key] = thought;
    } else {
        delete data.thoughts[key];
    }

    saveData();
    $("#thoughtStatus").textContent =
        "Your little thoughts are saved. ♡";
});

/* SHOW OR HIDE PRIVATE JOURNAL */

const toggleThought = document.querySelector("#toggleThought");
const thoughtContent = document.querySelector("#thoughtContent");

toggleThought.addEventListener("click", () => {
    const isHidden = thoughtContent.classList.contains("hidden");

    thoughtContent.classList.toggle("hidden");

    toggleThought.textContent = isHidden
        ? "🔓 Close my private journal"
        : "🔒 Open my private journal";
});

renderThought();

/* OPTIONAL DAILY PHOTO MEMORY */

data.memories ||= {};

let pendingMemory = null;

function showMemoryPreview(imageData) {
    $("#memoryPhoto").src = imageData;
    $("#memoryPreview").classList.remove("hidden");
}

function renderMemory() {
    pendingMemory = null;

    const savedImage = data.memories[localDateKey()];

    if (savedImage) {
        showMemoryPreview(savedImage);
    } else {
        $("#memoryPreview").classList.add("hidden");
        $("#memoryPhoto").removeAttribute("src");
    }

    $("#memoryImage").value = "";
    $("#memoryStatus").textContent = "";
}

$("#memoryImage").addEventListener("change", event => {
    const file = event.target.files[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        alert("Please choose a JPG, PNG, or WebP image.");
        event.target.value = "";
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert("Please choose an image smaller than 10 MB.");
        event.target.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        const image = new Image();

        image.onload = () => {
            const maxDimension = 900;
            const scale = Math.min(
                1,
                maxDimension / Math.max(image.width, image.height)
            );

            const canvas = document.createElement("canvas");
            canvas.width = Math.round(image.width * scale);
            canvas.height = Math.round(image.height * scale);

            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0, canvas.width, canvas.height);

            pendingMemory = canvas.toDataURL("image/jpeg", 0.78);

            showMemoryPreview(pendingMemory);
            $("#memoryStatus").textContent =
                "Photo selected! Save it to keep this memory. ♡";
        };

        image.onerror = () => {
            alert("This image could not be opened. Please try another photo.");
        };

        image.src = reader.result;
    };

    reader.readAsDataURL(file);
});

$("#saveMemory").addEventListener("click", () => {
    const key = localDateKey();

    if (pendingMemory) {
        data.memories[key] = pendingMemory;
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

        $("#memoryStatus").textContent =
            data.memories[key]
                ? "A little memory saved with love. ♡"
                : "No photo selected. That's perfectly okay. ♡";
    } catch {
        alert("Your browser storage is full. Try removing an older photo.");
    }
});

$("#removeMemory").addEventListener("click", () => {
    pendingMemory = null;
    delete data.memories[localDateKey()];

    saveData();
    renderMemory();
    $("#memoryStatus").textContent = "Photo removed.";
});

/* INITIALIZE THE NEW FEATURES */

renderWater();
renderMood();
renderThought();
renderMemory();

/* DAILY INSPIRATION */

const inspirationQuotes = [
    "You don't have to have it all figured out. Just take the next little step. ♡",
    "Little progress is still progress. 🌷",
    "You deserve the same kindness you give to others. 💗",
    "Your pace is valid. Keep growing in your own time. 🌸",
    "A fresh day is another chance to begin again. ✨",
    "You are allowed to rest without feeling guilty. 🩷",
    "Believe in the little things you do every day. 🌼",
    "You are becoming the person you dream of being. ♡",
    "Done is better than perfect. Start where you are. 🌷",
    "Make room for things that make your heart happy. 💕"
];

const quoteElement = document.querySelector("#inspirationQuote");
const quoteButton = document.querySelector("#newQuoteButton");

quoteButton.addEventListener("click", () => {
    const currentQuote = quoteElement.textContent.trim();

    const availableQuotes = inspirationQuotes.filter(
        quote => quote !== currentQuote
    );

    const randomIndex = Math.floor(
        Math.random() * availableQuotes.length
    );

    quoteElement.textContent = availableQuotes[randomIndex];
});

/* HAPPINESS WALL */

data.happinessWall ||= [];
let happinessImage = "";

function readFeatureImage(file, callback) {
    if (!file) {
        callback("");
        return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        alert("Please choose a JPG, PNG, or WebP image.");
        callback(null);
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Please choose an image smaller than 5 MB.");
        callback(null);
        return;
    }

    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.onerror = () => {
        alert("This image could not be read. Please try another photo.");
        callback(null);
    };
    reader.readAsDataURL(file);
}

$("#happinessImage").addEventListener("change", event => {
    readFeatureImage(event.target.files[0], imageData => {
        happinessImage = imageData || "";
    });
});

function renderHappinessWall() {
    const grid = $("#happinessGrid");
    grid.innerHTML = data.happinessWall.map(item => `
        <article class="happiness-item">
            ${item.image ? `<img src="${item.image}" alt="">` : '<div class="happiness-placeholder">♡</div>'}
            <div class="happiness-item-content">
                <h3>${escapeHTML(item.title)}</h3>
                ${item.description ? `<p>${escapeHTML(item.description)}</p>` : ""}
                <button class="remove-button" type="button" data-remove-happiness="${item.id}">Delete ×</button>
            </div>
        </article>
    `).join("");
    $("#happinessEmpty").classList.toggle("hidden", data.happinessWall.length > 0);
}

$("#happinessForm").addEventListener("submit", event => {
    event.preventDefault();
    data.happinessWall.unshift({
        id: Date.now(),
        title: $("#happinessTitle").value.trim(),
        description: $("#happinessDescription").value.trim(),
        image: happinessImage
    });
    saveData();
    renderHappinessWall();
    event.target.reset();
    happinessImage = "";
    $("#happinessStatus").textContent = "A happy little moment was added. ♡";
});

$("#happinessGrid").addEventListener("click", event => {
    const button = event.target.closest("[data-remove-happiness]");
    if (!button) return;
    data.happinessWall = data.happinessWall.filter(
        item => String(item.id) !== button.dataset.removeHappiness
    );
    saveData();
    renderHappinessWall();
});

/* STUDY FOCUS TIMER */

data.focus ||= {};
const STUDY_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
let timerSeconds = STUDY_SECONDS;
let timerMode = "study";
let timerInterval = null;

function getFocusToday() {
    const key = localDateKey();
    data.focus[key] ||= { minutes: 0, sessions: 0 };
    return data.focus[key];
}

function renderFocusTimer() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    $("#timerDisplay").textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    $("#focusMode").textContent = timerMode === "study" ? "Study time" : "Break time";

    const focus = getFocusToday();
    $("#focusMinutes").textContent = `${focus.minutes} min`;
    $("#focusSessions").textContent =
        `${focus.sessions} completed ${focus.sessions === 1 ? "session" : "sessions"}`;
}

function finishTimerPhase() {
    if (timerMode === "study") {
        const focus = getFocusToday();
        focus.minutes += 25;
        focus.sessions += 1;
        saveData();
        $("#timerStatus").textContent = "Focus session complete. Time for a little break! ♡";
        timerMode = "break";
        timerSeconds = BREAK_SECONDS;
    } else {
        $("#timerStatus").textContent = "Break complete. Ready for another little focus moment? ♡";
        timerMode = "study";
        timerSeconds = STUDY_SECONDS;
    }
    renderFocusTimer();
}

$("#startTimer").addEventListener("click", () => {
    if (timerInterval) return;
    $("#timerStatus").textContent = "";
    timerInterval = setInterval(() => {
        timerSeconds -= 1;
        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            finishTimerPhase();
            return;
        }
        renderFocusTimer();
    }, 1000);
});

$("#pauseTimer").addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
    $("#timerStatus").textContent = "Timer paused. Come back when you're ready. ♡";
});

$("#resetTimer").addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
    timerMode = "study";
    timerSeconds = STUDY_SECONDS;
    $("#timerStatus").textContent = "";
    renderFocusTimer();
});

/* HABIT TRACKER */

data.habits ||= [];

function habitCompletionStats(habit) {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const completed = Object.keys(habit.completions).filter(dateKey => {
        const date = new Date(`${dateKey}T12:00:00`);
        return date.getFullYear() === year &&
            date.getMonth() === month &&
            habit.completions[dateKey];
    }).length;
    return { completed, daysInMonth };
}

function getHabitStreak(habit) {
    let streak = 0;
    const date = new Date();
    while (habit.completions[localDateKey(date)]) {
        streak += 1;
        date.setDate(date.getDate() - 1);
    }
    return streak;
}

function renderHabits() {
    const today = localDateKey();
    $("#habitList").innerHTML = data.habits.map(habit => {
        const stats = habitCompletionStats(habit);
        const percentage = Math.round((stats.completed / stats.daysInMonth) * 100);
        return `
            <div class="habit-row">
                <label>
                    <input type="checkbox" data-habit-check="${habit.id}"
                        ${habit.completions[today] ? "checked" : ""}>
                    <span>${escapeHTML(habit.name)}</span>
                </label>
                <span class="habit-meta">${getHabitStreak(habit)} day streak · ${percentage}%</span>
                <button class="remove-button" type="button" data-remove-habit="${habit.id}">×</button>
            </div>
        `;
    }).join("");
    $("#habitEmpty").classList.toggle("hidden", data.habits.length > 0);
    renderHabitHeatmap();
}

function renderHabitHeatmap() {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    $("#habitMonthTitle").textContent = displayedMonth.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric"
    }).toUpperCase();
    $("#habitHeatmap").innerHTML = Array.from({ length: days }, (_, index) => {
        const date = new Date(year, month, index + 1);
        const key = localDateKey(date);
        const count = data.habits.filter(habit => habit.completions[key]).length;
        const level = count ? Math.min(4, Math.ceil((count / data.habits.length) * 4)) : 0;
        return `<span class="habit-day level-${level}" title="${key}: ${count} completed">${index + 1}</span>`;
    }).join("");
}

$("#habitForm").addEventListener("submit", event => {
    event.preventDefault();
    data.habits.push({
        id: Date.now(),
        name: $("#habitInput").value.trim(),
        completions: {}
    });
    saveData();
    renderHabits();
    event.target.reset();
});

$("#habitList").addEventListener("change", event => {
    const checkbox = event.target.closest("[data-habit-check]");
    if (!checkbox) return;
    const habit = data.habits.find(item => String(item.id) === checkbox.dataset.habitCheck);
    if (!habit) return;
    const key = localDateKey();
    if (checkbox.checked) habit.completions[key] = true;
    else delete habit.completions[key];
    saveData();
    renderHabits();
});

$("#habitList").addEventListener("click", event => {
    const button = event.target.closest("[data-remove-habit]");
    if (!button) return;
    data.habits = data.habits.filter(item => String(item.id) !== button.dataset.removeHabit);
    saveData();
    renderHabits();
});

/* CURRENTLY LOVING */

data.loving ||= {
    books: [], movies: [], songs: [], recipes: [], places: []
};
let activeCollection = "books";
let lovingImage = "";

$("#lovingImage").addEventListener("change", event => {
    readFeatureImage(event.target.files[0], imageData => {
        lovingImage = imageData || "";
    });
});

function renderLoving() {
    const items = data.loving[activeCollection] || [];
    $("#lovingGrid").innerHTML = items.map(item => `
        <article class="loving-item ${item.favorite ? "is-favorite" : ""}">
            ${item.image ? `<img src="${item.image}" alt="">` : '<div class="loving-placeholder">♡</div>'}
            <div class="loving-item-content">
                <h3>${escapeHTML(item.title)}</h3>
                ${item.note ? `<p>${escapeHTML(item.note)}</p>` : ""}
                <div class="loving-item-actions">
                    <button type="button" data-favorite-loving="${item.id}">
                        ${item.favorite ? "♥ Loved" : "♡ Favorite"}
                    </button>
                    <button type="button" data-complete-loving="${item.id}">
                        ${item.completed ? "✓ Completed" : "Mark complete"}
                    </button>
                    <button type="button" data-remove-loving="${item.id}">Delete</button>
                </div>
            </div>
        </article>
    `).join("");
    $("#lovingEmpty").classList.toggle("hidden", items.length > 0);
}

$("#collectionTabs").addEventListener("click", event => {
    const tab = event.target.closest("[data-collection]");
    if (!tab) return;
    activeCollection = tab.dataset.collection;
    document.querySelectorAll(".collection-tab").forEach(button => {
        button.classList.toggle("active", button === tab);
    });
    renderLoving();
});

$("#lovingForm").addEventListener("submit", event => {
    event.preventDefault();
    data.loving[activeCollection].unshift({
        id: Date.now(),
        title: $("#lovingTitle").value.trim(),
        note: $("#lovingNote").value.trim(),
        image: lovingImage,
        favorite: false,
        completed: false
    });
    saveData();
    renderLoving();
    event.target.reset();
    lovingImage = "";
});

$("#lovingGrid").addEventListener("click", event => {
    const button = event.target.closest("button[data-favorite-loving], button[data-complete-loving], button[data-remove-loving]");
    if (!button) return;
    const items = data.loving[activeCollection];
    const item = items.find(entry => String(entry.id) === (
        button.dataset.favoriteLoving ||
        button.dataset.completeLoving ||
        button.dataset.removeLoving
    ));
    if (!item) return;
    if (button.dataset.favoriteLoving) item.favorite = !item.favorite;
    else if (button.dataset.completeLoving) item.completed = !item.completed;
    else data.loving[activeCollection] = items.filter(entry => entry !== item);
    saveData();
    renderLoving();
});

/* INITIALIZE DASHBOARD ADDITIONS */

renderHappinessWall();
renderFocusTimer();
renderHabits();
renderLoving();
