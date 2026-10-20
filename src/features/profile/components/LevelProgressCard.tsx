import * as React from 'react';
import styled from 'styled-components/native';
import { colors } from '../../../configs/colors';
import { fontSize, radius, spacing } from '../../../configs/theme';
import { LevelProgress, levelTitle } from '../../../services/profile/level';
import { Icon } from '../../../shared/ui/Icon';

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

const Card = styled.Pressable`
  padding: ${spacing.lg}px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surface};
  margin-bottom: ${spacing.md}px;
`;

const Top = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.sm}px;
  margin-bottom: ${spacing.md}px;
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

const Title = styled.Text`
  flex: 1;
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 700;
`;

const Track = styled.View`
  height: 8px;
  border-radius: 4px;
  background-color: ${colors.surfaceRaised};
  overflow: hidden;
`;

const Fill = styled.View<{ ratio: number }>`
  width: ${({ ratio }) => Math.max(0, Math.min(1, ratio)) * 100}%;
  height: 100%;
  border-radius: 4px;
  background-color: ${colors.gold.main};
`;

const Caption = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
  margin-top: ${spacing.sm}px;
`;
