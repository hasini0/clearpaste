// Guesses what kind of document this is from weighted keywords.

const TYPES = [
  { type: 'Medical bill', words: ['patient', 'balance due', 'amount due', 'statement', 'hospital', 'insurance paid', 'deductible', 'copay', 'billing', 'date of service'] },
  { type: 'Housing notice', words: ['tenant', 'landlord', 'lease', 'rent', 'vacate', 'eviction', 'premises', 'notice to quit', 'unlawful detainer', 'property'] },
  { type: 'Benefits letter', words: ['benefits', 'eligibility', 'recertification', 'household', 'caseworker', 'case number', 'snap', 'medicaid', 'department of', 'fair hearing'] },
  { type: 'Medicine leaflet', words: ['tablet', 'dose', 'dosage', 'side effects', 'pharmacist', 'mg', 'take', 'prescription', 'doctor', 'allergic'] },
  { type: 'Insurance document', words: ['policy', 'premium', 'coverage', 'claim', 'insured', 'explanation of benefits', 'deductible', 'network'] },
  { type: 'Legal notice', words: ['court', 'plaintiff', 'defendant', 'summons', 'hearing', 'judgment', 'attorney', 'complaint', 'law'] },
  { type: 'Job document', words: ['employment', 'salary', 'position', 'employer', 'employee', 'start date', 'offer', 'at-will', 'benefits package'] },
  { type: 'Utility bill', words: ['kwh', 'meter', 'electric', 'gas', 'water', 'service address', 'usage', 'disconnection'] },
  { type: 'School notice', words: ['student', 'parent', 'guardian', 'school', 'teacher', 'enrollment', 'attendance', 'grade'] },
  { type: 'Bank or credit notice', words: ['credit card', 'apr', 'minimum payment', 'bank', 'overdraft', 'interest', 'statement balance'] },
];

export function classifyDocument(text, risk) {
  if (risk?.level === 'danger') return 'Suspicious message';
  const lower = text.toLowerCase();
  let best = { type: 'Document', score: 0 };
  for (const { type, words } of TYPES) {
    const score = words.reduce((sum, w) => sum + (lower.includes(w) ? 1 : 0), 0);
    if (score > best.score) best = { type, score };
  }
  return best.score >= 2 ? best.type : 'Document';
}
