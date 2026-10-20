import * as React from 'react';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useCameraPermission } from 'react-native-vision-camera';
import styled from 'styled-components/native';
import { colors } from '../../configs/colors';
import { fontSize, radius, spacing } from '../../configs/theme';
import { ScanChallengeProps } from '../../navigation/props';
import {
  acceptChallenge,
  CHALLENGE_CODE_LENGTH,
  duelErrorMessage,
  normalizeChallengeCode,
  previewChallenge,
  tokenFromQr,
} from '../../services/duels/duels.service';
import { CATEGORY_LABEL, ChallengePreview, FORMAT_LABEL } from '../../services/duels/duels.types';
import { useActiveCategory } from '../../services/profile/useActiveCategory';
import { Avatar } from '../../shared/ui/Avatar';
import { Button } from '../../shared/ui/Button';
import { Icon } from '../../shared/ui/Icon';
import { TextField } from '../../shared/ui/TextField';
import { toast } from '../../shared/ui/toast';
import { QrScanner } from './QrScanner';
import { ScreenHeader } from './ScreenHeader';

type Step = 'scanning' | 'loading' | 'preview';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function ScanChallengeScreen({ navigation, route }: ScanChallengeProps) {
  const codeOnly = route.params?.mode === 'code';
  const { setCategory } = useActiveCategory();
  const isFocused = useIsFocused();
  const { hasPermission, requestPermission } = useCameraPermission();
  // A v4 não informa se ainda dá pra pedir; depois de uma recusa, o pedido
  // não abre mais nada - aí o caminho é a tela de configurações.
  const [denied, setDenied] = useState(false);
  const [step, setStep] = useState<Step>('scanning');
  const [token, setToken] = useState<string | null>(null);
  const [preview, setPreview] = useState<ChallengePreview | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [code, setCode] = useState('');
  // A câmera dispara vários frames com o mesmo QR - só o primeiro vale.
  const handlingRef = useRef(false);

  const loadPreview = useCallback(async (scanned: string) => {
    if (handlingRef.current) return;
    handlingRef.current = true;
    setStep('loading');
    setToken(scanned);
    try {
      setPreview(await previewChallenge(scanned));
      setStep('preview');
    } catch (error) {
      toast.error(duelErrorMessage(error));
      setStep('scanning');
      handlingRef.current = false;
    }
  }, []);

  const handleScanned = useCallback(
    (values: (string | undefined)[]) => {
      for (const value of values) {
        const scanned = tokenFromQr(value);
        if (scanned) {
          loadPreview(scanned);
          return;
        }
      }
    },
    [loadPreview],
  );

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const { duelId } = await acceptChallenge(token);
      // O duelo é da categoria do desafio: o app passa a mostrar ela.
      if (preview) setCategory(preview.category);
      navigation.replace('Duel', { duelId });
    } catch (error) {
      toast.error(duelErrorMessage(error));
      setAccepting(false);
    }
  };

  const scanAgain = () => {
    setPreview(null);
    setToken(null);
    setStep('scanning');
    handlingRef.current = false;
  };

  if (step === 'preview' && preview) {
    const { creator, headToHead } = preview;
    const played = headToHead.wins + headToHead.losses;
    return (
      <Screen>
        <ScreenHeader title="Aceitar desafio" onBack={scanAgain} />
        <PreviewBody>
          <Avatar name={creator.nick} photoUrl={creator.photoUrl} size={96} />
          <Nick>@{creator.nick}</Nick>
          <Meta>
            {creator.cityName} · {creator.stateId} · {creator.wins}V {creator.losses}D
          </Meta>
          <Challenge>te desafiou para um duelo</Challenge>

          <StakeCard>
            <Icon name="star-four-points" size={32} color={colors.gold.main} />
            <StakeText>
              {preview.stake} {preview.stake === 1 ? 'estrela' : 'estrelas'}
            </StakeText>
            <FormatText>
              {CATEGORY_LABEL[preview.category]} · {FORMAT_LABEL[preview.format]}
            </FormatText>
          </StakeCard>

          <Meta>
            {played === 0
              ? 'Primeiro duelo entre vocês.'
              : `Entre vocês: ${plural(headToHead.wins, 'vitória sua', 'vitórias suas')} e ${plural(
                  headToHead.losses,
                  'dele',
                  'dele',
                )}.`}
          </Meta>
        </PreviewBody>
        <Footer>
          <Button label="Aceitar e duelar" icon="sword-cross" size="lg" loading={accepting} onPress={handleAccept} />
          <Button label="Recusar" variant="ghost" onPress={() => navigation.goBack()} />
        </Footer>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={codeOnly ? 'Digitar código' : 'Escanear QR'} onBack={() => navigation.goBack()} />
      {codeOnly ? (
        <CodeIntro>
          <Icon name="keyboard" size={48} color={colors.gold.main} />
          <PermissionText>Digite o código de 6 letras e números que o oponente te mandou.</PermissionText>
        </CodeIntro>
      ) : !hasPermission ? (
        <PermissionBody>
          <Icon name="camera" size={56} color={colors.gold.main} />
          <PermissionText>Para ler o QR do desafio, o app precisa usar a câmera.</PermissionText>
          {!denied ? (
            <Button
              label="Permitir câmera"
              onPress={async () => setDenied(!(await requestPermission()))}
            />
          ) : (
            <Button label="Abrir configurações" variant="secondary" onPress={() => Linking.openSettings()} />
          )}
        </PermissionBody>
      ) : (
        <CameraBox>
          <QrScanner
            isActive={isFocused && step === 'scanning'}
            onScanned={handleScanned}
            onError={() => toast.error('Não foi possível usar a câmera.')}
          />
          <Viewfinder />
          {step === 'loading' && (
            <Loading>
              <ActivityIndicator size="large" color={colors.gold.main} />
            </Loading>
          )}
          <CameraHint>Aponte para o QR na tela do oponente</CameraHint>
        </CameraBox>
      )}
      {/* Alternativa à câmera (QR com reflexo, tela trincada, câmera ruim):
      // o código curto que aparece embaixo do QR do oponente. */}
      <CodeBox>
        <TextField
          label={codeOnly ? 'Código do desafio' : 'Não conseguiu ler? Digite o código'}
          value={code}
          onChangeText={text => setCode(normalizeChallengeCode(text))}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={CHALLENGE_CODE_LENGTH}
        />
        <Button
          label="Usar código"
          variant="secondary"
          disabled={code.length !== CHALLENGE_CODE_LENGTH || step !== 'scanning'}
          onPress={() => loadPreview(code)}
        />
      </CodeBox>
    </Screen>
  );
}

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.background};
`;

const PermissionBody = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: ${spacing.lg}px;
  padding: ${spacing.xl}px;
`;

