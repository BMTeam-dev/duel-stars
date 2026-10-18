import * as React from 'react';
import styled from 'styled-components/native';
import { colors } from '../../configs/colors';

type Props = {
  name: string;
  photoUrl: string | null;
  size?: number;
};

// Foto quando tem; sem foto, a inicial do nick num círculo dourado - nunca
// um ícone genérico, pra cada duelista ser reconhecível no feed.
export function Avatar({ name, photoUrl, size = 56 }: Props) {
  return (
    <Circle size={size}>
      {photoUrl ? (
        <Photo source={{ uri: photoUrl }} size={size} />
      ) : (
        <Initial size={size}>{(name.trim()[0] ?? '?').toUpperCase()}</Initial>
      )}
    </Circle>
  );
}

const Circle = styled.View<{ size: number }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  border-radius: ${({ size }) => size / 2}px;
  border-width: 2px;
  border-color: ${colors.gold.main};
  background-color: ${colors.gold.soft};
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const Photo = styled.Image<{ size: number }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
`;

const Initial = styled.Text<{ size: number }>`
  color: ${colors.gold.main};
  font-size: ${({ size }) => Math.round(size * 0.42)}px;
  font-weight: 800;
`;
