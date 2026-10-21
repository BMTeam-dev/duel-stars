import * as React from 'react';
import { ScrollView } from 'react-native';
import { colors } from '../../../../configs/colors';
import { spacing } from '../../../../configs/theme';
import { MEDALS, TIER_NAMES } from '../../../../services/profile/medals';
import { useDialog } from '../../../../shared/ui/dialog/DialogProvider';
import { Icon } from '../../../../shared/ui/Icon';
import { Item, Circle, LockBadge, Name, TierText } from './styles';

type Props = {
  // id -> nível (ver services/profile/medals.ts).
  medals: Record<string, number>;
};

// Cor do aro: nível nas medalhas com degraus; dourado nas outras.
function tierColor(tier: number, tiered?: boolean): string {
  if (!tiered) return colors.gold.main;
  return tier >= 3
    ? colors.gold.main
    : tier === 2
    ? colors.medal.silver
    : colors.medal.bronze;
}

// Mostra o catálogo inteiro, com as bloqueadas em cinza: ver o que falta
// conquistar motiva mais do que uma seção vazia.
export function MedalsRow({ medals }: Props) {
  const { showDialog } = useDialog();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.lg, paddingRight: spacing.lg }}
      style={{ marginBottom: spacing.xl }}
    >
      {/* Conquistadas primeiro, na ordem do catálogo. */}
      {[...MEDALS]
        .sort((a, b) => Number(!medals[a.id]) - Number(!medals[b.id]))
        .map(medal => {
          const tier = medals[medal.id] ?? 0;
          const owned = tier > 0;
          const color = tierColor(tier, medal.tiered);
          const tierName = medal.tiered && owned ? TIER_NAMES[tier] : null;
          return (
            <Item
              key={medal.id}
              onPress={() =>
                showDialog({
                  icon: medal.icon,
                  title: medal.name,
                  message: owned
                    ? `Conquistada${tierName ? ` (${tierName})` : ''}! ${
                        medal.howTo
                      }`
                    : `Como conquistar: ${medal.howTo}`,
                })
              }
            >
              <Circle owned={owned} color={color}>
                <Icon
                  name={medal.icon}
                  size={28}
                  color={owned ? color : colors.text.muted}
                />
                {!owned && (
                  <LockBadge>
                    <Icon name="lock" size={12} color={colors.text.secondary} />
                  </LockBadge>
                )}
              </Circle>
              <Name owned={owned} numberOfLines={2}>
                {medal.name}
              </Name>
              {!!tierName && <TierText color={color}>{tierName}</TierText>}
            </Item>
          );
        })}
    </ScrollView>
  );
}
