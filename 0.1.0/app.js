// ============================================================
// ЛР1, Варіант 10: Кабінет студента — PersonalNotes
// ============================================================

// ===== STATE =====
const STORAGE_KEY = "lr1_v10_notes";

let notes = [];       // масив усіх нотаток
let nextId = 1;       // лічильник id
let editingId = null; // id нотатки, яку зараз редагуємо (null = режим додавання)

// ===== ІНІЦІАЛІЗАЦІЯ (DOM-елементи) =====
const noteForm        = document.getElementById("noteForm");
const courseSelect    = document.getElementById("courseSelect");
const titleInput      = document.getElementById("titleInput");
const noteInput       = document.getElementById("noteInput");
const submitBtn       = document.getElementById("submitBtn");
const cancelBtn       = document.getElementById("cancelBtn");
const resetBtn        = document.getElementById("resetBtn");
const formTitle       = document.getElementById("form-title");

const searchInput     = document.getElementById("searchInput");
const filterCourse    = document.getElementById("filterCourse");
const sortSelect      = document.getElementById("sortSelect");

const notesTable      = document.getElementById("notesTable");
const notesTableBody  = document.getElementById("notesTableBody");
const emptyState      = document.getElementById("emptyState");
const countBadge      = document.getElementById("countBadge");

