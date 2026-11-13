document.addEventListener('DOMContentLoaded', () => {
  const cards = Array.from(document.querySelectorAll('.invoice-card'));
  const searchInputs = [
    document.getElementById('header-search'),
    document.getElementById('invoice-search'),
  ].filter(Boolean);
  const filterItems = Array.from(document.querySelectorAll('.mid-list li[data-filter]'));
  const newInvoiceBtn = document.getElementById('newInvoice');
  const markPaidBtn = document.getElementById('markPaid');
  const downloadBtn = document.getElementById('downloadPdf');

  const detailClient = document.getElementById('detailClient');
  const detailIssueDate = document.getElementById('detailIssueDate');
  const detailDueDate = document.getElementById('detailDueDate');
  const detailStatus = document.getElementById('detailStatus');
  const detailPaymentStatus = document.getElementById('detailPaymentStatus');
  const invoiceSearch = document.getElementById('invoice-search');

  let activeFilter = 'all';
  let selectedCard = cards[0] || null;

  const statusLabel = (status) => {
    if (status === 'paid') return 'Paid';
    if (status === 'pending') return 'Pending';
    return 'Overdue';
  };

  const paymentLabel = (status) => {
    if (status === 'paid') return 'Payment Status: Completed';
    if (status === 'pending') return 'Payment Status: Awaiting payment';
    return 'Payment Status: Overdue';
  };

  const applyFilters = () => {
    const term = searchInputs.length ? searchInputs[0].value.trim().toLowerCase() : '';

    cards.forEach((card) => {
      const matchesSearch = !term || card.textContent.toLowerCase().includes(term);
      const matchesStatus = activeFilter === 'all' || card.dataset.status === activeFilter;
      card.hidden = !(matchesSearch && matchesStatus);
    });
  };

  const setActiveFilter = (value) => {
    activeFilter = activeFilter === value ? 'all' : value;
    filterItems.forEach((item) => {
      item.classList.toggle('active', item.dataset.filter === activeFilter);
      item.setAttribute('aria-pressed', String(item.dataset.filter === activeFilter));
    });
    applyFilters();
  };

  const updateDetails = (card) => {
    if (!card) return;
    selectedCard = card;
    cards.forEach((item) => item.classList.remove('selected'));
    card.classList.add('selected');

    if (detailClient) detailClient.textContent = card.dataset.client || '';
    if (detailStatus) detailStatus.textContent = statusLabel(card.dataset.status);
    if (detailPaymentStatus) detailPaymentStatus.textContent = paymentLabel(card.dataset.status);

    const today = new Date();
    const due = new Date(today);
    due.setDate(due.getDate() + 14);
    if (detailIssueDate) detailIssueDate.textContent = today.toISOString().slice(0, 10);
    if (detailDueDate) detailDueDate.textContent = due.toISOString().slice(0, 10);
  };

  const setCardStatus = (card, status) => {
    card.dataset.status = status;
    const badge = card.querySelector('h3');
    if (badge) {
      badge.className = status;
      badge.textContent = statusLabel(status);
    }
    if (selectedCard === card) updateDetails(card);
  };

  searchInputs.forEach((input) => {
    input.addEventListener('input', (event) => {
      searchInputs.forEach((other) => {
        if (other !== event.target) other.value = event.target.value;
      });
      applyFilters();
    });
  });

  filterItems.forEach((item) => {
    item.addEventListener('click', () => setActiveFilter(item.dataset.filter));
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setActiveFilter(item.dataset.filter);
      }
    });
  });

  const cycleStatus = (card) => {
    const cycle = { paid: 'overdue', pending: 'paid', overdue: 'pending' };
    setCardStatus(card, cycle[card.dataset.status] || 'paid');
  };

  const bindCard = (card) => {
    card.addEventListener('click', (event) => {
      if (event.target.closest('h3')) return;
      updateDetails(card);
    });
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        updateDetails(card);
      }
    });

    const badge = card.querySelector('h3');
    if (badge) {
      badge.setAttribute('role', 'button');
      badge.setAttribute('tabindex', '0');
      badge.addEventListener('click', (event) => {
        event.stopPropagation();
        cycleStatus(card);
      });
      badge.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          cycleStatus(card);
        }
      });
    }
  };

  cards.forEach(bindCard);

  if (markPaidBtn) {
    markPaidBtn.addEventListener('click', () => {
      if (selectedCard) setCardStatus(selectedCard, 'paid');
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => window.print());
  }

  if (newInvoiceBtn) {
    newInvoiceBtn.addEventListener('click', () => {
      const card = document.createElement('div');
      card.className = 'invoice-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.dataset.id = `INV-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      card.dataset.client = 'New Client';
      card.dataset.amount = '$0';
      card.dataset.status = 'pending';
      card.innerHTML = `
        <h4>${card.dataset.id}</h4>
        <h4>New Client</h4>
        <h4>$0</h4>
        <h3 class="pending" role="button" tabindex="0">Pending</h3>
      `;
      const list = document.querySelector('.main-invoice');
      if (list) list.appendChild(card);
      cards.push(card);
      bindCard(card);
      updateDetails(card);
      applyFilters();
      if (invoiceSearch) invoiceSearch.focus();
    });
  }

  // Keep the header and list search boxes in sync from the start.
  if (searchInputs.length > 1) {
    searchInputs.forEach((input) => {
      input.value = searchInputs[0].value;
    });
  }

  updateDetails(selectedCard);
  applyFilters();
});
