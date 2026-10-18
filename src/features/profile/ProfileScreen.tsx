import * as React from 'react';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { colors } from '../../configs/colors';
import { fontSize, spacing } from '../../configs/theme';
import { ProfileProps } from '../../navigation/props';
import { useAppSelector } from '../../redux/store';
import { mapAuthError, signOut } from '../../services/auth/auth.service';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { useDialog } from '../../shared/ui/dialog/DialogProvider';
import { Icon } from '../../shared/ui/Icon';
import { toast } from '../../shared/ui/toast';

function ProfileScreen(_: ProfileProps) {
  const user = useAppSelector(state => state.auth.user);
  const { showDialog } = useDialog();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    const confirmed = await showDialog({
      icon: 'logout',
      title: 'Sair da conta?',
      message: 'Você vai precisar entrar de novo para duelar.',
      confirmLabel: 'Sair',
      cancelLabel: 'Cancelar',
      destructive: true,
    });
    if (!confirmed) return;

    setSigningOut(true);
    try {
      // Ao sair, o navigator troca sozinho pro Login (ver navigation/index.tsx).
      await signOut();
    } catch (err) {
      toast.error(mapAuthError(err));
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <Content>
        <Title>Perfil</Title>
        <Card>
          <Row>
            <Avatar>
              <Icon name="account" size={32} color={colors.gold.main} />
            </Avatar>
            <Info>
              <Name>{user?.name ?? 'Duelista'}</Name>
              {!!user?.email && <Email>{user.email}</Email>}
            </Info>
          </Row>
        </Card>
        <Spacer />
        <Button
          label="Sair da conta"
          variant="secondary"
          icon="logout"
          loading={signingOut}
          onPress={handleSignOut}
        />
      </Content>
    </SafeAreaView>
  );
}

const Content = styled.View`
  flex: 1;
  padding: ${spacing.lg}px;
`;

const Title = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.headline}px;
  font-weight: 800;
  margin-bottom: ${spacing.lg}px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
`;

const Avatar = styled.View`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  align-items: center;
  justify-content: center;
  background-color: ${colors.gold.soft};
  border-width: 2px;
  border-color: ${colors.gold.main};
  margin-right: ${spacing.md}px;
`;

const Info = styled.View`
  flex: 1;
`;

const Name = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.title}px;
  font-weight: 700;
`;

const Email = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
  margin-top: 2px;
`;

const Spacer = styled.View`
  flex: 1;
`;

export default ProfileScreen;