// ===== ЗАВАНТАЖЕННЯ З localStorage =====
function loadFromStorage() {
  const json = localStorage.getItem(STORAGE_KEY);
  if (json === null) return [];
  try {
    const data = JSON.parse(json);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function computeNextId() {
  if (notes.length === 0) return 1;
  return Math.max(...notes.map(n => n.id)) + 1;
}

// ===== ЧИТАННЯ ФОРМИ =====
function readForm() {
  return {
    course: courseSelect.value,
    title:  titleInput.value,
    note:   noteInput.value,
  };
}

// ===== ВАЛІДАЦІЯ =====
function showError(inputId, errorId, message) {
  document.getElementById(inputId).classList.add("invalid");
  document.getElementById(errorId).textContent = message;
}

function clearError(inputId, errorId) {
  document.getElementById(inputId).classList.remove("invalid");
  document.getElementById(errorId).textContent = "";
}

function clearErrors() {
  clearError("courseSelect", "courseError");
  clearError("titleInput",   "titleError");
  clearError("noteInput",    "noteError");
}

function validate(dto) {
  clearErrors();
  let isValid = true;

  // Дисципліна — обрати зі списку
  if (dto.course === "") {
    showError("courseSelect", "courseError", "Оберіть дисципліну зі списку.");
    isValid = false;
  }

  // Заголовок — обов'язковий, 3–100 символів
  const title = dto.title.trim();
  if (title === "") {
    showError("titleInput", "titleError", "Заголовок є обов'язковим.");
    isValid = false;
  } else if (title.length < 3) {
    showError("titleInput", "titleError", "Заголовок має бути не коротшим за 3 символи.");
    isValid = false;
  } else if (title.length > 100) {
    showError("titleInput", "titleError", "Заголовок не може перевищувати 100 символів.");
    isValid = false;
  }

  // Нотатка — обов'язкова, мінімум 5 символів
  const note = dto.note.trim();
  if (note === "") {
    showError("noteInput", "noteError", "Текст нотатки є обов'язковим.");
    isValid = false;
  } else if (note.length < 5) {
    showError("noteInput", "noteError", "Нотатка має містити щонайменше 5 символів.");
    isValid = false;
  }

  return isValid;
}

// ===== ДОДАВАННЯ НОТАТКИ =====
function addNote(dto) {
  const note = {
    id:        nextId,
    course:    dto.course,
    title:     dto.title.trim(),
    note:      dto.note.trim(),
    createdAt: new Date().toLocaleString("uk-UA"),
  };
  notes.push(note);
  nextId++;
}

// ===== ВИДАЛЕННЯ НОТАТКИ =====
function deleteNoteById(id) {
  notes = notes.filter(n => n.id !== id);
}

// ===== РЕДАГУВАННЯ: заповнити форму =====
function startEdit(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;

  editingId = id;
  courseSelect.value  = note.course;
  titleInput.value    = note.title;
  noteInput.value     = note.note;

  formTitle.textContent   = "Редагувати нотатку";
  submitBtn.textContent   = "Зберегти";
  cancelBtn.classList.remove("hidden");

  // Прокрутити до форми
  document.getElementById("create-section").scrollIntoView({ behavior: "smooth" });
}

// ===== ЗБЕРЕЖЕННЯ ПІСЛЯ РЕДАГУВАННЯ =====
function saveEdit(dto) {
  const note = notes.find(n => n.id === editingId);
  if (!note) return;

  note.course = dto.course;
  note.title  = dto.title.trim();
  note.note   = dto.note.trim();
}

// ===== СКИДАННЯ ФОРМИ =====
function resetForm() {
  noteForm.reset();
  clearErrors();
  editingId = null;
  formTitle.textContent  = "Додати нотатку";
  submitBtn.textContent  = "Додати";
  cancelBtn.classList.add("hidden");
}

// ===== ОТРИМАТИ ВІДФІЛЬТРОВАНИЙ І ВІДСОРТОВАНИЙ МАСИВ =====
function getFilteredNotes() {
  const searchText    = searchInput.value.trim().toLowerCase();
  const courseFilter  = filterCourse.value;
  const sort          = sortSelect.value;

  let result = notes.filter(n => {
    const matchSearch = searchText === "" ||
      n.title.toLowerCase().includes(searchText);
    const matchCourse = courseFilter === "" || n.course === courseFilter;
    return matchSearch && matchCourse;
  });

  if (sort === "newest") {
    result = result.slice().reverse();
  } else if (sort === "oldest") {
    // вже в порядку вставки
  } else if (sort === "title") {
    result = result.slice().sort((a, b) => a.title.localeCompare(b.title, "uk"));
  } else if (sort === "course") {
    result = result.slice().sort((a, b) => a.course.localeCompare(b.course, "uk"));
  }

  return result;
}

// ===== РЕНДЕР ТАБЛИЦІ =====
function render() {
  const filtered = getFilteredNotes();

  // Оновити лічильник
  countBadge.textContent = notes.length;

  if (notes.length === 0) {
    emptyState.textContent = "Нотаток ще немає. Додайте першу!";
    emptyState.classList.remove("hidden");
    notesTable.classList.add("hidden");
    return;
  }

  if (filtered.length === 0) {
    emptyState.textContent = "Жодної нотатки не знайдено за заданими фільтрами.";
    emptyState.classList.remove("hidden");
    notesTable.classList.add("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  notesTable.classList.remove("hidden");

  const rowsHtml = filtered.map((note, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(note.course)}</td>
      <td>${escapeHtml(note.title)}</td>
      <td class="note-cell"><div class="note-preview">${escapeHtml(note.note)}</div></td>
      <td style="white-space:nowrap;">${note.createdAt}</td>
      <td style="white-space:nowrap;">
        <button type="button" class="btn-edit" data-id="${note.id}">✏️ Ред.</button>
        <button type="button" class="btn-delete" data-id="${note.id}">🗑 Видалити</button>
      </td>
    </tr>
  `).join("");

  notesTableBody.innerHTML = rowsHtml;
}

// Безпечне відображення тексту (щоб спецсимволи HTML не ламали верстку)
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ===== ОБРОБНИКИ ПОДІЙ =====

// Сабміт форми
noteForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const dto = readForm();
  const isValid = validate(dto);
  if (!isValid) return;

  if (editingId !== null) {
    saveEdit(dto);
  } else {
    addNote(dto);
  }

  saveToStorage();
  render();
  resetForm();
});

// Кнопка «Очистити»
resetBtn.addEventListener("click", () => {
  resetForm();
});

// Кнопка «Скасувати» (під час редагування)
cancelBtn.addEventListener("click", () => {
  resetForm();
});

// Делегування подій для кнопок у таблиці (Редагувати / Видалити)
notesTableBody.addEventListener("click", (event) => {
  const target = event.target;

  if (target.classList.contains("btn-delete")) {
    const id = Number(target.dataset.id);
    deleteNoteById(id);
    saveToStorage();
    render();
    return;
  }

  if (target.classList.contains("btn-edit")) {
    const id = Number(target.dataset.id);
    startEdit(id);
    return;
  }
});

// Пошук і фільтри — перерендер при кожній зміні
searchInput.addEventListener("input", render);
filterCourse.addEventListener("change", render);
sortSelect.addEventListener("change", render);

// ===== ТОЧКА ВХОДУ =====
notes  = loadFromStorage();
nextId = computeNextId();
render();
