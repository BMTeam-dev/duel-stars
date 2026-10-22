import * as React from 'react';
import { useEffect, useState } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../../../../configs/colors';
import { duelErrorMessage } from '../../../../services/duels/duels.service';
import { getDeckUrl, uploadDeck } from '../../../../services/tournaments/tournaments.service';
import { DeckStatus, Tournament, TournamentPlayer } from '../../../../services/tournaments/tournaments.types';
import { Button } from '../../../../shared/ui/Button';
import { Icon } from '../../../../shared/ui/Icon';
import { toast } from '../../../../shared/ui/toast';
import { Body, Card, Header, Status, Thumb, Title } from './styles';

type Props = {
  t: Tournament;
  me: TournamentPlayer;
  uid: string;
  // Depois do início o deck fica travado (só mostra).
  locked: boolean;
};

export const DECK_STATUS: Record<DeckStatus, { label: string; tone: 'gold' | 'positive' | 'negative' | 'muted' }> = {
  missing: { label: 'Sem print', tone: 'muted' },
  pending: { label: 'Em análise', tone: 'gold' },
  approved: { label: 'Aprovado', tone: 'positive' },
  rejected: { label: 'Recusado', tone: 'negative' },
};

const HELP: Record<DeckStatus, string> = {
  missing:
    'Este torneio pede o print do deck. Envie uma imagem com o deck completo (main, side e extra); só o organizador vê.',
  pending: 'O organizador vai conferir. Você recebe uma notificação quando ele aprovar.',
  approved: 'Deck aprovado. Se trocar a imagem, ela volta para análise.',
  rejected: 'O organizador recusou o print. Envie outro.',
};

// Print do deck do próprio jogador: enviar, trocar e ver o estado.
export function DeckCard({ t, me, uid, locked }: Props) {
  const status = me.deckStatus ?? 'missing';
  const [url, setUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!me.deckPath) return setUrl(null);
    getDeckUrl(me.deckPath)
      .then(setUrl)
      .catch(() => setUrl(null));
  }, [me.deckPath]);

  const pick = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      // Print de celular é alto: limita o tamanho sem perder as cartas.
      maxWidth: 1600,
      maxHeight: 2800,
      quality: 0.8,
    });
    const asset = result.assets?.[0];
    if (result.didCancel || !asset?.uri) return;
    if (result.errorMessage) {
      toast.error('Não foi possível abrir a imagem.');
      return;
    }
    setSending(true);
    try {
      await uploadDeck(t, uid, asset.uri, asset.type ?? 'image/jpeg');
      toast.success(t.organizerUid === uid ? 'Deck salvo' : 'Deck enviado para análise');
    } catch (error) {
      toast.error(duelErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <Header>
        <Icon name="cards" size={18} color={colors.gold.main} />
        <Title>Seu deck</Title>
        <Status tone={DECK_STATUS[status].tone}>{DECK_STATUS[status].label}</Status>
      </Header>
      {!locked && <Body>{status === 'rejected' && me.deckReason ? `Motivo: ${me.deckReason}` : HELP[status]}</Body>}
      {!!url && <Thumb source={{ uri: url }} resizeMode="contain" />}
      {!locked && (
        <Button
          label={me.deckPath ? 'Trocar print' : 'Enviar print do deck'}
          icon="image-plus"
          variant={status === 'approved' ? 'secondary' : 'primary'}
          loading={sending}
          onPress={pick}
        />
      )}
    </Card>
  );
}
