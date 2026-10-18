import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, Button } from 'react-native-paper';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../configs/colors';
import { LoginProps } from '../../navigation/props';
import { ScreensTypes } from '../../navigation/screensTypes';
import { signInWithEmail, signInWithGoogle, mapAuthError } from '../../services/auth/auth.service';
import { analyticsService } from '../../services/analytics/analytics.service';
import {
  GradientContainer,
  Container,
  BackButton,
  BackButtonIcon,
  AppName,
  Title,
  Subtitle,
  ErrorText,
  Field,
  DividerRow,
  DividerLine,
  DividerLabel,
  GoogleButton,
  GoogleButtonText,
  FooterRow,
  FooterText,
  FooterLinkText,
  SkipLinkText,
} from './styles';

function LoginScreen({ navigation }: LoginProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const busy = loading || googleLoading;

  // Login é a primeira tela do app, mas também pode ser aberta de novo por
  // cima de Home (ex: um botão "Criar conta" fixo pra quem escolheu
  // continuar sem login antes) - só mostra botão de voltar/"continuar sem
  // login" nesse segundo caso, já que na primeira vez não tem pra onde
  // voltar. Se seu app não tiver modo anônimo, remova esse `canGoBack`/
  // skipLogin e torne o login obrigatório.
  const canGoBack = navigation.canGoBack();

  const skipLogin = () => {
    navigation.navigate('Home');
  };

  // Login/cadastro bem-sucedidos são diferentes: a conta é real agora, então
  // reseta a pilha pra Home virar raiz - não faz sentido conseguir voltar
  // pra Login depois de já estar autenticado de verdade. O cast é
  // necessário porque o tipo composto de `navigation` (ver
  // navigation/navigationTypes.ts) resolve `.reset()` pro formato do
  // navigator externo "RootStack" (nunca criado de verdade - só o stack de
  // ScreensTypes existe em navigation/index.tsx), não pro stack real.
  const resetToHome = () => {
    (navigation as unknown as NativeStackNavigationProp<ScreensTypes>).reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Preencha email e senha.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      analyticsService.logLoginCompleted('email');
      resetToHome();
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const { isNewUser } = await signInWithGoogle();
      // Google não tem um botão de "criar conta" separado do de "entrar" -
      // usa `isNewUser` (ver auth.service.ts) pra contar certo na analytics.
      if (isNewUser) {
        analyticsService.logSignupCompleted('google');
      } else {
        analyticsService.logLoginCompleted('google');
      }
      resetToHome();
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <GradientContainer colors={[colors.base.darkest, colors.auxiliary.black]}>
      <SafeAreaView style={{ flex: 1 }}>
        {canGoBack && (
          // Soma `insets.top` de verdade (useSafeAreaInsets) em vez de
          // confiar só no `top` fixo do styled-component - ver
          // SignupScreen.tsx pra explicação completa.
          <BackButton style={{ top: insets.top + 16 }} onPress={() => navigation.goBack()}>
            <BackButtonIcon>‹</BackButtonIcon>
          </BackButton>
        )}
        {/* No Android, "adjustResize" no manifesto sozinho não é mais
        // suficiente com o layout edge-to-edge do Android 15+ - o teclado
        // fica flutuando por cima, cobrindo o final do formulário.
        // `behavior="height"` usa os próprios eventos de teclado do RN
        // (independe do resize nativo da janela) pra encolher o container
        // na hora certa. */}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Container>
              <AppName variant="headlineSmall">Nome do App</AppName>

              <Title variant="headlineSmall">Entrar</Title>
              <Subtitle variant="bodyMedium">Entre com sua conta pra continuar.</Subtitle>

              {!!error && <ErrorText variant="bodySmall">{error}</ErrorText>}

              <Field
                mode="outlined"
                label="Email"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                textColor={colors.auxiliary.white}
                outlineColor={colors.transparency.opaque}
                activeOutlineColor={colors.auxiliary.white}
                disabled={busy}
              />
              <Field
                mode="outlined"
                label="Senha"
                secureTextEntry
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
                textColor={colors.auxiliary.white}
                outlineColor={colors.transparency.opaque}
                activeOutlineColor={colors.auxiliary.white}
                disabled={busy}
              />

              <Button mode="contained" onPress={handleLogin} loading={loading} disabled={busy}>
                Entrar
              </Button>

              <DividerRow>
                <DividerLine />
                <DividerLabel variant="bodySmall">ou</DividerLabel>
                <DividerLine />
              </DividerRow>

              <GoogleButton onPress={handleGoogle} disabled={busy}>
                {googleLoading ? (
                  <ActivityIndicator color={colors.base.darkest} />
                ) : (
                  <GoogleButtonText variant="bodyMedium">Continuar com Google</GoogleButtonText>
                )}
              </GoogleButton>

              <FooterRow>
                <FooterText variant="bodySmall">Não tem conta?</FooterText>
                <FooterLinkText variant="bodySmall" onPress={() => navigation.navigate('Signup')}>
                  Criar conta
                </FooterLinkText>
              </FooterRow>

              {!canGoBack && (
                <SkipLinkText variant="bodySmall" onPress={skipLogin} disabled={busy}>
                  Continuar sem login
                </SkipLinkText>
              )}
            </Container>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientContainer>
  );
}

export default LoginScreen;