const PermissionText = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.bodyLarge}px;
  text-align: center;
`;

const CodeIntro = styled.View`
  align-items: center;
  gap: ${spacing.lg}px;
  padding: ${spacing.xxl}px ${spacing.xl}px;
`;

const CameraBox = styled.View`
  flex: 1;
  margin: ${spacing.lg}px;
  border-radius: ${radius.lg}px;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  background-color: ${colors.surface};
`;

const Viewfinder = styled.View`
  width: 240px;
  height: 240px;
  border-radius: ${radius.lg}px;
  border-width: 3px;
  border-color: ${colors.gold.main};
`;

const Loading = styled.View`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  align-items: center;
  justify-content: center;
  background-color: ${colors.overlay};
`;

const CameraHint = styled.Text`
  position: absolute;
  bottom: ${spacing.xl}px;
  color: ${colors.white};
  font-size: ${fontSize.body}px;
  font-weight: 600;
`;

const CodeBox = styled.View`
  padding: 0 ${spacing.lg}px ${spacing.lg}px;
`;

const PreviewBody = styled.View`
  flex: 1;
  align-items: center;
  padding: ${spacing.xl}px;
`;

const Nick = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.headline}px;
  font-weight: 800;
  margin-top: ${spacing.md}px;
`;

const Meta = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
  text-align: center;
  margin-top: ${spacing.xs}px;
`;

const Challenge = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  margin-top: ${spacing.xl}px;
`;

const StakeCard = styled.View`
  align-self: stretch;
  align-items: center;
  gap: ${spacing.xs}px;
  padding: ${spacing.xl}px;
  margin: ${spacing.lg}px 0;
  border-radius: ${radius.lg}px;
  border-width: 1px;
  border-color: ${colors.gold.dark};
  background-color: ${colors.gold.soft};
`;

const StakeText = styled.Text`
  color: ${colors.gold.main};
  font-size: 32px;
  font-weight: 900;
`;

const FormatText = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 600;
`;

const Footer = styled.View`
  padding: ${spacing.lg}px ${spacing.xl}px;
  gap: ${spacing.sm}px;
`;

export default ScanChallengeScreen;
