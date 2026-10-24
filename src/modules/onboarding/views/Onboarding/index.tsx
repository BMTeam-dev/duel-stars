import * as React from 'react';
import { useEffect, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../../configs/colors';
import { spacing } from '../../../../configs/theme';
import { OnboardingProps } from '../../../../navigation/props';
import { useAppSelector } from '../../../../redux/store';
import { analyticsService } from '../../../../services/analytics/analytics.service';
import { signOut } from '../../../../services/auth/auth.service';
import { enableNotifications } from '../../../../services/notifications/notifications.service';
import { createProfile, NickStatus } from '../../../../services/profile/profile.service';
import { City, INITIAL_STARS } from '../../../../services/profile/profile.types';
import { Avatar } from '../../../../shared/ui/Avatar';
import { Button } from '../../../../shared/ui/Button';
import { useDialog } from '../../../../shared/ui/dialog/DialogProvider';
import { Icon } from '../../../../shared/ui/Icon';
import { toast } from '../../../../shared/ui/toast';
import { CityPicker } from '../../../profile/components/CityPicker';
import { NickField } from '../../../profile/components/NickField';
import {
  BackButton,
  Body,
  ChoiceCard,
  ChoiceText,
  Footer,
  Header,
  PhotoPreview,
  ProgressFill,
  ProgressTrack,
  StarCircle,
  StarsNumber,
  StepSubtitle,
  StepTitle,
} from './styles';

type Step = 'nick' | 'photo' | 'city' | 'notifications' | 'done';
const STEPS: Step[] = ['nick', 'photo', 'city', 'notifications', 'done'];

// Uma tela só com os passos em estado local: nada é gravado até o último
// passo, então desistir no meio não deixa perfil pela metade no Firestore.
// Ao gravar, o listener do perfil (useProfileListener) troca o navigator
// pro app sozinho.
function OnboardingScreen(_: OnboardingProps) {
  const authUser = useAppSelector(state => state.auth.user);
  const uid = authUser?.uid ?? '';

  const [step, setStep] = useState<Step>('nick');
  const [nick, setNick] = useState('');
  const [nickStatus, setNickStatus] = useState<NickStatus | 'checking' | null>(null);
  const [useAccountPhoto, setUseAccountPhoto] = useState(!!authUser?.photoUrl);
  const [city, setCity] = useState<City | null>(null);
  const [notifications, setNotifications] = useState<{ granted: boolean; token: string | null }>({
    granted: false,
    token: null,
  });
  const [askingPermission, setAskingPermission] = useState(false);
  const [saving, setSaving] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const photoUrl = useAccountPhoto ? authUser?.photoUrl ?? null : null;
  const goTo = (next: Step) => setStep(next);
  const { showDialog } = useDialog();

  // No primeiro passo, voltar = sair pro login (conta errada, desistiu do
  // e-mail...). A conta fica sem perfil; entrando de novo, o cadastro recomeça.
  const goBack = async () => {
    if (saving) return;
    if (stepIndex > 0) {
      setStep(STEPS[stepIndex - 1]);
      return;
    }
    const confirmed = await showDialog({
      icon: 'logout',
      title: 'Voltar para o login?',
      message: 'Seu cadastro ainda não terminou. Quando entrar de novo, é só continuar daqui.',
      confirmLabel: 'Voltar',
      cancelLabel: 'Cancelar',
    });
    if (confirmed) await signOut();
  };

  // Voltar do Android segue o mesmo caminho em vez de fechar o app.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => subscription.remove();
  });

  const handleEnableNotifications = async () => {
    setAskingPermission(true);
    try {
      setNotifications(await enableNotifications());
    } finally {
      setAskingPermission(false);
      goTo('done');
    }
  };

  const handleFinish = async () => {
    if (!city) return;
    setSaving(true);
    try {
      await createProfile(uid, {
        nick,
        photoUrl,
        city,
        notificationsEnabled: notifications.granted,
        fcmToken: notifications.token,
      });
      analyticsService.logOnboardingCompleted();
    } catch (error) {
      setSaving(false);
      // As regras recusam o batch se alguém pegou o nick nesse meio tempo.
      if ((error as { code?: string }).code === 'firestore/permission-denied') {
        toast.error('Esse nick acabou de ser escolhido por outra pessoa. Escolha outro.');
        setNickStatus('taken');
        goTo('nick');
      } else {
        toast.error('Não foi possível salvar. Verifique a internet e tente de novo.');
      }
    }
  };

  const canContinue =
    (step === 'nick' && (nickStatus === 'available' || nickStatus === 'yours')) ||
    step === 'photo' ||
    (step === 'city' && !!city);

  const renderStep = () => {
    switch (step) {
      case 'nick':
        return (
          <>
            <StepTitle>Escolha seu @nick</StepTitle>
            <StepSubtitle>É assim que os outros duelistas vão te ver no feed e no ranking.</StepSubtitle>
            <NickField uid={uid} value={nick} onChange={setNick} onStatusChange={setNickStatus} />
          </>
        );
      case 'photo':
        return (
          <>
            <StepTitle>Sua foto</StepTitle>
            <StepSubtitle>Aparece no seu perfil e nos seus duelos.</StepSubtitle>
            <PhotoPreview>
              <Avatar name={nick} photoUrl={photoUrl} size={112} />
            </PhotoPreview>
            {!!authUser?.photoUrl && (
              <ChoiceCard selected={useAccountPhoto} onPress={() => setUseAccountPhoto(true)}>
                <Icon name="google" color={useAccountPhoto ? colors.gold.main : colors.text.secondary} />
                <ChoiceText selected={useAccountPhoto}>Usar a foto da minha conta Google</ChoiceText>
              </ChoiceCard>
            )}
            <ChoiceCard selected={!useAccountPhoto} onPress={() => setUseAccountPhoto(false)}>
              <Icon name="alpha-a-circle" color={!useAccountPhoto ? colors.gold.main : colors.text.secondary} />
              <ChoiceText selected={!useAccountPhoto}>Usar a inicial do meu nick</ChoiceText>
            </ChoiceCard>
          </>
        );
      case 'city':
        return (
          <>
            <StepTitle>Sua cidade</StepTitle>
            <StepSubtitle>Seus duelos contam para o ranking e o feed dela.</StepSubtitle>
            <CityPicker selected={city} onSelect={setCity} />
          </>
        );
      case 'notifications':
        return (
          <>
            <StarCircle>
              <Icon name="bell-ring" size={48} color={colors.gold.main} />
            </StarCircle>
            <StepTitle center>Ativar notificações?</StepTitle>
            <StepSubtitle center>
              Para saber na hora quando alguém te desafiar e quando for preciso confirmar o
              resultado de um duelo.
            </StepSubtitle>
          </>
        );
      case 'done':
        return (
          <>
            <StarCircle>
              <Icon name="star-four-points" size={56} color={colors.gold.main} />
            </StarCircle>
            <StepTitle center>Tudo pronto, @{nick}!</StepTitle>
            <StepSubtitle center>Você começa com</StepSubtitle>
            <StarsNumber>{INITIAL_STARS} estrelas</StarsNumber>
            <StepSubtitle center>
              em cada categoria: TCG, Master Duel e Duel Links. Desafie alguém, aposte estrelas e suba
              no ranking de {city?.name}.
            </StepSubtitle>
          </>
        );
    }
  };

  const renderFooter = () => {
    switch (step) {
      case 'notifications':
        return (
          <>
            <Button
              label="Ativar notificações"
              icon="bell"
              loading={askingPermission}
              onPress={handleEnableNotifications}
            />
            <Button label="Agora não" variant="ghost" onPress={() => goTo('done')} />
          </>
        );
      case 'done':
        return <Button label="Começar a duelar" size="lg" loading={saving} onPress={handleFinish} />;
      default:
        return (
          <Button
            label="Continuar"
            disabled={!canContinue}
            onPress={() => goTo(STEPS[stepIndex + 1])}
          />
        );
    }
  };

  // O passo da cidade tem uma lista própria (FlatList), que não pode ficar
  // dentro de outro ScrollView.
  const scrollable = step !== 'city';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Header>
          {step !== 'done' ? (
            <BackButton onPress={goBack} hitSlop={12}>
              <Icon name="arrow-left" />
            </BackButton>
          ) : (
            <BackButton disabled />
          )}
          <ProgressTrack>
            <ProgressFill progress={(stepIndex + 1) / STEPS.length} />
          </ProgressTrack>
        </Header>

        {scrollable ? (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, padding: spacing.xl }}
            keyboardShouldPersistTaps="handled"
          >
            {renderStep()}
          </ScrollView>
        ) : (
          <Body>{renderStep()}</Body>
        )}

        <Footer>{renderFooter()}</Footer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default OnboardingScreen;
