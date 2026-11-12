// Customers rarely use the words in our articles ("shut off" vs.
// "disconnection", "lights out" vs. "outage"). Each group is expanded at
// query time so either wording finds the same passage.

export const SYNONYM_GROUPS = [
  ['disconnect', 'disconnection', 'shutoff', 'shut', 'cut', 'cutoff', 'terminate', 'termination'],
  ['outage', 'blackout', 'power', 'lights', 'electricity'],
  ['bill', 'invoice', 'statement', 'charge', 'charges'],
  ['plan', 'installment', 'installments', 'arrangement', 'split', 'instalment'],
  ['assistance', 'help', 'afford', 'discount', 'grant', 'credit', 'program', 'programs'],
  ['pay', 'payment', 'payments', 'paying', 'paid'],
  ['high', 'higher', 'expensive', 'increase', 'doubled', 'spike', 'jump'],
  ['leak', 'leaking', 'drip', 'running'],
  ['move', 'moving', 'transfer', 'relocate', 'start', 'stop'],
  ['scam', 'fraud', 'fake', 'phishing', 'suspicious', 'legit', 'real'],
  ['late', 'overdue', 'past', 'behind'],
  ['senior', 'elderly', 'older', 'retired', 'disability', 'disabled'],
  ['medical', 'doctor', 'oxygen', 'equipment', 'dialysis', 'certificate'],
  ['estimated', 'estimate', 'reading', 'meter'],
  ['language', 'spanish', 'interpreter', 'translate', 'translation'],
  ['winter', 'cold', 'freezing'],
  ['deposit', 'deposits'],
  ['autopay', 'automatic', 'paperless'],
];
