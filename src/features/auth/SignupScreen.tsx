import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../configs/colors';
import { SignupProps } from '../../navigation/props';
import { ScreensTypes } from '../../navigation/screensTypes';
import { signUpWithEmail, mapAuthError } from '../../services/auth/auth.service';
import { analyticsService } from '../../services/analytics/analytics.service';
import { authSliceActions } from '../../redux/authSlice';
import { useAppDispatch } from '../../redux/store';
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
  FooterRow,
  FooterText,
  FooterLinkText,
} from './styles';

function SignupScreen({ navigation }: SignupProps) {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dispara uma vez, quando a pessoa chega nessa tela - topo do funil de
  // cadastro, útil pra medir onde as pessoas desistem (chegaram aqui mas
  // não completaram "sign_up").
  useEffect(() => {
    analyticsService.logSignupStarted();
  }, []);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError('Preencha nome, email e senha.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await signUpWithEmail(name.trim(), email.trim(), password);
      analyticsService.logSignupCompleted('email');
      // onAuthStateChanged (ver useAuthListener.ts) não dispara de novo só
      // porque o displayName mudou - atualiza o redux aqui na hora.
      dispatch(authSliceActions.setAuthUser(user));
      // reset (não navigate) - a conta é real agora, ver LoginScreen.tsx
      // pra explicação. Cast necessário pelo mesmo motivo de lá.
      (navigation as unknown as NativeStackNavigationProp<ScreensTypes>).reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientContainer colors={[colors.base.darkest, colors.auxiliary.black]}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* O `top` fixo do styled-component não é confiável sozinho aqui -
        // num filho com position:absolute dentro do SafeAreaView, em alguns
        // aparelhos/Android o inset do topo (status bar/notch) não é
        // respeitado direito, e o botão acaba nascendo por baixo da barra
        // de sistema. Somar `insets.top` (medido de verdade via
        // useSafeAreaInsets) é a forma robusta de garantir a posição certa. */}
        <BackButton style={{ top: insets.top + 16 }} onPress={() => navigation.goBack()}>
          <BackButtonIcon>‹</BackButtonIcon>
        </BackButton>
        {/* Ver LoginScreen.tsx: "height" no Android porque adjustResize
        // sozinho não é mais suficiente com o layout edge-to-edge do
        // Android 15+. */}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <Container>
              <AppName variant="headlineSmall">Nome do App</AppName>

              <Title variant="headlineSmall">Criar conta</Title>
              <Subtitle variant="bodyMedium">Leva menos de um minuto.</Subtitle>

              {!!error && <ErrorText variant="bodySmall">{error}</ErrorText>}

              <Field
                mode="outlined"
                label="Nome"
                autoComplete="name"
                value={name}
                onChangeText={setName}
                textColor={colors.auxiliary.white}
                outlineColor={colors.transparency.opaque}
                activeOutlineColor={colors.auxiliary.white}
                disabled={loading}
              />
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
                disabled={loading}
              />
              <Field
                mode="outlined"
                label="Senha"
                secureTextEntry
                autoComplete="password-new"
                value={password}
                onChangeText={setPassword}
                textColor={colors.auxiliary.white}
                outlineColor={colors.transparency.opaque}
                activeOutlineColor={colors.auxiliary.white}
                disabled={loading}
              />

              <Button mode="contained" onPress={handleSignup} loading={loading} disabled={loading}>
                Criar conta
              </Button>

              <FooterRow>
                <FooterText variant="bodySmall">Já tem conta?</FooterText>
                <FooterLinkText variant="bodySmall" onPress={() => navigation.goBack()}>
                  Entrar
                </FooterLinkText>
              </FooterRow>
            </Container>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientContainer>
  );
}

export default SignupScreen;
