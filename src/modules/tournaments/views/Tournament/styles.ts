import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

type Tone = 'gold' | 'negative' | 'neutral';
const toneColor = (tone: Tone) =>
  tone === 'gold' ? colors.gold.main : tone === 'negative' ? colors.feedback.negative : colors.text.secondary;
const toneBackground = (tone: Tone) =>
  tone === 'gold' ? colors.gold.soft : tone === 'negative' ? 'rgba(255, 107, 94, 0.14)' : colors.surfaceRaised;

export const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.background};
`;

export const Center = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

export const Info = styled.View`
  gap: ${spacing.sm}px;
  padding: ${spacing.lg}px;
  border-radius: ${radius.lg}px;
  border-width: 1px;
  border-color: ${colors.border};
  background-color: ${colors.surface};
`;

export const MetaRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs}px;
`;

export const Meta = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
`;

export const StatusBadge = styled.View<{ tone: Tone }>`
  margin-left: auto;
  padding: 2px ${spacing.sm}px;
  border-radius: ${radius.sm}px;
  background-color: ${({ tone }) => toneBackground(tone)};
`;

export const StatusText = styled.Text<{ tone: Tone }>`
  color: ${({ tone }) => toneColor(tone)};
  font-size: ${fontSize.caption}px;
  font-weight: 800;
`;

export const Name = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.headline}px;
  font-weight: 900;
`;

export const Description = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.body}px;
  line-height: 20px;
  margin-top: ${spacing.xs}px;
`;

export const InfoRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${spacing.md}px;
  min-height: 32px;
`;

export const InfoLabel = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
`;

export const InfoValue = styled.Text`
  flex-shrink: 1;
  color: ${colors.text.primary};
  font-size: ${fontSize.body}px;
  font-weight: 700;
  text-align: right;
`;

export const CopyChip = styled.Pressable`
  flex-shrink: 1;
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs}px;
  padding: ${spacing.xs}px ${spacing.md}px;
  border-radius: ${radius.pill}px;
  background-color: ${colors.gold.soft};
`;

export const CopyChipText = styled.Text`
  flex-shrink: 1;
  color: ${colors.gold.main};
  font-size: ${fontSize.body}px;
  font-weight: 700;
`;

export const OrganizerBox = styled.View`
  gap: ${spacing.sm}px;
  padding: ${spacing.lg}px;
  border-radius: ${radius.lg}px;
  border-width: 1px;
  border-color: ${colors.gold.dark};
  background-color: ${colors.surface};
`;

export const OrganizerTitle = styled.Text`
  color: ${colors.gold.main};
  font-size: ${fontSize.caption}px;
  font-weight: 800;
  text-transform: uppercase;
`;

export const SectionTitle = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 700;
`;

export const Empty = styled.Text`
  color: ${colors.text.muted};
  font-size: ${fontSize.body}px;
`;

export const PlayerRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
`;

export const PlayerNick = styled.Text`
  flex: 1;
  color: ${colors.text.primary};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 600;
`;

export const PaidChip = styled.Pressable<{ paid: boolean }>`
  padding: ${spacing.xs}px ${spacing.md}px;
  border-radius: ${radius.pill}px;
  background-color: ${({ paid }) => (paid ? 'rgba(75, 208, 122, 0.14)' : colors.surfaceRaised)};
`;

export const PaidChipText = styled.Text<{ paid: boolean }>`
  color: ${({ paid }) => (paid ? colors.feedback.positive : colors.text.secondary)};
  font-size: ${fontSize.caption}px;
  font-weight: 800;
`;

export const Footer = styled.View`
  padding: ${spacing.lg}px ${spacing.xl}px;
  gap: ${spacing.sm}px;
`;

export const Champion = styled.View`
  align-items: center;
  gap: ${spacing.xs}px;
  padding: ${spacing.xl}px;
  border-radius: ${radius.lg}px;
  border-width: 1px;
  border-color: ${colors.gold.dark};
  background-color: ${colors.gold.soft};
`;

export const ChampionLabel = styled.Text`
  color: ${colors.gold.main};
  font-size: ${fontSize.caption}px;
  font-weight: 800;
  text-transform: uppercase;
`;

export const ChampionName = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.headline}px;
  font-weight: 900;
`;

export const Rounds = styled.View`
  gap: ${spacing.sm}px;
`;

export const RoundTitle = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
  font-weight: 800;
  text-transform: uppercase;
`;

export const StandingsTable = styled.View`
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${colors.border};
  overflow: hidden;
`;

export const StandingRow = styled.View<{ header?: boolean; mine?: boolean; cut?: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.sm}px;
  padding: ${spacing.sm}px ${spacing.md}px;
  background-color: ${({ header, mine }) => (mine ? colors.gold.soft : header ? colors.surfaceRaised : colors.surface)};
  border-bottom-width: ${({ cut }) => (cut ? 2 : 1)}px;
  border-bottom-color: ${({ cut }) => (cut ? colors.gold.dark : colors.border)};
`;

export const StandingPos = styled.Text<{ header?: boolean }>`
  width: 24px;
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
  font-weight: 700;
`;

export const StandingNick = styled.Text<{ header?: boolean }>`
  flex: 1;
  color: ${({ header }) => (header ? colors.text.secondary : colors.text.primary)};
  font-size: ${({ header }) => (header ? fontSize.caption : fontSize.body)}px;
  font-weight: ${({ header }) => (header ? 700 : 600)};
`;

export const StandingNum = styled.Text<{ header?: boolean; strong?: boolean }>`
  width: 44px;
  text-align: right;
  color: ${({ header, strong }) => (strong ? colors.gold.main : header ? colors.text.secondary : colors.text.primary)};
  font-size: ${({ header }) => (header ? fontSize.caption : fontSize.body)}px;
  font-weight: ${({ header, strong }) => (header || strong ? 800 : 500)};
`;
