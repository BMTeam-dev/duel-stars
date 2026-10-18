import * as React from 'react';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import styled from 'styled-components/native';
import { colors } from '../../../configs/colors';
import { fontSize, spacing } from '../../../configs/theme';
import { AppSheet } from '../AppSheet';
import { Button } from '../Button';
import { Icon, IconName } from '../Icon';

export type DialogOptions = {
  title: string;
  message?: string;
  icon?: IconName;
  confirmLabel?: string;
  // Sem cancelLabel = diálogo só informativo, com um único botão.
  cancelLabel?: string;
  destructive?: boolean;
};

type DialogContextValue = {
  // Resolve true se confirmou; false se cancelou ou fechou arrastando/tocando
  // fora - quem chama não precisa tratar esses dois casos separadamente.
  showDialog: (options: DialogOptions) => Promise<boolean>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

// Substitui o Alert nativo no app inteiro: mesmo visual dos bottom sheets e
// API em Promise (`if (await showDialog(...))`), que lê melhor do que os
// callbacks do Alert.
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);
  const [options, setOptions] = useState<DialogOptions | null>(null);

  const finish = useCallback((confirmed: boolean) => {
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
  }, []);

  const showDialog = useCallback(
    (next: DialogOptions) =>
      new Promise<boolean>(resolve => {
        // Um diálogo novo por cima de outro aberto conta como cancelar o
        // anterior, senão a Promise dele ficaria pendurada pra sempre.
        finish(false);
        resolveRef.current = resolve;
        setOptions(next);
        sheetRef.current?.present();
      }),
    [finish],
  );

  const close = (confirmed: boolean) => {
    finish(confirmed);
    sheetRef.current?.dismiss();
  };

  const value = useMemo(() => ({ showDialog }), [showDialog]);
  const iconColor = options?.destructive ? colors.feedback.negative : colors.gold.main;

  return (
    <DialogContext.Provider value={value}>
      {children}
      <AppSheet ref={sheetRef} onDismiss={() => finish(false)}>
        {options && (
          <>
            {options.icon && (
              <IconCircle destructive={!!options.destructive}>
                <Icon name={options.icon} size={28} color={iconColor} />
              </IconCircle>
            )}
            <Title>{options.title}</Title>
            {!!options.message && <Message>{options.message}</Message>}
            <Actions>
              <Button
                label={options.confirmLabel ?? 'OK'}
                variant={options.destructive ? 'danger' : 'primary'}
                onPress={() => close(true)}
              />
              {!!options.cancelLabel && (
                <Button label={options.cancelLabel} variant="ghost" onPress={() => close(false)} />
              )}
            </Actions>
          </>
        )}
      </AppSheet>
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog precisa estar dentro de <DialogProvider> (ver App.tsx).');
  }
  return context;
}

const IconCircle = styled.View<{ destructive: boolean }>`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  align-items: center;
  justify-content: center;
  align-self: center;
  margin-bottom: ${spacing.lg}px;
  background-color: ${({ destructive }) =>
    destructive ? 'rgba(255, 107, 94, 0.14)' : colors.gold.soft};
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
  line-height: 20px;
  text-align: center;
`;

const Actions = styled.View`
  margin-top: ${spacing.xl}px;
  gap: ${spacing.sm}px;
`;
