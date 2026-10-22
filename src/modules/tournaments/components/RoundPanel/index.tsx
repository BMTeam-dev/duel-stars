import * as React from 'react';
import { colors } from '../../../../configs/colors';
import { formatStart, Tournament } from '../../../../services/tournaments/tournaments.types';
import { Button } from '../../../../shared/ui/Button';
import { Icon } from '../../../../shared/ui/Icon';
import { Action, Actions, Card, Deadline, Header, Muted, Notice, NoticeLabel, NoticeText, Title } from './styles';

type Props = {
  t: Tournament;
  isOrganizer: boolean;
  // Rótulo da rodada pronta (confrontos 'ready'), se houver.
  readyLabel: string | null;
  busy: boolean;
  onStartRound: () => void;
  onChangeDeadline: () => void;
  onPostNotice: () => void;
};

// Topo do torneio em andamento: a rodada atual com o prazo e o aviso fixo do
// organizador (o "canal de avisos"). No modo manual, o organizador inicia
// cada rodada e muda o prazo daqui.
export function RoundPanel({ t, isOrganizer, readyLabel, busy, onStartRound, onChangeDeadline, onPostNotice }: Props) {
  const manual = t.roundMode === 'manual';
  const playing = manual && t.roundPhase === 'playing';
  const ready = manual && t.roundPhase === 'ready' && !!readyLabel;
  const late = !!t.roundDeadlineAt && t.roundDeadlineAt < Date.now();
  if (!t.notice && !playing && !ready && !isOrganizer) return null;

  return (
    <Card>
      {playing && (
        <>
          <Header>
            <Icon name="timer-sand" size={18} color={colors.gold.main} />
            <Title>{t.roundLabel ?? 'Rodada em jogo'}</Title>
          </Header>
          <Deadline late={late}>
            {t.roundDeadlineAt
              ? `${late ? 'Prazo encerrado' : 'Vai até'} ${formatStart(t.roundDeadlineAt)}`
              : 'Sem prazo: segue até todos reportarem'}
          </Deadline>
        </>
      )}
      {ready && (
        <>
          <Header>
            <Icon name="flag-checkered" size={18} color={colors.gold.main} />
            <Title>{readyLabel} pronta</Title>
          </Header>
          <Muted>
            {isOrganizer
              ? 'Os confrontos já estão na aba Rodadas. Inicie quando quiser, com o prazo e o aviso.'
              : 'Os confrontos já estão definidos. A rodada começa quando o organizador iniciar.'}
          </Muted>
        </>
      )}
      {!!t.notice && (
        <Notice>
          <NoticeLabel>Aviso do organizador</NoticeLabel>
          <NoticeText>{t.notice.text}</NoticeText>
          {!!t.notice.at && <Muted>{formatStart(t.notice.at)}</Muted>}
        </Notice>
      )}
      {isOrganizer && (
        <>
          {ready && <Button label={`Iniciar ${readyLabel}`} icon="play" loading={busy} onPress={onStartRound} />}
          <Actions>
            {playing && (
              <Action>
                <Button label="Alterar prazo" icon="calendar-clock" variant="secondary" onPress={onChangeDeadline} />
              </Action>
            )}
            <Action>
              <Button label="Publicar aviso" icon="bullhorn" variant="secondary" onPress={onPostNotice} />
            </Action>
          </Actions>
        </>
      )}
    </Card>
  );
}
