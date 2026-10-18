import * as React from 'react';
import { useEffect, useState } from 'react';
import { TextInput } from 'react-native-paper';
import { colors } from '../../../configs/colors';
import { TextField } from '../../../shared/ui/TextField';
import { checkNick, NickStatus, normalizeNick } from '../../../services/profile/profile.service';

type Props = {
  uid: string;
  value: string;
  onChange: (value: string) => void;
  onStatusChange: (status: NickStatus | 'checking') => void;
  disabled?: boolean;
};

const messages: Record<NickStatus | 'checking', string> = {
  checking: 'Verificando...',
  invalid: 'De 3 a 20 caracteres: letras, números e _',
  available: 'Disponível',
  taken: 'Esse nick já tem dono',
  yours: 'Esse é o seu nick',
};

// Verifica a disponibilidade enquanto a pessoa digita, com uma pausa de
// 400ms pra não consultar o Firestore a cada letra.
export function NickField({ uid, value, onChange, onStatusChange, disabled }: Props) {
  const [status, setStatus] = useState<NickStatus | 'checking' | null>(null);

  useEffect(() => {
    if (!value) {
      setStatus(null);
      return;
    }
    setStatus('checking');
    onStatusChange('checking');
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await checkNick(value, uid);
        if (cancelled) return;
        setStatus(result);
        onStatusChange(result);
      } catch {
        if (cancelled) return;
        setStatus(null);
        onStatusChange('invalid');
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // onStatusChange fica de fora: a tela recria a função a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, uid]);

  const tone =
    status === 'available' || status === 'yours'
      ? 'positive'
      : status === 'taken' || status === 'invalid'
      ? 'negative'
      : 'neutral';

  return (
    <TextField
      label="Nick"
      value={value}
      onChangeText={text => onChange(text.replace(/\s/g, ''))}
      autoCapitalize="none"
      autoCorrect={false}
      maxLength={21}
      disabled={disabled}
      left={<TextInput.Affix text="@" textStyle={{ color: colors.gold.main }} />}
      helper={status ? messages[status] : 'Ex.: @' + (normalizeNick(value) || 'yugi_duelista')}
      helperTone={tone}
    />
  );
}
