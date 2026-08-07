/**
 * Generates an 8-character uppercase room code.
 * Example: AB7KQ91P
 * @param {number} length
 * @returns {string}
 */
export function generateRoomCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Formats a given Date object or ISO string into a clean time string.
 * @param {Date|string} date
 * @returns {string}
 */
export function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
