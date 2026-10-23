import { City } from '../profile/profile.types';

export const STATES = [
  'AC',
  'AL',
  'AM',
  'AP',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MG',
  'MS',
  'MT',
  'PA',
  'PB',
  'PE',
  'PI',
  'PR',
  'RJ',
  'RN',
  'RO',
  'RR',
  'RS',
  'SC',
  'SE',
  'SP',
  'TO',
] as const;

// Quem joga de fora do Brasil (ex.: Duel Links): uma "cidade" só pra todos,
// que vira o ranking "Exterior". Sem estado - ver formatPlace().
export const ABROAD: City = { id: 'exterior', name: 'Exterior', stateId: '' };

// "Campinas · SP", ou só "Exterior".
export function formatPlace(cityName: string, stateId: string): string {
  return stateId ? `${cityName} · ${stateId}` : cityName;
}

const cache = new Map<string, City[]>();

// API pública de localidades do IBGE - id do município é o código oficial,
// que vira o cityId do perfil (estável mesmo se o nome tiver grafia diferente).
export async function fetchCities(stateId: string): Promise<City[]> {
  const cached = cache.get(stateId);
  if (cached) return cached;

  const response = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateId}/municipios?orderBy=nome`,
  );
  if (!response.ok) {
    throw new Error(`IBGE respondeu ${response.status}`);
  }
  const data = (await response.json()) as { id: number; nome: string }[];
  const cities = data.map(item => ({
    id: String(item.id),
    name: item.nome,
    stateId,
  }));
  cache.set(stateId, cities);
  return cities;
}

// Busca sem diferenciar acento nem maiúscula ("sao paulo" acha "São Paulo").
export function normalizeSearch(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
