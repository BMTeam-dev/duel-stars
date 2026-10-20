import * as React from 'react';
import { ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { colors } from '../../../configs/colors';
import { fontSize, spacing } from '../../../configs/theme';
import { MEDALS } from '../../../services/profile/medals';
import { useDialog } from '../../../shared/ui/dialog/DialogProvider';
import { Icon } from '../../../shared/ui/Icon';

type Props = {
  unlocked: string[];
};

// Mostra o catálogo inteiro, com as bloqueadas em cinza: ver o que falta
// conquistar motiva mais do que uma seção vazia.
export function MedalsRow({ unlocked }: Props) {
  const { showDialog } = useDialog();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.lg, paddingRight: spacing.lg }}
      style={{ marginBottom: spacing.xl }}
    >
      {MEDALS.map(medal => {
        const owned = unlocked.includes(medal.id);
        return (
          <Item
            key={medal.id}
            onPress={() =>
              showDialog({
                icon: medal.icon,
                title: medal.name,
                message: owned ? `Conquistada! ${medal.howTo}` : `Como conquistar: ${medal.howTo}`,
              })
            }
          >
            <Circle owned={owned}>
              <Icon name={medal.icon} size={28} color={owned ? colors.gold.main : colors.text.muted} />
              {!owned && (
                <LockBadge>
                  <Icon name="lock" size={12} color={colors.text.secondary} />
                </LockBadge>
              )}
            </Circle>
            <Name owned={owned} numberOfLines={2}>
              {medal.name}
            </Name>
          </Item>
        );
      })}
    </ScrollView>
  );
}

const Item = styled.Pressable`
  width: 76px;
  align-items: center;
`;

const Circle = styled.View<{ owned: boolean }>`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  align-items: center;
  justify-content: center;
  border-width: 2px;
  border-color: ${({ owned }) => (owned ? colors.gold.main : colors.border)};
  background-color: ${({ owned }) => (owned ? colors.gold.soft : colors.surface)};
`;

const LockBadge = styled.View`
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 22px;
  height: 22px;
  border-radius: 11px;
  align-items: center;
  justify-content: center;
  background-color: ${colors.surfaceRaised};
  border-width: 1px;
  border-color: ${colors.border};
`;

const Name = styled.Text<{ owned: boolean }>`
  color: ${({ owned }) => (owned ? colors.text.primary : colors.text.secondary)};
  font-size: ${fontSize.caption}px;
  text-align: center;
  margin-top: ${spacing.sm}px;
`;
