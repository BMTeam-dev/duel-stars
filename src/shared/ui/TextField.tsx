import * as React from 'react';
import { BottomSheetTextInput, useBottomSheetInternal } from '@gorhom/bottom-sheet';
import { TextInput } from 'react-native-paper';
import styled from 'styled-components/native';
import { colors } from '../../configs/colors';
import { fontSize, spacing } from '../../configs/theme';

type Props = React.ComponentProps<typeof TextInput> & {
  helper?: string;
  helperTone?: 'neutral' | 'positive' | 'negative';
};

const helperColor = {
  neutral: colors.text.secondary,
  positive: colors.feedback.positive,
  negative: colors.feedback.negative,
};

// Dentro de um bottom sheet o input nativo precisa ser o do bottom-sheet:
// é ele que avisa o sheet do foco pra subir junto com o teclado.
const renderSheetInput: Props['render'] = props => <BottomSheetTextInput {...(props as any)} />;

export function TextField({ helper, helperTone = 'neutral', ...inputProps }: Props) {
  const inSheet = !!useBottomSheetInternal(true);
  return (
    <Wrapper>
      <TextInput
        mode="outlined"
        textColor={colors.text.primary}
        outlineColor={colors.border}
        activeOutlineColor={colors.gold.main}
        style={{ backgroundColor: colors.surface }}
        render={inSheet ? renderSheetInput : undefined}
        {...inputProps}
      />
      {!!helper && <Helper color={helperColor[helperTone]}>{helper}</Helper>}
    </Wrapper>
  );
}

const Wrapper = styled.View`
  margin-bottom: ${spacing.md}px;
`;

const Helper = styled.Text<{ color: string }>`
  color: ${({ color }) => color};
  font-size: ${fontSize.caption}px;
  margin-top: ${spacing.xs}px;
  margin-left: ${spacing.xs}px;
`;
