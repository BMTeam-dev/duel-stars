import * as React from 'react';
import { forwardRef, useEffect, useState } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { colors } from '../../../../configs/colors';
import { AppSheet } from '../../../../shared/ui/AppSheet';
import { Button } from '../../../../shared/ui/Button';
import { TextField } from '../../../../shared/ui/TextField';
import { Body } from './styles';

type Props = {
  description: string;
  contact: string;
  busy: boolean;
  onSubmit: (description: string, contact: string) => void;
};

const DESCRIPTION_MAX = 500;

// Organizador edita descrição e contato; abre com o que está salvo.
export const TournamentInfoSheet = forwardRef<BottomSheetModal, Props>(
  ({ description, contact, busy, onSubmit }, ref) => {
    const [draft, setDraft] = useState(description);
    const [contactDraft, setContactDraft] = useState(contact);
    // Acompanha o que está salvo; fechar sem salvar descarta o rascunho.
    const reset = () => {
      setDraft(description);
      setContactDraft(contact);
    };
    useEffect(reset, [description, contact]);

    const unchanged =
      draft.trim() === description.trim() &&
      contactDraft.trim() === contact.trim();

    return (
      <AppSheet ref={ref} title="Editar torneio" onDismiss={reset}>
        <Body>
          <TextField
            label="Descrição"
            value={draft}
            onChangeText={setDraft}
            placeholder="Banlist, regras da casa, premiação..."
            placeholderTextColor={colors.text.muted}
            multiline
            maxLength={DESCRIPTION_MAX}
            style={{ minHeight: 120 }}
            helper={`${draft.length}/${DESCRIPTION_MAX}`}
          />
          <TextField
            label="Contato (WhatsApp, Discord ou Instagram)"
            value={contactDraft}
            onChangeText={setContactDraft}
            autoCapitalize="none"
            maxLength={80}
          />
          <Button
            label="Salvar"
            icon="content-save"
            disabled={unchanged}
            loading={busy}
            onPress={() => onSubmit(draft.trim(), contactDraft.trim())}
          />
        </Body>
      </AppSheet>
    );
  },
);
