import * as React from 'react';
import { forwardRef, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, useWindowDimensions } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { colors } from '../../../../configs/colors';
import { getDeckUrl } from '../../../../services/tournaments/tournaments.service';
import { TournamentPlayer } from '../../../../services/tournaments/tournaments.types';
import { AppSheet } from '../../../../shared/ui/AppSheet';
import { Button } from '../../../../shared/ui/Button';
import { TextField } from '../../../../shared/ui/TextField';
import { DECK_STATUS } from '../DeckCard';
import { Body, Loading, Muted, Preview, Row, RowItem } from './styles';

type Props = {
  player: TournamentPlayer | null;
  nick: string;
  // Depois do início só dá pra ver.
  canReview: boolean;
  busy: boolean;
  onReview: (approved: boolean, reason: string) => void;
};

// Organizador confere o print do deck de um jogador e aprova ou recusa.
export const DeckReviewSheet = forwardRef<BottomSheetModal, Props>(
  ({ player, nick, canReview, busy, onReview }, ref) => {
    const { height } = useWindowDimensions();
    const [url, setUrl] = useState<string | null>(null);
    const [ratio, setRatio] = useState(0.5);
    const [failed, setFailed] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState('');
    const path = player?.deckPath ?? null;

    useEffect(() => {
      setUrl(null);
      setFailed(false);
      if (!path) return;
      getDeckUrl(path)
        .then(setUrl)
        .catch(() => setFailed(true));
    }, [path]);

    const reset = () => {
      setRejecting(false);
      setReason('');
    };

    const status = player?.deckStatus ?? 'missing';
    return (
      <AppSheet ref={ref} title={`Deck de @${nick}`} onDismiss={reset}>
        <Body>
          <Muted>Situação: {DECK_STATUS[status].label}</Muted>
          {!path ? (
            <Muted>Esse jogador ainda não enviou o print.</Muted>
          ) : url ? (
            <Preview
              source={{ uri: url }}
              resizeMode="contain"
              // Altura pela proporção da imagem, até metade da tela.
              style={{ height: Math.min(height * 0.5, 340 / ratio) }}
              onLoad={event => {
                const { width: w, height: h } = event.nativeEvent.source;
                if (w && h) setRatio(w / h);
              }}
            />
          ) : (
            <Loading>
              {failed ? (
                <Muted>Não foi possível abrir a imagem.</Muted>
              ) : (
                <ActivityIndicator color={colors.gold.main} />
              )}
            </Loading>
          )}
          {!!url && (
            <Button
              label="Abrir em tela cheia"
              icon="magnify-plus-outline"
              variant="ghost"
              onPress={() => Linking.openURL(url).catch(() => undefined)}
            />
          )}
          {canReview && !!path && rejecting && (
            <TextField
              label="Motivo (opcional)"
              value={reason}
              onChangeText={setReason}
              placeholder="Ex.: falta o side deck"
              placeholderTextColor={colors.text.muted}
              maxLength={140}
            />
          )}
          {canReview && !!path && (
            <Row>
              <RowItem>
                <Button
                  label={rejecting ? 'Recusar' : 'Recusar...'}
                  icon="close"
                  variant={rejecting ? 'danger' : 'secondary'}
                  loading={busy && rejecting}
                  onPress={() => (rejecting ? onReview(false, reason.trim()) : setRejecting(true))}
                />
              </RowItem>
              {!rejecting && (
                <RowItem>
                  <Button
                    label="Aprovar"
                    icon="check"
                    loading={busy}
                    disabled={status === 'approved'}
                    onPress={() => onReview(true, '')}
                  />
                </RowItem>
              )}
            </Row>
          )}
        </Body>
      </AppSheet>
    );
  },
);
