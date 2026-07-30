(() => {
  const form = document.getElementById('research-form');
  const message = document.getElementById('success-message');
  if (!form || !message) return;

  const showMessage = (text, isError = false) => {
    message.textContent = text;
    message.style.color = isError ? '#a56600' : '#4ab134';
    message.hidden = false;
  };

  const exportLocally = (response) => {
    const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vsmile-sp8-research-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const requiredBarriers = form.querySelectorAll('input[name="barriers"]:checked');
    if (!form.checkValidity() || requiredBarriers.length === 0) {
      form.reportValidity();
      if (requiredBarriers.length === 0) showMessage(form.dataset.barriersMessage || 'Please select at least one barrier.', true);
      return;
    }

    const formData = new FormData(form);
    const response = Object.fromEntries(formData.entries());
    response.barriers = formData.getAll('barriers');
    response.valuable_parts = formData.getAll('valuable_parts');
    response.timestamp = new Date().toISOString();

    if (window.location.protocol === 'file:') {
      response.note = 'Local-only export. No network request was made.';
      exportLocally(response);
      showMessage(form.dataset.fallbackSuccess || 'Your response was saved locally.');
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const endpoint = new URL(form.dataset.endpoint || "/api/survey-response", "https://vsmile-sp8-survey-api.vsmilehappyzir.workers.dev").toString();
      const result = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response)
      });
      if (!result.ok) throw new Error('Submission failed');
      form.reset();
      showMessage(form.dataset.success || 'Thank you for your feedback.');
    } catch (error) {
      showMessage(form.dataset.error || 'We could not submit your response. Please try again later.', true);
    } finally {
      button.disabled = false;
    }
  });
})();
