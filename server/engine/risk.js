// Scam & fraud detector. Each signal is a known manipulation pattern
// (from consumer-protection guidance) with a weight. The total decides the
// warning level shown to the user.

const SIGNALS = [
  { weight: 3, re: /\b(gift ?cards?|itunes cards?|google play cards?|steam cards?|apple cards?)\b/i,
    reason: 'It asks you to pay with gift cards. Real companies and governments never do this.' },
  { weight: 2, re: /\b(bitcoin|crypto(?:currency)?|wire transfer|western union|moneygram|zelle|cash ?app|venmo)\b/i,
    reason: 'It asks for a payment that is very hard to get back (crypto, wire or app transfer).' },
  { weight: 1, re: /\b(within|in) (?:the next )?(?:24|48|2|12) hours?\b|\bact now\b|\bfinal (?:warning|notice)\b|\burgent(?:ly)?\b|\bright now\b/i,
    reason: 'It uses pressure and urgency to rush you.' },
  { weight: 2, re: /\b(arrest(?:ed)?|warrant|deport(?:ed|ation)?|jail|prison)\b/i,
    reason: 'It threatens arrest or jail — a common scare tactic.' },
  { weight: 2, re: /\b(verify|confirm|update|validate|unlock) (?:your )?(account|identity|password|details|information|card)\b/i,
    reason: 'It asks you to “verify” your account or personal details.' },
  { weight: 3, re: /\b(send|provide|reply with|confirm|enter|give|share|tell us)\b[^.]{0,50}\b(social security number|ssn|password|pin\b|one[- ]time (?:code|passcode)|otp|bank login|card number|cvv)/i,
    reason: 'It asks for secret information like your SSN, password, PIN or card number.' },
  { weight: 2, re: /\b(bit\.ly|tinyurl\.com|t\.co|goo\.gl|rb\.gy)\b|https?:\/\/[^\s]*\.(?:xyz|top|click|ru|info|live)\b/i,
    reason: 'It contains a shortened or unusual web link that hides where it really goes.' },
  { weight: 1, re: /\b(suspend(?:ed)?|locked|deactivat(?:ed|ion)|frozen|blocked)\b[^.]{0,40}\b(account|card|benefits|number)\b/i,
    reason: 'It claims your account or benefits will be locked or suspended.' },
  { weight: 2, re: /\b(you(?:'ve| have)? won|winner|lottery|sweepstakes|claim your (?:prize|reward))\b/i,
    reason: 'It promises a prize or money you did not expect.' },
  { weight: 2, re: /\bdo not (?:tell|share this with|contact)\b|\bkeep this (?:confidential|secret|private)\b/i,
    reason: 'It tells you to keep it secret — scammers try to stop you asking for help.' },
  { weight: 1, re: /\b(dear (?:customer|user|sir\/madam|valued member))\b/i,
    reason: 'It does not use your name, which real account notices usually do.' },
];

export function assessRisk(text) {
  const hits = SIGNALS.filter((s) => s.re.test(text));
  const score = hits.reduce((sum, s) => sum + s.weight, 0);
  const level = score >= 4 ? 'danger' : score >= 2 ? 'caution' : 'none';
  return {
    level,
    score,
    reasons: hits.map((s) => s.reason),
    advice: level === 'none'
      ? []
      : [
          'Do not click links, reply, or pay yet.',
          'Contact the organization using a phone number from their official website or a card you already have — not one in this message.',
          'Ask someone you trust, or report it to your local consumer-protection agency.',
        ],
  };
}
