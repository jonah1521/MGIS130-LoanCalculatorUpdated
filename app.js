// ==========================================
// 1. DATA LAYER (Input, Storage & Validation)
// ==========================================
function getInputs() {
  const currencySelect = document.getElementById('currency');
  const currency = currencySelect.value;
  const symbol = currencySelect.options[currencySelect.selectedIndex].getAttribute('data-symbol');
  const amount = parseFloat(document.getElementById('amount').value);
  const annualInterest = parseFloat(document.getElementById('interest').value);
  const years = parseInt(document.getElementById('years').value, 10);

  if (isNaN(amount) || amount <= 0) throw new Error('Enter a valid positive loan amount.');
  if (isNaN(annualInterest) || annualInterest <= 0) throw new Error('Enter a valid interest rate.');
  if (isNaN(years) || years <= 0) throw new Error('Enter a valid loan term.');

  return { currency, symbol, amount, annualInterest, years };
}

function saveToLocalStorage(data) {
  localStorage.setItem('mgis130_loan_data', JSON.stringify(data));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('mgis130_loan_data');
  return saved ? JSON.parse(saved) : null;
}

// Helper: Formats numbers into currency strings (e.g. $10,000.00 or ¥10,000)
function formatCurrency(value, currencyCode) {
  const fractionDigits = currencyCode === 'JPY' ? 0 : 2;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
}

// ==========================================
// 2. PROCESSING LAYER (Business Logic & Amortization)
// ==========================================
function calculateAmortization(principal, annualRate, termYears, currencyCode) {
  const monthlyRate = annualRate / 100 / 12;
  const totalPayments = termYears * 12;

  const factor = Math.pow(1 + monthlyRate, totalPayments);
  const monthlyPayment = (principal * (monthlyRate * factor)) / (factor - 1);
  const totalPayment = monthlyPayment * totalPayments;
  const totalInterest = totalPayment - principal;

  // Monthly amortization schedule for the first 12 months
  let balance = principal;
  const schedule = [];

  for (let month = 1; month <= Math.min(12, totalPayments); month++) {
    const interestForMonth = balance * monthlyRate;
    const principalForMonth = monthlyPayment - interestForMonth;
    balance -= principalForMonth;

    schedule.push({
      month,
      principalPaid: formatCurrency(principalForMonth, currencyCode),
      interestPaid: formatCurrency(interestForMonth, currencyCode),
      remainingBalance: formatCurrency(Math.max(0, balance), currencyCode)
    });
  }

  const principalPct = ((principal / totalPayment) * 100).toFixed(1);
  const interestPct = ((totalInterest / totalPayment) * 100).toFixed(1);

  return {
    monthlyPayment: formatCurrency(monthlyPayment, currencyCode),
    totalPrincipal: formatCurrency(principal, currencyCode),
    totalInterest: formatCurrency(totalInterest, currencyCode),
    totalPayment: formatCurrency(totalPayment, currencyCode),
    principalPct,
    interestPct,
    schedule
  };
}

// ==========================================
// 3. PRESENTATION LAYER (DOM & Visual Manipulation)
// ==========================================
function updateUI(results) {
  document.getElementById('monthly-payment').textContent = results.monthlyPayment;
  document.getElementById('total-principal').textContent = results.totalPrincipal;
  document.getElementById('total-interest').textContent = results.totalInterest;
  document.getElementById('total-payment').textContent = results.totalPayment;

  // Update Visual Ratio Bar
  document.getElementById('principal-bar').style.width = `${results.principalPct}%`;
  document.getElementById('interest-bar').style.width = `${results.interestPct}%`;
  document.getElementById('principal-pct').textContent = `${results.principalPct}%`;
  document.getElementById('interest-pct').textContent = `${results.interestPct}%`;

  // Render Amortization Table Rows
  const tbody = document.getElementById('schedule-body');
  tbody.innerHTML = '';
  results.schedule.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>Month ${row.month}</td>
      <td>${row.principalPaid}</td>
      <td>${row.interestPaid}</td>
      <td>${row.remainingBalance}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('error-message').classList.add('hidden');
  document.getElementById('results').classList.remove('hidden');
}

// Update form currency symbol labels dynamically
document.getElementById('currency').addEventListener('change', (e) => {
  const selectedOption = e.target.options[e.target.selectedIndex];
  const symbol = selectedOption.getAttribute('data-symbol');
  document.querySelectorAll('.currency-symbol').forEach(el => el.textContent = symbol);
});

// Interactive Slider Displays
document.getElementById('interest').addEventListener('input', (e) => {
  document.getElementById('interest-val').textContent = `${e.target.value}%`;
});

document.getElementById('years').addEventListener('input', (e) => {
  document.getElementById('years-val').textContent = `${e.target.value} Years`;
});

// Main Event Handler
document.getElementById('loan-form').addEventListener('submit', (e) => {
  e.preventDefault();
  try {
    const rawData = getInputs();
    saveToLocalStorage(rawData); // Data Layer
    const results = calculateAmortization(rawData.amount, rawData.annualInterest, rawData.years, rawData.currency); // Processing Layer
    updateUI(results); // Presentation Layer
  } catch (err) {
    document.getElementById('error-message').textContent = err.message;
    document.getElementById('error-message').classList.remove('hidden');
  }
});

// Load persistent data from Local Storage
window.addEventListener('DOMContentLoaded', () => {
  const savedData = loadFromLocalStorage();
  if (savedData) {
    document.getElementById('currency').value = savedData.currency || 'USD';
    document.getElementById('amount').value = savedData.amount;
    document.getElementById('interest').value = savedData.annualInterest;
    document.getElementById('years').value = savedData.years;
    
    document.getElementById('interest-val').textContent = `${savedData.annualInterest}%`;
    document.getElementById('years-val').textContent = `${savedData.years} Years`;
    
    const symbol = savedData.symbol || '$';
    document.querySelectorAll('.currency-symbol').forEach(el => el.textContent = symbol);

    const results = calculateAmortization(savedData.amount, savedData.annualInterest, savedData.years, savedData.currency || 'USD');
    updateUI(results);
  }
});
