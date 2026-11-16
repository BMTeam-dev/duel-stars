import styled from 'styled-components/native';
import { colors } from '../../../../configs/colors';
import { fontSize, radius, spacing } from '../../../../configs/theme';

// Largura fixa: a imagem sai igual em qualquer aparelho (capturada em 1080px).
export const CARD_WIDTH = 360;

export const Card = styled.View`
  width: ${CARD_WIDTH}px;
  padding: ${spacing.xl}px ${spacing.lg}px ${spacing.lg}px;
  gap: ${spacing.md}px;
  background-color: ${colors.background};
`;

export const Brand = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs}px;
`;

export const BrandText = styled.Text`
  color: ${colors.gold.main};
  font-size: ${fontSize.caption}px;
  font-weight: 900;
  letter-spacing: 3px;
`;

export const Heading = styled.View`
  gap: ${spacing.xs}px;
`;

export const Tournament = styled.Text`
  color: ${colors.text.primary};
  font-size: 22px;
  font-weight: 800;
`;

export const Title = styled.Text`
  color: ${colors.gold.main};
  font-size: ${fontSize.bodyLarge}px;
  font-weight: 800;
`;

export const Subtitle = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
  font-weight: 600;
`;

export const Table = styled.View`
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${colors.border};
  overflow: hidden;
`;

export const Row = styled.View<{ header?: boolean; cut?: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.sm}px;
  padding: ${spacing.sm}px ${spacing.md}px;
  background-color: ${({ header }) =>
    header ? colors.surfaceRaised : colors.surface};
  border-bottom-width: ${({ cut }) => (cut ? 2 : 1)}px;
  border-bottom-color: ${({ cut }) => (cut ? colors.gold.main : colors.border)};
`;

export const Pos = styled.Text<{ color?: string | null }>`
  width: 22px;
  color: ${({ color }) => color ?? colors.text.secondary};
  font-size: ${fontSize.body}px;
  font-weight: 800;
`;

export const Nick = styled.Text<{
  header?: boolean;
  won?: boolean;
  lost?: boolean;
}>`
  flex-shrink: 1;
  color: ${({ header, won, lost }) =>
    header
      ? colors.text.secondary
      : won
      ? colors.gold.main
      : lost
      ? colors.text.muted
      : colors.text.primary};
  font-size: ${({ header }) => (header ? fontSize.caption : fontSize.body)}px;
  font-weight: ${({ header, won }) => (header ? 700 : won ? 800 : 600)};
`;

export const Num = styled.Text<{
  header?: boolean;
  strong?: boolean;
  wide?: boolean;
}>`
  width: ${({ wide }) => (wide ? 48 : 36)}px;
  text-align: right;
  color: ${({ header, strong }) =>
    strong
      ? colors.gold.main
      : header
      ? colors.text.secondary
      : colors.text.primary};
  font-size: ${({ header }) => (header ? fontSize.caption : fontSize.body)}px;
  font-weight: ${({ header, strong }) => (header || strong ? 800 : 500)};
`;

export const CutLabel = styled.Text`
  padding: 2px ${spacing.md}px;
  color: ${colors.gold.main};
  background-color: ${colors.gold.soft};
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  text-align: center;
`;

export const Match = styled.View`
  gap: ${spacing.xs}px;
  padding: ${spacing.sm}px ${spacing.md}px;
  background-color: ${colors.surface};
  border-bottom-width: 1px;
  border-bottom-color: ${colors.border};
`;

export const MatchTop = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

export const MatchTable = styled.Text`
  color: ${colors.text.muted};
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
`;

export const MatchStatus = styled.Text`
  color: ${colors.text.secondary};
  font-size: 10px;
  font-weight: 700;
`;

export const Players = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.sm}px;
`;

export const Side = styled.View<{ right?: boolean }>`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: ${({ right }) => (right ? 'flex-end' : 'flex-start')};
  gap: ${spacing.xs}px;
`;

export const Versus = styled.Text`
  color: ${colors.text.muted};
  font-size: ${fontSize.caption}px;
  font-weight: 700;
`;

export const Note = styled.Text`
  color: ${colors.text.muted};
  font-size: 11px;
`;

export const Footer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-top: ${spacing.sm}px;
  border-top-width: 1px;
  border-top-color: ${colors.border};
`;

export const FooterText = styled.Text`
  color: ${colors.text.muted};
  font-size: 11px;
  font-weight: 600;
`;

export const RowNick = styled(Nick)`
  flex: 1;
`;

export const Hero = styled.View`
  align-items: center;
  gap: ${spacing.xs}px;
  padding: ${spacing.xl}px ${spacing.lg}px;
  border-radius: ${radius.lg}px;
  border-width: 1px;
  border-color: ${colors.gold.dark};
  background-color: ${colors.gold.soft};
`;

export const HeroLabel = styled.Text`
  color: ${colors.gold.main};
  font-size: ${fontSize.caption}px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
`;

export const HeroName = styled.Text`
  margin-bottom: ${spacing.sm}px;
  color: ${colors.text.primary};
  font-size: 30px;
  font-weight: 900;
`;

export const Label = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.caption}px;
  font-weight: 700;
`;

export const Value = styled.Text`
  flex: 1;
  text-align: right;
  color: ${colors.text.primary};
  font-size: ${fontSize.body}px;
  font-weight: 700;
`;

export const CodeBox = styled.View`
  align-items: center;
  gap: ${spacing.xs}px;
  padding: ${spacing.lg}px;
  border-radius: ${radius.lg}px;
  border-width: 1px;
  border-style: dashed;
  border-color: ${colors.gold.dark};
`;

export const Code = styled.Text`
  color: ${colors.gold.main};
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 6px;
`;
