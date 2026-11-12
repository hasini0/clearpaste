// The (fictional) organisation Clara supports. Every contact detail here is
// demonstration data: 555-01xx numbers are reserved for fiction and
// .example domains can never resolve, as the hackathon rules ask.

export const COMPANY = Object.freeze({
  name: 'Harbor City Utilities',
  short: 'HCU',
  industry: 'Utilities (electric and water)',
  agent: {
    name: 'Clara',
    tagline: 'Billing and service help, in plain words',
  },
  contacts: {
    phone: '1-800-555-0142',
    emergency: '1-800-555-0199',
    tty: '711',
    email: 'help@harborcity-utilities.example',
    hours: 'Mon–Fri 7am–8pm, Sat 8am–2pm',
    web: 'https://harborcity-utilities.example',
  },
  humanAgents: ['Maya Chen', 'Luis Ortega', 'Priya Nair'],
});

export const demoNotice = 'Demonstration contact details — not a real company.';
