// Use one submit-time validation path for every native form, including dynamically
// opened modals. Server-side validation remains authoritative.
if (typeof document !== 'undefined') {
  document.addEventListener('input', event => { event.target.setCustomValidity?.(''); }, true);
  document.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    for (const field of form.elements) {
      if (!field.willValidate) continue;
      const value = String(field.value || '');
      if (field.required && !value.trim()) field.setCustomValidity('Please complete this field.');
      if (field.type === 'tel' && value && !/^(?:\+91[ -]?)?[0-9]{10}$/.test(value)) field.setCustomValidity('Enter a valid 10-digit mobile number.');
    }
    if (!form.reportValidity()) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
}
