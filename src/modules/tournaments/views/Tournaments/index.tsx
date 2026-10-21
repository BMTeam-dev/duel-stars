import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { colors } from '../../../../configs/colors';
import { spacing } from '../../../../configs/theme';
import { TournamentsProps } from '../../../../navigation/props';
import { useAppSelector } from '../../../../redux/store';
import { CATEGORY_LABEL } from '../../../../services/duels/duels.types';
import { listenerError } from '../../../../services/firestore/listenerError';
import { useActiveCategory } from '../../../../services/profile/useActiveCategory';
import {
  findTournamentByCode,
  normalizeTournamentCode,
  subscribeMyTournaments,
  subscribeOpenTournaments,
} from '../../../../services/tournaments/tournaments.service';
import { Tournament, TOURNAMENT_CODE_LENGTH } from '../../../../services/tournaments/tournaments.types';
import { AppSheet } from '../../../../shared/ui/AppSheet';
import { Button } from '../../../../shared/ui/Button';
import { CategoryTabs } from '../../../../shared/ui/CategoryTabs';
import { EmptyState } from '../../../../shared/ui/EmptyState';
import { Icon } from '../../../../shared/ui/Icon';
import { TextField } from '../../../../shared/ui/TextField';
import { toast } from '../../../../shared/ui/toast';
import { TournamentCard } from '../../../../shared/ui/TournamentCard';
import { OptionChips } from '../../components/OptionChips';
import { Actions, HeaderButton, HeaderButtonText, Header, Screen, Title, TitleRow } from './styles';

type Tab = 'open' | 'mine';

function TournamentsScreen({ navigation }: TournamentsProps) {
  const uid = useAppSelector(state => state.profile.profile?.uid) ?? '';
  const { category, setCategory } = useActiveCategory();
  const [tab, setTab] = useState<Tab>('open');
  const [list, setList] = useState<Tournament[] | null>(null);
  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);
  const codeSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    setList(null);
    const onError = (error: Error) => {
      listenerError('tournamentsList')(error);
      setList([]);
    };
    return tab === 'open'
      ? subscribeOpenTournaments(category, 50, setList, onError)
      : subscribeMyTournaments(uid, setList, onError);
  }, [tab, category, uid]);

  const openByCode = async () => {
    setSearching(true);
    try {
      const id = await findTournamentByCode(code);
      if (!id) {
        toast.error('Nenhum torneio com esse código.');
        return;
      }
      codeSheetRef.current?.dismiss();
      setCode('');
      navigation.navigate('Tournament', { tournamentId: id });
    } catch {
      toast.error('Não foi possível buscar agora. Tente de novo.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <Header>
        <TitleRow>
          <Title>Torneios</Title>
          <Actions>
            <HeaderButton onPress={() => codeSheetRef.current?.present()} hitSlop={8}>
              <Icon name="pound" size={18} color={colors.text.secondary} />
              <HeaderButtonText>Código</HeaderButtonText>
            </HeaderButton>
            <HeaderButton primary onPress={() => navigation.navigate('CreateTournament')} hitSlop={8}>
              <Icon name="plus" size={18} color={colors.gold.on} />
              <HeaderButtonText primary>Criar</HeaderButtonText>
            </HeaderButton>
          </Actions>
        </TitleRow>
        {/* "Meus" mostra todas as categorias; "Abertos" segue a ativa. */}
        {tab === 'open' && <CategoryTabs value={category} onChange={setCategory} />}
        <OptionChips<Tab>
          options={[
            { value: 'open', label: 'Abertos' },
            { value: 'mine', label: 'Meus' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </Header>

      {list === null ? (
        <ActivityIndicator color={colors.gold.main} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={t => t.id}
          contentContainerStyle={{ flexGrow: 1, gap: spacing.sm, padding: spacing.lg, paddingTop: 0 }}
          renderItem={({ item }) => (
            <TournamentCard
              tournament={item}
              onPress={() => navigation.navigate('Tournament', { tournamentId: item.id })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="tournament"
              title={tab === 'open' ? 'Nenhum torneio aberto' : 'Você ainda não tem torneios'}
              message={
                tab === 'open'
                  ? `Nenhum torneio de ${CATEGORY_LABEL[category]} com inscrições abertas. Que tal criar o primeiro?`
                  : 'Os torneios em que você se inscrever ou que organizar aparecem aqui.'
              }
            />
          }
        />
      )}

      <AppSheet ref={codeSheetRef} title="Entrar com código">
        <TextField
          label="Código do torneio"
          value={code}
          onChangeText={text => setCode(normalizeTournamentCode(text))}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={TOURNAMENT_CODE_LENGTH}
        />
        <Button
          label="Buscar torneio"
          disabled={code.length !== TOURNAMENT_CODE_LENGTH}
          loading={searching}
          onPress={openByCode}
        />
      </AppSheet>
    </Screen>
  );
}

export default TournamentsScreen;
