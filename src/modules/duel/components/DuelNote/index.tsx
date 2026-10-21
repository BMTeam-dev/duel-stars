import * as React from 'react';
import { useEffect, useState } from 'react';
import { colors } from '../../../../configs/colors';
import {
  DUEL_NOTE_MAX_LENGTH,
  saveDuelNote,
  subscribeDuelNote,
} from '../../../../services/duels/duelNotes.service';
import { Button } from '../../../../shared/ui/Button';
import { Icon } from '../../../../shared/ui/Icon';
import { TextField } from '../../../../shared/ui/TextField';
import { toast } from '../../../../shared/ui/toast';
import { Card, Header, HeaderText, Private } from './styles';

type Props = {
  uid: string;
  duelId: string;
};

// Anotação privada do duelo: aparece depois no Histórico, pra lembrar o
// deck usado e o que decidiu a partida.
export function DuelNote({ uid, duelId }: Props) {
  const [saved, setSaved] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(
    () =>
      subscribeDuelNote(uid, duelId, text => {
        setSaved(previous => {
          // Só preenche o campo na primeira leitura, pra não apagar o que a
          // pessoa está digitando.
          if (previous === null) setDraft(text);
          return text;
        });
      }),
    [uid, duelId],
  );

  const dirty = saved !== null && draft.trim() !== saved;

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveDuelNote(uid, duelId, draft);
      toast.success(draft.trim() ? 'Anotação salva' : 'Anotação apagada');
    } catch {
      toast.error('Não foi possível salvar a anotação. Tente de novo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Header>
        <Icon name="note-edit-outline" size={18} color={colors.gold.main} />
        <HeaderText>Anotação do duelo</HeaderText>
        <Icon name="lock" size={14} color={colors.text.muted} />
        <Private>Só você vê</Private>
      </Header>
      <TextField
        value={draft}
        onChangeText={setDraft}
        placeholder="Que deck você usou? E o oponente? O que decidiu o duelo?"
        placeholderTextColor={colors.text.muted}
        multiline
        maxLength={DUEL_NOTE_MAX_LENGTH}
        style={{ backgroundColor: colors.surface, minHeight: 96 }}
        helper={`${draft.length}/${DUEL_NOTE_MAX_LENGTH}`}
      />
      {dirty && (
        <Button
          label="Salvar anotação"
          icon="content-save"
          variant="secondary"
          loading={saving}
          onPress={handleSave}
        />
      )}
    </Card>
  );
}
