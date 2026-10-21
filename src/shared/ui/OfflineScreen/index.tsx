import * as React from 'react';
import { useState } from 'react';
import { colors } from '../../../configs/colors';
import { checkConnection, useIsOffline } from '../../../services/network/useIsOffline';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Content, IconCircle, Message, Overlay, Title } from './styles';

// Cobre o app inteiro enquanto não há internet: duelo, aposta e ranking
// dependem do servidor, então não adianta deixar a pessoa navegar e ver
// erro em cada tela. Some sozinha quando a conexão volta.
export function OfflineScreen() {
  const offline = useIsOffline();
  const [checking, setChecking] = useState(false);
  if (!offline) return null;

  const retry = async () => {
    setChecking(true);
    try {
      await checkConnection();
    } finally {
      setChecking(false);
    }
  };

  return (
    <Overlay accessibilityViewIsModal>
      <Content>
        <IconCircle>
          <Icon name="wifi-off" size={48} color={colors.gold.main} />
        </IconCircle>
        <Title>Sem conexão</Title>
        <Message>
          O Duel Stars precisa de internet para desafiar, registrar resultados e atualizar o ranking.
          Assim que a conexão voltar, o app continua de onde parou.
        </Message>
        <Button label="Tentar de novo" icon="refresh" loading={checking} onPress={retry} />
      </Content>
    </Overlay>
  );
}
