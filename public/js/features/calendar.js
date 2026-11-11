// Turns deadlines into calendar files (.ics) with reminders, so they work
// with Apple, Google and Outlook calendars on any phone.

const escapeICS = (s) => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
const compact = (iso) => iso.replaceAll('-', '');

function nextDay(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function eventBlock({ title, date, description }, index) {
  return [
    'BEGIN:VEVENT',
    `UID:clearpaste-${Date.now()}-${index}@clearpaste.local`,
    `DTSTAMP:${stamp()}`,
    `DTSTART;VALUE=DATE:${compact(date)}`,
    `DTEND;VALUE=DATE:${compact(nextDay(date))}`,
    `SUMMARY:${escapeICS(title)}`,
    `DESCRIPTION:${escapeICS(description || '')}`,
    // Two reminders: three days before and the morning before.
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapeICS(title)}`, 'TRIGGER:-P3D', 'END:VALARM',
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapeICS(title)}`, 'TRIGGER:-PT15H', 'END:VALARM',
    'END:VEVENT',
  ].join('\r\n');
}

export function downloadCalendar(events, filename = 'clearpaste-deadlines.ics') {
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ClearPaste//Deadlines//EN', 'CALSCALE:GREGORIAN',
    ...events.map(eventBlock),
    'END:VCALENDAR',
  ].join('\r\n');

  const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
