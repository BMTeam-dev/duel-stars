import * as React from 'react';
import { forwardRef, useState } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { colors } from '../../../../configs/colors';
import { AppSheet } from '../../../../shared/ui/AppSheet';
import { Button } from '../../../../shared/ui/Button';
import { TextField } from '../../../../shared/ui/TextField';
import { OptionChips } from '../OptionChips';
import { formatDeadlineLong, maskDate, maskTime, parseStart, toDateFields } from '../../parse';
import { Body, Hint, Row, RowItem } from './styles';

export type RoundSheetMode = 'start' | 'deadline' | 'notice';

type Props = {
  mode: RoundSheetMode;
  // Rótulo da rodada (pro título e pro aviso sugerido).
  label: string;
  busy: boolean;
  onSubmit: (deadlineAt: number | null, message: string) => void;
};

const NOTICE_MAX = 280;
const DAY = 24 * 60 * 60 * 1000;
// Atalhos: daqui a N dias, no horário digitado (ou 22h).
const SHORTCUTS = [1, 3, 7];

const suggestedMessage = (label: string, deadline: number | null) =>
  deadline
    ? `${label}, vai até ${formatDeadlineLong(deadline)}. Preciso do report até lá.`
    : `${label} começou. Reportem o resultado assim que jogarem.`;

const TITLES: Record<RoundSheetMode, string> = {
  start: 'Iniciar rodada',
  deadline: 'Alterar prazo',
  notice: 'Publicar aviso',
};

// Formulário do organizador nas rodadas manuais: prazo (data e hora, ou sem
// prazo) e o aviso que vai por notificação pra todos.
export const RoundSheet = forwardRef<BottomSheetModal, Props>(({ mode, label, busy, onSubmit }, ref) => {
  const [withDeadline, setWithDeadline] = useState(true);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('22:00');
  const [message, setMessage] = useState('');
  const [messageTouched, setMessageTouched] = useState(false);

  const deadline = withDeadline ? parseStart(date, time) : null;
  const askDeadline = mode !== 'notice';
  const askMessage = mode !== 'deadline';
  // Enquanto a pessoa não mexe no aviso, ele acompanha o prazo escolhido.
  const shownMessage = messageTouched || mode === 'notice' ? message : suggestedMessage(label, deadline);

  const reset = () => {
    setWithDeadline(true);
    setDate('');
    setTime('22:00');
    setMessage('');
    setMessageTouched(false);
  };

  const pickShortcut = (days: number) => {
    const [h, m] = (/^\d{2}:\d{2}$/.test(time) ? time : '22:00').split(':').map(Number);
    const target = new Date(Date.now() + days * DAY);
    target.setHours(h, m, 0, 0);
    const fields = toDateFields(target.getTime());
    setDate(fields.date);
    setTime(fields.time);
  };

  const invalid = (askDeadline && withDeadline && !deadline) || (mode === 'notice' && shownMessage.trim().length < 3);

  return (
    <AppSheet ref={ref} title={mode === 'notice' ? TITLES.notice : `${TITLES[mode]} · ${label}`} onDismiss={reset}>
      <Body>
        {askDeadline && (
          <>
            <OptionChips<boolean>
              options={[
                { value: true, label: 'Com prazo' },
                { value: false, label: 'Sem prazo' },
              ]}
              value={withDeadline}
              onChange={setWithDeadline}
            />
            {withDeadline ? (
              <>
                <OptionChips<number | null>
                  options={SHORTCUTS.map(days => ({
                    value: days,
                    label: days === 1 ? 'Amanhã' : `Em ${days} dias`,
                  }))}
                  value={null}
                  onChange={days => days && pickShortcut(days)}
                />
                <Row>
                  <RowItem>
                    <TextField
                      label="Até o dia"
                      value={date}
                      onChangeText={value => setDate(maskDate(value))}
                      placeholder="DD/MM"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="number-pad"
                    />
                  </RowItem>
                  <RowItem>
                    <TextField
                      label="Às"
                      value={time}
                      onChangeText={value => setTime(maskTime(value))}
                      placeholder="HH:MM"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="number-pad"
                    />
                  </RowItem>
                </Row>
                <Hint>
                  Partida sem resultado no fim do prazo: vale o report de quem reportou; sem nenhum, derrota dupla.
                </Hint>
              </>
            ) : (
              <Hint>
                A rodada só termina quando todas as partidas tiverem resultado. Você pode dar W.O. nas paradas.
              </Hint>
            )}
          </>
        )}
        {askMessage && (
          <TextField
            label={mode === 'start' ? 'Aviso para os jogadores' : 'Aviso'}
            value={shownMessage}
            onChangeText={value => {
              setMessageTouched(true);
              setMessage(value);
            }}
            placeholder="Ex.: Rodada 3 atrasada, aguardem."
            placeholderTextColor={colors.text.muted}
            multiline
            maxLength={NOTICE_MAX}
            style={{ minHeight: 88 }}
            helper={`Vai por notificação para todos e fica fixo na tela do torneio. ${shownMessage.length}/${NOTICE_MAX}`}
          />
        )}
        <Button
          label={mode === 'start' ? 'Iniciar e avisar' : mode === 'deadline' ? 'Salvar prazo' : 'Publicar'}
          icon={mode === 'start' ? 'play' : mode === 'deadline' ? 'content-save' : 'bullhorn'}
          disabled={invalid}
          loading={busy}
          onPress={() => onSubmit(askDeadline ? deadline : null, askMessage ? shownMessage.trim() : '')}
        />
      </Body>
    </AppSheet>
  );
});
