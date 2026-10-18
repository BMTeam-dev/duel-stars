import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../configs/colors';
import { useAppSelector } from '../../redux/store';
import { HomeProps } from '../../navigation/props';
import { GradientContainer, Container, Title, Subtitle } from './styles';

// Tela placeholder - substitua pela tela real do seu app. Fica aqui como
// REFERÊNCIA do padrão de módulo: Screen.tsx (este arquivo) + styles.ts
// (estilos do módulo) + opcionalmente use<Nome>.ts (lógica/estado, se a
// tela tiver algo mais complexo que isto). Ver CLAUDE.md pra o passo a
// passo completo de como criar um módulo novo seguindo esse padrão.
function HomeScreen(_props: HomeProps) {
  const user = useAppSelector(state => state.auth.user);

  return (
    <GradientContainer colors={[colors.base.darkest, colors.auxiliary.black]}>
      <SafeAreaView style={{ flex: 1 }}>
        <Container>
          <Title variant="headlineSmall">
            {user ? `Olá, ${user.name ?? user.email}` : 'Olá!'}
          </Title>
          <Subtitle variant="bodyMedium">
            Essa é a tela inicial placeholder do scaffold - comece a construir seu app aqui.
          </Subtitle>
        </Container>
      </SafeAreaView>
    </GradientContainer>
  );
}

export default HomeScreen;
