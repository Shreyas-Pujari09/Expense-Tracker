// Simple Expense Tracker using Firebase Firestore

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD1RIH2zxOvp6RwlRv-BiEIDl1PCoriGDQ",
  authDomain: "expensetracker-c5ce2.firebaseapp.com",
  projectId: "expensetracker-c5ce2",
  storageBucket: "expensetracker-c5ce2.firebasestorage.app",
  messagingSenderId: "477868502941",
  appId: "1:477868502941:web:0d80acf6609826108b4974",
  measurementId: "G-8VWBX5MQPN",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const expensesCollection = collection(db, "expenses");

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

async function loadExpensesFromFirestore() {
  try {
    const snapshot = await getDocs(expensesCollection);
    expenses = snapshot.docs
      .map((document) => {
        const data = document.data() || {};
        return {
          id: document.id,
          name: String(data.name ?? "").trim(),
          category: String(data.category ?? "Other"),
          amount: Number(data.amount) || 0,
        };
      })
      .filter((item) => item.name && item.amount > 0);
    render();
  } catch (error) {
    console.error("Failed to load expenses from Firestore", error);
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

async function addExpense(name, amount, category) {
  try {
    await addDoc(expensesCollection, {
      name: name.trim(),
      category,
      amount,
      createdAt: Date.now(),
    });
    await loadExpensesFromFirestore();
  } catch (error) {
    console.error("Failed to add expense", error);
  }
}

async function deleteExpense(id) {
  try {
    await deleteDoc(doc(db, "expenses", id));
    await loadExpensesFromFirestore();
  } catch (error) {
    console.error("Failed to delete expense", error);
  }
}

async function clearAllExpenses() {
  if (!expenses.length) return;
  const confirmed = window.confirm(
    "This will remove all expenses from this device. Continue?"
  );
  if (!confirmed) return;
  try {
    const snapshot = await getDocs(expensesCollection);
    await Promise.all(
      snapshot.docs.map((document) =>
        deleteDoc(doc(db, "expenses", document.id))
      )
    );
    expenses = [];
    render();
  } catch (error) {
    console.error("Failed to clear expenses", error);
  }
}

async function handleSubmit(event) {
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
  await addExpense(name, amount, category);

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

async function init() {
  initCurrentDate();
  await loadExpensesFromFirestore();

  form.addEventListener("submit", handleSubmit);
  filterSelect.addEventListener("change", render);
  clearAllButton.addEventListener("click", clearAllExpenses);
}

document.addEventListener("DOMContentLoaded", init);

