// "há 5 min", "há 2 h", "há 3 dias" - texto relativo dos posts do feed.
export function timeAgo(millis: number | null, now = Date.now()): string {
  if (millis === null) return 'agora';
  const minutes = Math.floor((now - millis) / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  return new Date(millis).toLocaleDateString('pt-BR');
}
