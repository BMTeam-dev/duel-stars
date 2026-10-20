import * as React from 'react';
import styled from 'styled-components/native';
import { colors } from '../../configs/colors';
import { fontSize, radius, spacing } from '../../configs/theme';
import { levelProgress, levelTitle } from '../../services/profile/level';
import { UserProfile } from '../../services/profile/profile.types';
import { Avatar } from '../../shared/ui/Avatar';
import { Icon } from '../../shared/ui/Icon';

type Props = {
  profile: UserProfile;
  onPress: () => void;
};

// Identidade + saldo de estrelas no topo da tela principal: o saldo é o que
// a pessoa aposta, então fica sempre à vista, sem precisar abrir o Perfil.
export function FeedHeader({ profile, onPress }: Props) {
  const { level } = levelProgress(profile.wins, profile.losses);
  return (
    <Container onPress={onPress} accessibilityRole="button" accessibilityLabel="Abrir perfil">
      <Avatar name={profile.nick} photoUrl={profile.photoUrl} size={48} />
      <Info>
        <Nick numberOfLines={1}>@{profile.nick}</Nick>
        <LevelRow>
          <LevelBadge>
            <Icon name="star" size={12} color={colors.gold.on} />
            <LevelBadgeText>Nv. {level}</LevelBadgeText>
          </LevelBadge>
          <LevelTitle numberOfLines={1}>{levelTitle(level)}</LevelTitle>
        </LevelRow>
      </Info>
      <StarsPill>
        <Icon name="star-four-points" size={18} color={colors.gold.main} />
        <StarsValue>{profile.stars}</StarsValue>
      </StarsPill>
    </Container>
  );
}

const Container = styled.Pressable`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  padding: ${spacing.md}px ${spacing.lg}px;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.border};
`;

const Info = styled.View`
  flex: 1;
`;

const Nick = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 800;
`;

const LevelRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.sm}px;
  margin-top: ${spacing.xs}px;
`;

const LevelBadge = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 2px;
  padding: 2px ${spacing.sm}px;
  border-radius: ${radius.sm}px;
  background-color: ${colors.gold.main};
`;

const LevelBadgeText = styled.Text`
  color: ${colors.gold.on};
  font-size: ${fontSize.caption}px;
  font-weight: 800;
`;

const LevelTitle = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const StarsPill = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs}px;
  padding: ${spacing.sm}px ${spacing.md}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${colors.gold.dark};
  background-color: ${colors.gold.soft};
`;

const StarsValue = styled.Text`
  color: ${colors.gold.main};
  font-size: ${fontSize.title}px;
  font-weight: 900;
`;
