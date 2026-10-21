// ==========================================
// 1. DATA LAYER (Input Ingestion & Validation)
// ==========================================
function getLoanInputs() {
  const amount = parseFloat(document.getElementById('amount').value);
  const annualInterest = parseFloat(document.getElementById('interest').value);
  const years = parseInt(document.getElementById('years').value, 10);

  if (isNaN(amount) || amount <= 0) {
    throw new Error('Please enter a valid positive loan amount.');
  }
  if (isNaN(annualInterest) || annualInterest <= 0) {
    throw new Error('Please enter a valid interest rate greater than 0.');
  }
  if (isNaN(years) || years <= 0) {
    throw new Error('Please enter a valid loan term in years.');
  }

  return { amount, annualInterest, years };
}

// ==========================================
// 2. PROCESSING LAYER (Business Logic)
// ==========================================
function calculateLoanAmortization(principal, annualRate, termYears) {
  const monthlyRate = annualRate / 100 / 12;
  const totalPayments = termYears * 12;

  // Standard Amortization Formula: M = P * [i(1+i)^n] / [(1+i)^n - 1]
  const factor = Math.pow(1 + monthlyRate, totalPayments);
  const monthlyPayment = (principal * (monthlyRate * factor)) / (factor - 1);
  const totalPayment = monthlyPayment * totalPayments;
  const totalInterest = totalPayment - principal;

  return {
    monthlyPayment: monthlyPayment.toFixed(2),
    totalPrincipal: principal.toFixed(2),
    totalInterest: totalInterest.toFixed(2),
    totalPayment: totalPayment.toFixed(2)
  };
}

// ==========================================
// 3. PRESENTATION LAYER (DOM Manipulation)
// ==========================================
function updateUI(results) {
  document.getElementById('monthly-payment').textContent = `$${results.monthlyPayment}`;
  document.getElementById('total-principal').textContent = `$${results.totalPrincipal}`;
  document.getElementById('total-interest').textContent = `$${results.totalInterest}`;
  document.getElementById('total-payment').textContent = `$${results.totalPayment}`;

  document.getElementById('error-message').classList.add('hidden');
  document.getElementById('results').classList.remove('hidden');
}

function displayError(message) {
  const errorBox = document.getElementById('error-message');
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
  document.getElementById('results').classList.add('hidden');
}

// Event Controller
document.getElementById('loan-form').addEventListener('submit', function (event) {
  event.preventDefault();
  try {
    const rawData = getLoanInputs(); // Data Layer
    const processedData = calculateLoanAmortization(
      rawData.amount,
      rawData.annualInterest,
      rawData.years
    ); // Processing Layer
    updateUI(processedData); // Presentation Layer
  } catch (error) {
    displayError(error.message);
  }
});
