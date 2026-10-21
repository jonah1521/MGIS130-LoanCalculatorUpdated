// ==========================================
// 1. DATA LAYER (Input, Storage & Validation)
// ==========================================
function getInputs() {
  const amount = parseFloat(document.getElementById('amount').value);
  const annualInterest = parseFloat(document.getElementById('interest').value);
  const years = parseInt(document.getElementById('years').value, 10);

  if (isNaN(amount) || amount <= 0) throw new Error('Enter a valid positive loan amount.');
  if (isNaN(annualInterest) || annualInterest <= 0) throw new Error('Enter a valid interest rate.');
  if (isNaN(years) || years <= 0) throw new Error('Enter a valid loan term.');

  return { amount, annualInterest, years };
}

function saveToLocalStorage(data) {
  localStorage.setItem('mgis130_loan_data', JSON.stringify(data));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('mgis130_loan_data');
  return saved ? JSON.parse(saved) : null;
}

// ==========================================
// 2. PROCESSING LAYER (Business Logic & Amortization)
// ==========================================
function calculateAmortization(principal, annualRate, termYears) {
  const monthlyRate = annualRate / 100 / 12;
  const totalPayments = termYears * 12;

  const factor = Math.pow(1 + monthlyRate, totalPayments);
  const monthlyPayment = (principal * (monthlyRate * factor)) / (factor - 1);
  const totalPayment = monthlyPayment * totalPayments;
  const totalInterest = totalPayment - principal;

  // Calculate monthly amortization schedule for 12 months
  let balance = principal;
  const schedule = [];

  for (let month = 1; month <= Math.min(12, totalPayments); month++) {
    const interestForMonth = balance * monthlyRate;
    const principalForMonth = monthlyPayment - interestForMonth;
    balance -= principalForMonth;

    schedule.push({
      month,
      principalPaid: principalForMonth.toFixed(2),
      interestPaid: interestForMonth.toFixed(2),
      remainingBalance: Math.max(0, balance).toFixed(2)
    });
  }

  const principalPct = ((principal / totalPayment) * 100).toFixed(1);
  const interestPct = ((totalInterest / totalPayment) * 100).toFixed(1);

  return {
    monthlyPayment: monthlyPayment.toFixed(2),
    totalPrincipal: principal.toFixed(2),
    totalInterest: totalInterest.toFixed(2),
    totalPayment: totalPayment.toFixed(2),
    principalPct,
    interestPct,
    schedule
  };
}

// ==========================================
// 3. PRESENTATION LAYER (DOM & Visual Manipulation)
// ==========================================
function updateUI(results) {
  document.getElementById('monthly-payment').textContent = `$${results.monthlyPayment}`;
  document.getElementById('total-principal').textContent = `$${results.totalPrincipal}`;
  document.getElementById('total-interest').textContent = `$${results.totalInterest}`;
  document.getElementById('total-payment').textContent = `$${results.totalPayment}`;

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
      <td>$${row.principalPaid}</td>
      <td>$${row.interestPaid}</td>
      <td>$${row.remainingBalance}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('error-message').classList.add('hidden');
  document.getElementById('results').classList.remove('hidden');
}

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
    saveToLocalStorage(rawData); // Save to Data Layer
    const results = calculateAmortization(rawData.amount, rawData.annualInterest, rawData.years);
    updateUI(results);
  } catch (err) {
    document.getElementById('error-message').textContent = err.message;
    document.getElementById('error-message').classList.remove('hidden');
  }
});

// On Load: Check Local Storage
window.addEventListener('DOMContentLoaded', () => {
  const savedData = loadFromLocalStorage();
  if (savedData) {
    document.getElementById('amount').value = savedData.amount;
    document.getElementById('interest').value = savedData.annualInterest;
    document.getElementById('years').value = savedData.years;
    document.getElementById('interest-val').textContent = `${savedData.annualInterest}%`;
    document.getElementById('years-val').textContent = `${savedData.years} Years`;

    const results = calculateAmortization(savedData.amount, savedData.annualInterest, savedData.years);
    updateUI(results);
  }
});
