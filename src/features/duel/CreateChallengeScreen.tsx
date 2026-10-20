import * as React from 'react';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import styled from 'styled-components/native';
import { colors } from '../../configs/colors';
import { fontSize, radius, spacing } from '../../configs/theme';
import { CreateChallengeProps } from '../../navigation/props';
import { useAppSelector } from '../../redux/store';
import {
  cancelChallenge,
  challengeQrValue,
  createChallenge,
  duelErrorMessage,
  subscribeChallenge,
} from '../../services/duels/duels.service';
import { DuelFormat, FORMAT_LABEL, MAX_STAKE, MIN_STAKE } from '../../services/duels/duels.types';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { toast } from '../../shared/ui/toast';
import { ScreenHeader } from './ScreenHeader';

type Challenge = { token: string; code: string; expiresAt: number };

function CreateChallengeScreen({ navigation }: CreateChallengeProps) {
  const profile = useAppSelector(state => state.profile.profile);
  const freeStars = profile ? profile.stars - profile.lockedStars : 0;
  const maxStake = Math.min(MAX_STAKE, freeStars);

  const [stake, setStake] = useState(Math.min(5, Math.max(maxStake, MIN_STAKE)));
  const [format, setFormat] = useState<DuelFormat>('bo1');
  const [creating, setCreating] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [now, setNow] = useState(Date.now());

  // Quando o oponente aceita, o backend marca o desafio como usado e grava o
  // duelo - aí esta tela é trocada pela do duelo (replace: voltar não deve
  // reabrir um QR já usado).
  useEffect(() => {
    if (!challenge) return;
    return subscribeChallenge(challenge.token, ({ status, duelId }) => {
      if (status === 'used' && duelId) navigation.replace('Duel', { duelId });
    });
  }, [challenge, navigation]);

  useEffect(() => {
    if (!challenge) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [challenge]);

  const secondsLeft = challenge ? Math.max(0, Math.ceil((challenge.expiresAt - now) / 1000)) : 0;
  const expired = !!challenge && secondsLeft === 0;

  const handleCreate = async () => {
    setCreating(true);
    try {
      const result = await createChallenge(stake, format);
      setNow(Date.now());
      setChallenge(result);
    } catch (error) {
      toast.error(duelErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    // Cancela pra ninguém usar um print do QR enquanto ele ainda vale.
    if (challenge && !expired) cancelChallenge(challenge.token).catch(() => undefined);
    navigation.goBack();
  };

  if (!profile) return null;

  if (challenge) {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = String(secondsLeft % 60).padStart(2, '0');
    return (
      <Screen>
        <ScreenHeader title="Seu desafio" onBack={handleClose} backIcon="close" />
        <QrBody>
          <Summary>
            {stake} {stake === 1 ? 'estrela' : 'estrelas'} · {FORMAT_LABEL[format]}
          </Summary>
          <QrFrame expired={expired}>
            <QRCode
              value={challengeQrValue(challenge.token)}
              size={240}
              color={colors.background}
              backgroundColor={colors.white}
            />
          </QrFrame>
          {expired ? (
            <>
              <Hint>Esse QR expirou.</Hint>
              <Button label="Gerar outro QR" icon="refresh" onPress={() => setChallenge(null)} />
            </>
          ) : (
            <>
              <Countdown>
                {minutes}:{seconds}
              </Countdown>
              <Hint>Mostre este QR para o seu oponente escanear em Desafiar → Escanear QR.</Hint>
              <CodeLabel>Se a câmera não ler, ele pode digitar o código</CodeLabel>
              <CodeValue selectable>{challenge.code}</CodeValue>
              <Waiting>
                <Icon name="timer-sand" size={18} color={colors.text.secondary} />
                <WaitingText>Esperando o oponente aceitar...</WaitingText>
              </Waiting>
            </>
          )}
        </QrBody>
      </Screen>
    );
  }

  const canChallenge = maxStake >= MIN_STAKE;

  return (
    <Screen>
      <ScreenHeader title="Gerar meu QR" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <Label>Aposta</Label>
        {canChallenge ? (
          <>
            <StakeRow>
              <StepButton
                onPress={() => setStake(s => Math.max(MIN_STAKE, s - 1))}
                disabled={stake <= MIN_STAKE}
                accessibilityLabel="Diminuir aposta"
              >
                <Icon name="minus" size={28} />
              </StepButton>
              <StakeValueBox>
                <Icon name="star-four-points" size={28} color={colors.gold.main} />
                <StakeValue>{stake}</StakeValue>
              </StakeValueBox>
              <StepButton
                onPress={() => setStake(s => Math.min(maxStake, s + 1))}
                disabled={stake >= maxStake}
                accessibilityLabel="Aumentar aposta"
              >
                <Icon name="plus" size={28} />
              </StepButton>
            </StakeRow>
            <Hint>
              Você tem {freeStars} {freeStars === 1 ? 'estrela livre' : 'estrelas livres'}. A aposta vai de{' '}
              {MIN_STAKE} a {maxStake}.
            </Hint>
          </>
        ) : (
          <Hint>
            Você não tem estrelas livres para apostar agora. Termine os duelos em andamento ou espere a
            recarga semanal.
          </Hint>
        )}

        <Label>Formato</Label>
        <FormatRow>
          {(['bo1', 'bo3'] as DuelFormat[]).map(option => (
            <FormatOption key={option} selected={format === option} onPress={() => setFormat(option)}>
              <FormatText selected={format === option}>{FORMAT_LABEL[option]}</FormatText>
            </FormatOption>
          ))}
        </FormatRow>
        <Hint>Quem vencer leva as estrelas apostadas pelos dois. O QR vale por 5 minutos.</Hint>
      </ScrollView>
      <Footer>
        <Button
          label="Gerar QR"
          icon="qrcode"
          size="lg"
          disabled={!canChallenge}
          loading={creating}
          onPress={handleCreate}
        />
      </Footer>
    </Screen>
  );
}

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.background};
`;

const Label = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: ${spacing.md}px;
`;

const StakeRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing.md}px;
`;

const StepButton = styled.Pressable<{ disabled?: boolean }>`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  align-items: center;
  justify-content: center;
  background-color: ${colors.surfaceRaised};
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
`;

const StakeValueBox = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.sm}px;
`;

const StakeValue = styled.Text`
  color: ${colors.gold.main};
  font-size: 56px;
  font-weight: 900;
`;

const Hint = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
  line-height: 20px;
  text-align: center;
  margin-bottom: ${spacing.xl}px;
`;

const FormatRow = styled.View`
  flex-direction: row;
  gap: ${spacing.md}px;
  margin-bottom: ${spacing.md}px;
`;

const FormatOption = styled.Pressable<{ selected: boolean }>`
  flex: 1;
  align-items: center;
  padding: ${spacing.lg}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${({ selected }) => (selected ? colors.gold.main : colors.border)};
  background-color: ${({ selected }) => (selected ? colors.gold.soft : colors.surface)};
`;

const FormatText = styled.Text<{ selected: boolean }>`
  color: ${({ selected }) => (selected ? colors.gold.main : colors.text.primary)};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 700;
`;

const Footer = styled.View`
  padding: ${spacing.lg}px ${spacing.xl}px;
`;

const QrBody = styled.View`
  flex: 1;
  align-items: center;
  padding: ${spacing.xl}px;
`;

const Summary = styled.Text`
  color: ${colors.gold.main};
  font-size: ${fontSize.title}px;
  font-weight: 800;
  margin-bottom: ${spacing.xl}px;
`;

const QrFrame = styled.View<{ expired: boolean }>`
  padding: ${spacing.lg}px;
  border-radius: ${radius.lg}px;
  background-color: ${colors.white};
  opacity: ${({ expired }) => (expired ? 0.2 : 1)};
  margin-bottom: ${spacing.xl}px;
`;

const Countdown = styled.Text`
  color: ${colors.text.primary};
  font-size: 40px;
  font-weight: 800;
  margin-bottom: ${spacing.md}px;
`;

const CodeLabel = styled.Text`
  color: ${colors.text.muted};
  font-size: ${fontSize.caption}px;
  margin-bottom: ${spacing.xs}px;
`;

const CodeValue = styled.Text`
  color: ${colors.text.primary};
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 8px;
  margin-bottom: ${spacing.xl}px;
`;

const Waiting = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.sm}px;
`;

const WaitingText = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
`;

export default CreateChallengeScreen;
