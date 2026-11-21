import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { colors } from '../../../configs/colors';
import {
  checkStoreUpdate,
  currentVersionCode,
  startUpdate,
  subscribeMinVersion,
} from '../../../services/appUpdate/appUpdate.service';
import { Button } from '../Button';
import { useDialog } from '../dialog/DialogProvider';
import { Icon } from '../Icon';
import {
  Content,
  IconCircle,
  Message,
  Overlay,
  Title,
} from '../OfflineScreen/styles';

// Duas camadas:
// - versão nova na loja: pergunta uma vez por sessão se quer atualizar;
// - abaixo da versão mínima (config/app no Firestore): cobre o app até
//   atualizar - para quando o backend muda e a versão antiga quebraria.
export function UpdateGate() {
  const { showDialog } = useDialog();
  const [minVersion, setMinVersion] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const asked = useRef<number | null>(null);
  const current = currentVersionCode();
  const forced =
    current !== null && minVersion !== null && current < minVersion;

  useEffect(() => subscribeMinVersion(setMinVersion), []);

  useEffect(() => {
    if (forced) return;
    const offer = async () => {
      const available = await checkStoreUpdate();
      if (!available || asked.current === available) return;
      asked.current = available;
      const ok = await showDialog({
        icon: 'download',
        title: 'Nova versão disponível',
        message:
          'Atualize o Duel Stars para ter as novidades e correções. Leva só alguns segundos.',
        confirmLabel: 'Atualizar',
        cancelLabel: 'Agora não',
      });
      if (ok) startUpdate();
    };
    offer();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') offer();
    });
    return () => sub.remove();
  }, [forced, showDialog]);

  if (!forced) return null;

  const update = async () => {
    setBusy(true);
    try {
      await startUpdate();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Overlay accessibilityViewIsModal>
      <Content>
        <IconCircle>
          <Icon
            name="cellphone-arrow-down"
            size={48}
            color={colors.gold.main}
          />
        </IconCircle>
        <Title>Atualização necessária</Title>
        <Message>
          Esta versão do Duel Stars não funciona mais. Atualize pela Play Store
          para continuar duelando: seus dados e estrelas continuam do jeito que
          estão.
        </Message>
        <Button
          label="Atualizar agora"
          icon="download"
          loading={busy}
          onPress={update}
        />
      </Content>
    </Overlay>
  );
}
