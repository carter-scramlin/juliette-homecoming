const groups = [
  { title: "___ CALL", words: ["VIDEO", "ROLL", "CURTAIN", "WAKE-UP"], level: 0 },
  { title: "ON CARTER'S DRUMLINE", words: ["SNARE", "TENORS", "BASS", "CYMBALS"], level: 1 },
  { title: "IN JULIETTE'S GUARD BAG", words: ["FLAG", "RIFLE", "SABRE", "SILK"], level: 2 },
  { title: "DECEMBER 23, 2025", words: ["TUESDAY", "WINTER", "CAPRICORN", "FESTIVUS"], level: 3 }
];

const palette = ["#ff4fa3", "#ffd166", "#55c9ff", "#a778ff", "#86e3ce"];
const grid = document.querySelector("#word-grid");
const solvedGroups = document.querySelector("#solved-groups");
const submitButton = document.querySelector("#submit-button");
const deselectButton = document.querySelector("#deselect-button");
const shuffleButton = document.querySelector("#shuffle-button");
const message = document.querySelector("#message");
const mistakeDots = document.querySelector("#mistake-dots");
const reveal = document.querySelector("#reveal");

let board = groups.flatMap(group => group.words).sort(() => Math.random() - 0.5);
let selected = new Set();
let solved = [];
let mistakes = 0;
let locked = false;

function renderDots() {
  mistakeDots.innerHTML = "";
  for (let i = 0; i < 4; i += 1) {
    const dot = document.createElement("span");
    dot.className = `mistake-dot${i < mistakes ? " used" : ""}`;
    mistakeDots.append(dot);
  }
}

function renderBoard() {
  grid.innerHTML = "";
  board.forEach(word => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `word-tile${selected.has(word) ? " selected" : ""}`;
    button.textContent = word;
    button.setAttribute("aria-pressed", String(selected.has(word)));
    button.addEventListener("click", () => toggleWord(word));
    grid.append(button);
  });
  submitButton.disabled = selected.size !== 4 || locked;
}

function toggleWord(word) {
  if (locked) return;
  if (selected.has(word)) selected.delete(word);
  else if (selected.size < 4) selected.add(word);
  else setMessage("You can only choose four words.", "error");
  renderBoard();
}

function setMessage(text, type = "") {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

function addSolvedGroup(groupIndex) {
  const group = groups[groupIndex];
  const card = document.createElement("article");
  card.className = "solved-group";
  card.dataset.level = String(group.level);
  card.innerHTML = `<h3>${group.title}</h3><p>${group.words.join(" · ")}</p>`;
  solvedGroups.append(card);
}

const delay = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));

async function evaluateSelection() {
  if (selected.size !== 4 || locked) return { status: "invalid" };
  const chosen = [...selected];
  const exactIndex = groups.findIndex((group, index) =>
    !solved.includes(index) && group.words.every(word => selected.has(word))
  );

  if (exactIndex >= 0) {
    locked = true;
    grid.classList.add("pop");
    await delay(330);
    solved.push(exactIndex);
    board = board.filter(word => !selected.has(word));
    selected.clear();
    addSolvedGroup(exactIndex);
    grid.classList.remove("pop");
    locked = false;
    renderBoard();
    setMessage(solved.length === 4 ? "You found every connection!" : "That’s a connection!", "success");
    if (solved.length === 4) {
      await delay(650);
      showReveal();
    }
    return { status: "correct", group: groups[exactIndex].title };
  }

  const oneAway = groups.some((group, index) => {
    if (solved.includes(index)) return false;
    return chosen.filter(word => group.words.includes(word)).length === 3;
  });
  mistakes += 1;
  renderDots();
  grid.classList.remove("shake");
  void grid.offsetWidth;
  grid.classList.add("shake");
  setMessage(oneAway ? "So close—one word away!" : "Not quite. Try another connection.", "error");
  selected.clear();
  await delay(380);
  renderBoard();
  if (mistakes >= 4) {
    setMessage("Out of mistakes! Revealing the remaining groups…", "error");
    await delay(500);
    await revealRemainingGroups();
    return { status: "game_over", oneAway };
  }
  return { status: "incorrect", oneAway };
}

async function revealRemainingGroups() {
  locked = true;
  selected.clear();
  board = [];
  renderBoard();
  const remaining = groups
    .map((group, index) => ({ group, index }))
    .filter(({ index }) => !solved.includes(index))
    .sort((a, b) => a.group.level - b.group.level);

  for (const { index } of remaining) {
    solved.push(index);
    addSolvedGroup(index);
    await delay(260);
  }

  setMessage("Better luck on the next puzzle!", "error");
  await delay(800);
  showReveal();
}

function showReveal() {
  reveal.classList.add("visible");
  reveal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  launchConfetti(90);
  document.querySelector("#yes-button").focus();
}

function launchConfetti(count = 70) {
  const confetti = document.querySelector("#confetti");
  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = palette[i % palette.length];
    piece.style.animationDuration = `${2.7 + Math.random() * 2.4}s`;
    piece.style.animationDelay = `${Math.random() * 1.2}s`;
    piece.style.setProperty("--drift", `${-100 + Math.random() * 200}px`);
    confetti.append(piece);
    setTimeout(() => piece.remove(), 6200);
  }
}

function celebrateYes() {
  document.querySelector("#yes-message").textContent = "Best answer ever. See you at Homecoming! ♡";
  launchConfetti(130);
}

submitButton.addEventListener("click", evaluateSelection);
deselectButton.addEventListener("click", () => { selected.clear(); renderBoard(); setMessage("Select four words that share a connection."); });
shuffleButton.addEventListener("click", () => { board.sort(() => Math.random() - 0.5); renderBoard(); setMessage("Board shuffled."); });
document.querySelector("#help-button").addEventListener("click", () => document.querySelector("#help-dialog").showModal());
document.querySelector("#menu-button").addEventListener("click", () => document.querySelector("#help-dialog").showModal());
document.querySelector("#yes-button").addEventListener("click", celebrateYes);
document.querySelector("#also-yes-button").addEventListener("click", celebrateYes);

function registerWebMCP() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const register = (tool) => Promise.resolve(context.registerTool(tool)).catch(() => {});

  register({
    name: "select_puzzle_words",
    title: "Select puzzle words",
    description: "Select up to four visible unsolved words in the daily grouping puzzle.",
    inputSchema: { type: "object", properties: { words: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4, uniqueItems: true } }, required: ["words"], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (!input || !Array.isArray(input.words)) throw new Error("words must be an array");
      const normalized = input.words.map(word => String(word).toUpperCase());
      if (normalized.length < 1 || normalized.length > 4 || new Set(normalized).size !== normalized.length) throw new Error("Choose one to four unique words");
      if (normalized.some(word => !board.includes(word))) throw new Error("Every word must be visible and unsolved");
      selected = new Set(normalized);
      renderBoard();
      return { selected: [...selected] };
    }
  });

  register({
    name: "submit_puzzle_selection",
    title: "Submit puzzle selection",
    description: "Submit the four currently selected words as one connected group.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute() {
      if (selected.size !== 4) throw new Error("Exactly four words must be selected");
      return evaluateSelection();
    }
  });
}

renderDots();
renderBoard();
registerWebMCP();
