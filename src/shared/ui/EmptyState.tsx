import * as React from 'react';
import styled from 'styled-components/native';
import { colors } from '../../configs/colors';
import { fontSize, spacing } from '../../configs/theme';
import { Icon, IconName } from './Icon';

type Props = {
  icon: IconName;
  title: string;
  message: string;
};

export function EmptyState({ icon, title, message }: Props) {
  return (
    <Container>
      <IconCircle>
        <Icon name={icon} size={32} color={colors.gold.main} />
      </IconCircle>
      <Title>{title}</Title>
      <Message>{message}</Message>
    </Container>
  );
}

const Container = styled.View`
  align-items: center;
  padding: ${spacing.xxl}px ${spacing.xl}px;
`;

const IconCircle = styled.View`
  width: 72px;
  height: 72px;
  border-radius: 36px;
  align-items: center;
  justify-content: center;
  background-color: ${colors.gold.soft};
  margin-bottom: ${spacing.lg}px;
`;

const Title = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.title}px;
  font-weight: 700;
  text-align: center;
  margin-bottom: ${spacing.sm}px;
`;

const Message = styled.Text`
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
  text-align: center;
  line-height: 20px;
`;
