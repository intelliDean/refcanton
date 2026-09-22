// frontend/js/components/pipeline.js
// Pipeline stage computation and visual stepper renderer

export function updatePipeline(state) {
  const hasLoanA = state.loansA && state.loansA.length > 0;
  const hasLoanB = state.loansB && state.loansB.length > 0;
  const hasQuote = state.payoffQuotes && state.payoffQuotes.length > 0;
  const hasOffer = state.replacementOffers && state.replacementOffers.length > 0;
  const hasClosingReq = state.closingRequests && state.closingRequests.length > 0;
  const hasReceipt = state.receipts && state.receipts.length > 0;

  // Determine active step (1 to 4)
  let activeStep = 1;
  if (hasLoanB || hasReceipt) {
    activeStep = 4;
  } else if ((hasQuote && hasOffer) || hasClosingReq) {
    activeStep = 3;
  } else if (hasQuote || hasOffer) {
    activeStep = 2;
  } else if (hasLoanA) {
    activeStep = 1;
  }

  // Update DOM step indicators
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step${i}`);
    if (!el) continue;

    el.classList.remove('active', 'completed');
    if (i < activeStep) {
      el.classList.add('completed');
    } else if (i === activeStep) {
      el.classList.add('active');
    }
  }

  // Update status badge
  const badge = document.getElementById('pipelineStatusBadge');
  if (badge) {
    if (activeStep === 4) {
      badge.className = 'status-badge status-closed';
      badge.innerText = 'Refinanced (Closed)';
    } else if (activeStep === 3) {
      badge.className = 'status-badge status-ready';
      badge.innerText = 'Ready to Close';
    } else if (activeStep === 2) {
      badge.className = 'status-badge status-pending';
      badge.innerText = 'Quotes In Progress';
    } else {
      badge.className = 'status-badge status-active';
      badge.innerText = 'Loan A Active';
    }
  }

  return activeStep;
}
