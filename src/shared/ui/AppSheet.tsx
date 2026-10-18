import * as React from 'react';
import { forwardRef, useCallback } from 'react';
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { colors } from '../../configs/colors';
import { fontSize, radius, spacing } from '../../configs/theme';

type Props = {
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
};

// Todo bottom sheet do app passa por aqui, pra ter o mesmo visual (fundo,
// alça, backdrop escurecido que fecha ao tocar) e altura pelo conteúdo -
// sem snap points fixos, o sheet cresce só o quanto o conteúdo precisa.
export const AppSheet = forwardRef<BottomSheetModal, Props>(
  ({ title, children, onDismiss }, ref) => {
    const insets = useSafeAreaInsets();

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.6} />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.surface, borderRadius: radius.lg * 1.5 }}
        handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
        onDismiss={onDismiss}
      >
        <BottomSheetView style={{ paddingBottom: insets.bottom + spacing.lg }}>
          <Content>
            {!!title && <Title>{title}</Title>}
            {children}
          </Content>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

const Content = styled.View`
  padding: ${spacing.sm}px ${spacing.xl}px 0;
`;

const Title = styled.Text`
  color: ${colors.text.primary};
  font-size: ${fontSize.title}px;
  font-weight: 700;
  margin-bottom: ${spacing.lg}px;
`;
