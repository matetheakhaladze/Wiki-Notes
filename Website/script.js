const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultDiv = document.getElementById("result");
const saveBtn = document.getElementById("saveBtn");
const notesList = document.getElementById("notesList");
const clearNotes = document.getElementById("clearNotes");
const exportNotes = document.getElementById("exportNotes");

let currentResult = "";
let currentTitle = "";
let currentLink = "";

// ენის ამოცნობა: თუ ტექსტში ქართული ასოა → ka
function detectLanguage(text) {
  const georgianRegex = /[ა-ჰ]/;
  return georgianRegex.test(text) ? "ka" : "en";
}

// Wikipedia API search
searchBtn.addEventListener("click", async () => {
  const query = searchInput.value.trim();
  if (!query) return;

  const lang = detectLanguage(query);
  resultDiv.innerHTML = "იტვირთება...";
  saveBtn.disabled = true;

  try {
    const response = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error("ვერ მოიძებნა");

    const data = await response.json();

    currentTitle = data.title;
    currentResult = data.extract ? data.extract : "ინფორმაცია ვერ მოიძებნა.";
    currentLink = data.content_urls ? data.content_urls.desktop.page : "";

    resultDiv.innerHTML = `
      <h3>${currentTitle}</h3>
      <p>${currentResult}</p>
      ${data.thumbnail ? `<img src="${data.thumbnail.source}" alt="${data.title}">` : ""}
      ${currentLink ? `<p><a href="${currentLink}" target="_blank">👉 სრულ სტატიაზე გადასვლა</a></p>` : ""}
    `;

    saveBtn.disabled = false;
  } catch (error) {
    resultDiv.innerHTML = "შეცდომა: ინფორმაცია ვერ მოიძებნა.";
  }
});

// Save note
saveBtn.addEventListener("click", () => {
  if (currentResult) {
    const notes = JSON.parse(localStorage.getItem("notes")) || [];
    notes.push({ title: currentTitle, text: currentResult, link: currentLink });
    localStorage.setItem("notes", JSON.stringify(notes));
    renderNotes();
    saveBtn.disabled = true;
  }
});

// Render notes
function renderNotes() {
  notesList.innerHTML = "";
  const notes = JSON.parse(localStorage.getItem("notes")) || [];
  notes.forEach((note, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${note.title}</strong><br>
        <span>${note.text}</span><br>
        ${note.link ? `<a href="${note.link}" target="_blank">Wikipedia</a>` : ""}
      </div>
      <div>
        <button onclick="exportSingle(${index})">ექსპორტი</button>
        <button onclick="deleteNote(${index})">წაშლა</button>
      </div>
    `;
    notesList.appendChild(li);
  });
}

// Delete note
function deleteNote(index) {
  const notes = JSON.parse(localStorage.getItem("notes")) || [];
  notes.splice(index, 1);
  localStorage.setItem("notes", JSON.stringify(notes));
  renderNotes();
}

// Clear all notes
clearNotes.addEventListener("click", () => {
  localStorage.removeItem("notes");
  renderNotes();
});

// Export all notes
exportNotes.addEventListener("click", () => {
  const notes = JSON.parse(localStorage.getItem("notes")) || [];
  if (notes.length === 0) {
    alert("ჩანაწერები ცარიელია!");
    return;
  }

  const text = notes
    .map((n, i) => `${i + 1}. ${n.title}\n${n.text}\n${n.link || ""}`)
    .join("\n\n");
  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "notes.txt";
  link.click();
});

// Export single note
function exportSingle(index) {
  const notes = JSON.parse(localStorage.getItem("notes")) || [];
  const note = notes[index];
  const text = `${note.title}\n\n${note.text}\n\n${note.link || ""}`;
  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${note.title || "note"}.txt`;
  link.click();
}

// Load notes on start
renderNotes();
