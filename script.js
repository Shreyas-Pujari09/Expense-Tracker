// Simple Expense Tracker using localStorage

const STORAGE_KEY = "expense-tracker-expenses";

const form = document.getElementById("expense-form");
const nameInput = document.getElementById("expense-name");
const amountInput = document.getElementById("expense-amount");
const categorySelect = document.getElementById("expense-category");
const filterSelect = document.getElementById("filter-category");
const errorEl = document.getElementById("form-error");
const tableBody = document.getElementById("expense-table-body");
const totalAmountEl = document.getElementById("total-amount");
const expenseCountEl = document.getElementById("expense-count");
const emptyStateEl = document.getElementById("empty-state");
const clearAllButton = document.getElementById("clear-all");
const activeFilterLabel = document.getElementById("active-filter-label");
const currentDateEl = document.getElementById("current-date");

let expenses = [];

// Utils
function formatCurrency(value) {
  const number = Number(value) || 0;
  return number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function showError(message) {
  if (!message) {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
    return;
  }
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Ensure objects have required shape
    return parsed
      .map((item) => ({
        id: item.id ?? crypto.randomUUID?.() ?? String(Date.now()),
        name: String(item.name ?? "").trim(),
        category: String(item.category ?? "Other"),
        amount: Number(item.amount) || 0,
      }))
      .filter((item) => item.name && item.amount > 0);
  } catch {
    return [];
  }
}

function calculateTotal(filteredExpenses) {
  // Use reduce() to compute sum
  return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
}

function getFilteredExpenses() {
  const activeFilter = filterSelect.value;
  if (activeFilter === "all") {
    return expenses;
  }
  // Use map() to clone before filter (demonstrates usage)
  const copy = expenses.map((e) => ({ ...e }));
  return copy.filter((expense) => expense.category === activeFilter);
}

function render() {
  const filtered = getFilteredExpenses();
  const total = calculateTotal(filtered);

  // Update total and count
  totalAmountEl.textContent = `₹${formatCurrency(total)}`;
  expenseCountEl.textContent = filtered.length;

  // Update active filter label
  const label =
    filterSelect.value === "all"
      ? "All categories"
      : `Category: ${filterSelect.value}`;
  activeFilterLabel.textContent = `Showing: ${label}`;

  // Clear table
  tableBody.innerHTML = "";

  if (filtered.length === 0) {
    emptyStateEl.classList.remove("hidden");
    return;
  }

  emptyStateEl.classList.add("hidden");

  filtered.forEach((expense) => {
    const row = document.createElement("tr");
    row.className =
      "hover:bg-slate-900/80 transition-colors divide-x divide-slate-900/60";

    const nameCell = document.createElement("td");
    nameCell.className = "px-4 sm:px-6 py-3 align-middle";
    nameCell.textContent = expense.name;

    const categoryCell = document.createElement("td");
    categoryCell.className = "px-4 sm:px-6 py-3 align-middle";
    const badge = document.createElement("span");
    badge.className =
      "inline-flex items-center rounded-full bg-slate-800/80 border border-slate-700/70 px-2.5 py-0.5 text-[11px] font-medium text-slate-100";
    badge.textContent = expense.category;
    categoryCell.appendChild(badge);

    const amountCell = document.createElement("td");
    amountCell.className =
      "px-4 sm:px-6 py-3 align-middle text-right tabular-nums";
    amountCell.textContent = formatCurrency(expense.amount);

    const actionCell = document.createElement("td");
    actionCell.className =
      "px-3 sm:px-4 py-3 align-middle text-right whitespace-nowrap";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.className =
      "inline-flex items-center rounded-md border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-300 hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400 transition";
    deleteBtn.dataset.id = expense.id;

    deleteBtn.addEventListener("click", () => {
      deleteExpense(expense.id);
    });

    actionCell.appendChild(deleteBtn);

    row.appendChild(nameCell);
    row.appendChild(categoryCell);
    row.appendChild(amountCell);
    row.appendChild(actionCell);

    tableBody.appendChild(row);
  });
}

function addExpense(name, amount, category) {
  const expense = {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    name: name.trim(),
    category,
    amount,
  };
  expenses.push(expense);
  saveToStorage();
  render();
}

function deleteExpense(id) {
  expenses = expenses.filter((expense) => expense.id !== id);
  saveToStorage();
  render();
}

function clearAllExpenses() {
  if (!expenses.length) return;
  const confirmed = window.confirm(
    "This will remove all expenses from this device. Continue?"
  );
  if (!confirmed) return;
  expenses = [];
  saveToStorage();
  render();
}

function handleSubmit(event) {
  event.preventDefault();
  const name = nameInput.value.trim();
  const amountValue = amountInput.value;
  const amount = Number(amountValue);
  const category = categorySelect.value;

  if (!name) {
    showError("Please enter an expense name.");
    nameInput.focus();
    return;
  }

  if (!amountValue || Number.isNaN(amount) || amount <= 0) {
    showError("Amount must be a number greater than zero.");
    amountInput.focus();
    return;
  }

  showError("");
  addExpense(name, amount, category);

  // Reset form fields
  nameInput.value = "";
  amountInput.value = "";
  nameInput.focus();
}

function initCurrentDate() {
  if (!currentDateEl) return;
  const now = new Date();
  const formatted = now.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  currentDateEl.textContent = formatted;
}

function init() {
  initCurrentDate();
  expenses = loadFromStorage();
  render();

  form.addEventListener("submit", handleSubmit);
  filterSelect.addEventListener("change", render);
  clearAllButton.addEventListener("click", clearAllExpenses);
}

document.addEventListener("DOMContentLoaded", init);

