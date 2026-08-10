export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString.includes('T') ? dateString : `${dateString}T12:00:00`);
  return date.toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}
