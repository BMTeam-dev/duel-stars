// Máscaras e leitura dos campos do formulário de criação.
const digits = (value: string) => value.replace(/\D/g, '');

export const maskDate = (value: string) => digits(value).slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2');
export const maskTime = (value: string) => digits(value).slice(0, 4).replace(/^(\d{2})(\d)/, '$1:$2');

// "25/10" + "19:00" -> millis no fuso do aparelho. Sem ano: este ano, ou o
// próximo se a data já passou (torneio em janeiro criado em dezembro).
export function parseStart(date: string, time: string): number | null {
  const d = /^(\d{2})\/(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const [day, month, hour, minute] = [d[1], d[2], t[1], t[2]].map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  const now = new Date();
  let start = new Date(now.getFullYear(), month - 1, day, hour, minute);
  if (start.getDate() !== day) return null;
  if (start.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
    start = new Date(now.getFullYear() + 1, month - 1, day, hour, minute);
  }
  return start.getTime() > now.getTime() ? start.getTime() : null;
}

// "10", "10,50" ou "10.50" -> centavos.
export function parseMoney(value: string): number | null {
  const normalized = value.replace(/[^\d,.]/g, '').replace(',', '.');
  const n = Number(normalized);
  return normalized && Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}
