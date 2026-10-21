import * as React from 'react';
import { colors } from '../../../../configs/colors';
import { LevelProgress, levelTitle } from '../../../../services/profile/level';
import { Icon } from '../../../../shared/ui/Icon';
import { Card, Top, LevelBadge, LevelBadgeText, Title, Track, Fill, Caption } from './styles';

type Props = {
  progress: LevelProgress;
  onInfo: () => void;
};

export function LevelProgressCard({ progress, onInfo }: Props) {
  const ratio = progress.xpToNext > 0 ? progress.xpIntoLevel / progress.xpToNext : 0;
  return (
    <Card onPress={onInfo} accessibilityRole="button" accessibilityLabel="Como funcionam os níveis">
      <Top>
        <LevelBadge>
          <Icon name="star" size={14} color={colors.gold.on} />
          <LevelBadgeText>Nível {progress.level}</LevelBadgeText>
        </LevelBadge>
        <Title>{levelTitle(progress.level)}</Title>
        <Icon name="information-outline" size={20} color={colors.text.muted} />
      </Top>
      <Track>
        <Fill ratio={ratio} />
      </Track>
      <Caption>
        {progress.xpIntoLevel} / {progress.xpToNext} XP para o Nível {progress.level + 1}
      </Caption>
    </Card>
  );
}
