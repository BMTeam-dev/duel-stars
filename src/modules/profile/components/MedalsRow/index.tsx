import * as React from 'react';
import { ScrollView } from 'react-native';
import { colors } from '../../../../configs/colors';
import { spacing } from '../../../../configs/theme';
import { MEDALS } from '../../../../services/profile/medals';
import { useDialog } from '../../../../shared/ui/dialog/DialogProvider';
import { Icon } from '../../../../shared/ui/Icon';
import { Item, Circle, LockBadge, Name } from './styles';

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
