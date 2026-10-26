import * as React from 'react';
import { forwardRef, useEffect, useState } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { colors } from '../../../../configs/colors';
import { AppSheet } from '../../../../shared/ui/AppSheet';
import { Button } from '../../../../shared/ui/Button';
import { TextField } from '../../../../shared/ui/TextField';
import { Body } from './styles';

type Props = {
  current: string;
  busy: boolean;
  onSubmit: (description: string) => void;
};

const MAX = 500;

// Organizador edita a descrição do torneio; abre com o texto atual.
export const DescriptionSheet = forwardRef<BottomSheetModal, Props>(
  ({ current, busy, onSubmit }, ref) => {
    const [value, setValue] = useState(current);
    // Acompanha o texto salvo; fechar sem salvar descarta o rascunho.
    useEffect(() => setValue(current), [current]);

    return (
      <AppSheet
        ref={ref}
        title="Descrição do torneio"
        onDismiss={() => setValue(current)}
      >
        <Body>
          <TextField
            label="Descrição"
            value={value}
            onChangeText={setValue}
            placeholder="Banlist, regras da casa, premiação..."
            placeholderTextColor={colors.text.muted}
            multiline
            maxLength={MAX}
            style={{ minHeight: 120 }}
            helper={`${value.length}/${MAX}`}
          />
          <Button
            label="Salvar"
            icon="content-save"
            disabled={value.trim() === current.trim()}
            loading={busy}
            onPress={() => onSubmit(value.trim())}
          />
        </Body>
      </AppSheet>
    );
  },
);
