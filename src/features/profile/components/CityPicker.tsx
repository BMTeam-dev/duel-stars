import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { colors } from '../../../configs/colors';
import { fontSize, radius, spacing } from '../../../configs/theme';
import { fetchCities, normalizeSearch, STATES } from '../../../services/ibge/ibge.service';
import { City } from '../../../services/profile/profile.types';
import { Button } from '../../../shared/ui/Button';
import { Icon } from '../../../shared/ui/Icon';
import { TextField } from '../../../shared/ui/TextField';

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

const Container = styled.View`
  flex: 1;
`;

const SectionLabel = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: ${spacing.sm}px;
`;

const Chip = styled.Pressable<{ active: boolean }>`
  min-width: 52px;
  height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0 ${spacing.md}px;
  /* Metade da altura, e não radius.pill: no Android, um raio maior que a
     metade do lado com borda desenha o chip cortado em cima e embaixo. */
  border-radius: 20px;
  border-width: 1px;
  border-color: ${({ active }) => (active ? colors.gold.main : colors.border)};
  background-color: ${({ active }) => (active ? colors.gold.soft : 'transparent')};
`;

const ChipText = styled.Text<{ active: boolean }>`
  color: ${({ active }) => (active ? colors.gold.main : colors.text.secondary)};
  font-weight: 700;
`;

const Spacer = styled.View`
  height: ${spacing.lg}px;
`;

const CityRow = styled.Pressable<{ selected: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: ${spacing.md}px ${spacing.md}px;
  border-radius: ${radius.sm}px;
  background-color: ${({ selected }) => (selected ? colors.gold.soft : 'transparent')};
`;

const CityName = styled.Text<{ selected: boolean }>`
  color: ${({ selected }) => (selected ? colors.gold.main : colors.text.primary)};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: ${({ selected }) => (selected ? 700 : 400)};
`;

const Retry = styled.View`
  gap: ${spacing.md}px;
  margin-top: ${spacing.lg}px;
`;

const Message = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
  text-align: center;
  margin-top: ${spacing.lg}px;
`;
