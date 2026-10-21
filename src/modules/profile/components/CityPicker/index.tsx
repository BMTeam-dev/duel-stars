import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView } from 'react-native';
import { colors } from '../../../../configs/colors';
import { spacing } from '../../../../configs/theme';
import { fetchCities, normalizeSearch, STATES } from '../../../../services/ibge/ibge.service';
import { City } from '../../../../services/profile/profile.types';
import { Button } from '../../../../shared/ui/Button';
import { Icon } from '../../../../shared/ui/Icon';
import { TextField } from '../../../../shared/ui/TextField';
import {
  Container,
  SectionLabel,
  Chip,
  ChipText,
  Spacer,
  CityRow,
  CityName,
  Retry,
  Message,
} from './styles';

type Props = {
  selected: City | null;
  onSelect: (city: City) => void;
};

// Estado primeiro, depois a cidade: a lista de um estado só (até ~850
// cidades em MG) cabe bem numa busca local, sem baixar os 5.570 municípios.
export function CityPicker({ selected, onSelect }: Props) {
  const [stateId, setStateId] = useState<string | null>(selected?.stateId ?? null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!stateId) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchCities(stateId)
      .then(result => !cancelled && setCities(result))
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [stateId, attempt]);

  const filtered = useMemo(() => {
    const term = normalizeSearch(query);
    return term ? cities.filter(city => normalizeSearch(city.name).includes(term)) : cities;
  }, [cities, query]);

  return (
    <Container>
      <SectionLabel>Estado</SectionLabel>
      {/* flexGrow 0: dentro de um container flex, a lista horizontal
      // ocuparia a altura toda e esticaria os chips até o fim da tela. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0, height: 48 }}
        contentContainerStyle={{ gap: spacing.sm, alignItems: 'center' }}
      >
        {STATES.map(uf => (
          <Chip
            key={uf}
            active={uf === stateId}
            onPress={() => {
              setStateId(uf);
              setQuery('');
            }}
          >
            <ChipText active={uf === stateId}>{uf}</ChipText>
          </Chip>
        ))}
      </ScrollView>

      {stateId && (
        <>
          <Spacer />
          <TextField label="Buscar cidade" value={query} onChangeText={setQuery} autoCorrect={false} />
          {loading ? (
            <ActivityIndicator color={colors.gold.main} style={{ marginTop: spacing.xl }} />
          ) : error ? (
            <Retry>
              <Message>Não foi possível carregar as cidades.</Message>
              <Button label="Tentar de novo" variant="secondary" onPress={() => setAttempt(n => n + 1)} />
            </Retry>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={city => city.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = item.id === selected?.id;
                return (
                  <CityRow onPress={() => onSelect(item)} selected={isSelected}>
                    <CityName selected={isSelected}>{item.name}</CityName>
                    {isSelected && <Icon name="check-circle" color={colors.gold.main} size={20} />}
                  </CityRow>
                );
              }}
              ListEmptyComponent={<Message>Nenhuma cidade com esse nome em {stateId}.</Message>}
            />
          )}
        </>
      )}
    </Container>
  );
}
