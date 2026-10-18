import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator } from 'react-native-paper';
import { colors } from '../../configs/colors';
import { LoginProps } from '../../navigation/props';
import { signInWithEmail, signInWithGoogle, mapAuthError } from '../../services/auth/auth.service';
import { analyticsService } from '../../services/analytics/analytics.service';
import { Button } from '../../shared/ui/Button';
import {
  GradientContainer,
  Container,
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
} from './styles';

function LoginScreen({ navigation }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const busy = loading || googleLoading;

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
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <GradientContainer colors={[colors.surface, colors.background]}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* No Android, "adjustResize" no manifesto sozinho não é mais
        // suficiente com o layout edge-to-edge do Android 15+ - o teclado
        // fica flutuando por cima, cobrindo o final do formulário.
        // `behavior="height"` usa os próprios eventos de teclado do RN
        // (independe do resize nativo da janela) pra encolher o container
        // na hora certa. */}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Container>
              <AppName variant="headlineSmall">Duel Stars</AppName>

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
                textColor={colors.text.primary}
                outlineColor={colors.border}
                activeOutlineColor={colors.gold.main}
                disabled={busy}
              />
              <Field
                mode="outlined"
                label="Senha"
                secureTextEntry
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
                textColor={colors.text.primary}
                outlineColor={colors.border}
                activeOutlineColor={colors.gold.main}
                disabled={busy}
              />

              <Button label="Entrar" onPress={handleLogin} loading={loading} disabled={busy} />

              <DividerRow>
                <DividerLine />
                <DividerLabel variant="bodySmall">ou</DividerLabel>
                <DividerLine />
              </DividerRow>

              <GoogleButton onPress={handleGoogle} disabled={busy}>
                {googleLoading ? (
                  <ActivityIndicator color={colors.background} />
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

            </Container>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientContainer>
  );
}

export default LoginScreen;
