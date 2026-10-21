import * as React from 'react';
import { colors } from '../../../../configs/colors';
import { CATEGORY_LABEL } from '../../../../services/duels/duels.types';
import { levelProgress, levelTitle } from '../../../../services/profile/level';
import { totalRecord } from '../../../../services/profile/profile.service';
import { useActiveCategory } from '../../../../services/profile/useActiveCategory';
import { UserProfile } from '../../../../services/profile/profile.types';
import { Avatar } from '../../../../shared/ui/Avatar';
import { Icon } from '../../../../shared/ui/Icon';
import {
  Container,
  Info,
  Nick,
  LevelRow,
  LevelBadge,
  LevelBadgeText,
  LevelTitle,
  StarsPill,
  StarsRow,
  StarsCategory,
  StarsValue,
} from './styles';

type Props = {
  profile: UserProfile;
  onPress: () => void;
};

// Identidade + saldo de estrelas da categoria ativa no topo da tela
// principal: é o que a pessoa aposta, então fica sempre à vista.
export function FeedHeader({ profile, onPress }: Props) {
  const total = totalRecord(profile);
  const { level } = levelProgress(total.wins, total.losses);
  const { category } = useActiveCategory();
  const wallet = profile.wallets[category];
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
        <StarsRow>
          <Icon name="star-four-points" size={18} color={colors.gold.main} />
          <StarsValue>{wallet.stars}</StarsValue>
        </StarsRow>
        <StarsCategory>{CATEGORY_LABEL[category]}</StarsCategory>
      </StarsPill>
    </Container>
  );
}
