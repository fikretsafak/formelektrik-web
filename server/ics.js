// Basit RFC 5545 ICS dosya üretici (takvim daveti)
const crypto = require('crypto');

function fmtUtc(isoOrDate) {
  const d = new Date(isoOrDate);
  return d.getUTCFullYear() +
    String(d.getUTCMonth() + 1).padStart(2, '0') +
    String(d.getUTCDate()).padStart(2, '0') + 'T' +
    String(d.getUTCHours()).padStart(2, '0') +
    String(d.getUTCMinutes()).padStart(2, '0') +
    String(d.getUTCSeconds()).padStart(2, '0') + 'Z';
}

function esc(s) {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * @param {object} opts
 * @param {string} opts.uid          - benzersiz UID (örn: "appt-42@formelektrik.com")
 * @param {Date|string} opts.start   - başlangıç
 * @param {Date|string} opts.end     - bitiş
 * @param {string} opts.summary
 * @param {string} [opts.description]
 * @param {string} [opts.location]
 * @param {string} [opts.organizerEmail]
 * @param {string} [opts.organizerName]
 * @param {string[]} [opts.attendeeEmails]
 * @param {string} [opts.url] - örn. Teams join link
 */
function buildIcs(opts) {
  const uid = opts.uid || crypto.randomBytes(8).toString('hex') + '@formelektrik.com';
  const now = fmtUtc(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Form Elektrik//Randevu//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${fmtUtc(opts.start)}`,
    `DTEND:${fmtUtc(opts.end)}`,
    `SUMMARY:${esc(opts.summary)}`,
  ];
  if (opts.description) lines.push(`DESCRIPTION:${esc(opts.description)}`);
  if (opts.location) lines.push(`LOCATION:${esc(opts.location)}`);
  if (opts.url) lines.push(`URL:${esc(opts.url)}`);
  if (opts.organizerEmail) {
    const cn = opts.organizerName ? `CN=${esc(opts.organizerName)}:` : '';
    lines.push(`ORGANIZER;${cn}MAILTO:${opts.organizerEmail}`);
  }
  (opts.attendeeEmails || []).forEach(email => {
    lines.push(`ATTENDEE;RSVP=TRUE;CN=${email};ROLE=REQ-PARTICIPANT:MAILTO:${email}`);
  });
  lines.push('STATUS:CONFIRMED');
  lines.push('SEQUENCE:0');
  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

module.exports = { buildIcs };
