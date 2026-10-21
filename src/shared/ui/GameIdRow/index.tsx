import * as React from 'react';
import Clipboard from '@react-native-clipboard/clipboard';
import { colors } from '../../../configs/colors';
import { CATEGORY_ICON } from '../../../services/duels/duels.types';
import { formatGameId } from '../../../services/profile/profile.service';
import { Icon } from '../Icon';
import { toast } from '../toast';
import { Body, Copy, CopyText, Id, Label, Row } from './styles';

type Props = {
  game: 'md' | 'dl';
  label: string;
  // Só os 9 dígitos; sem ID mostra `emptyText`.
  id: string | undefined;
  emptyText: string;
};

// ID de jogador com botão de copiar: é o que o oponente cola no jogo pra
// adicionar como amigo ou entrar na sala.
export function GameIdRow({ game, label, id, emptyText }: Props) {
  const copy = () => {
    if (!id) return;
    Clipboard.setString(id);
    toast.success('ID copiado');
  };
  return (
    <Row>
      <Icon name={CATEGORY_ICON[game]} size={20} color={colors.text.secondary} />
      <Body>
        <Label>{label}</Label>
        <Id empty={!id} selectable={!!id}>
          {id ? formatGameId(id) : emptyText}
        </Id>
      </Body>
      {!!id && (
        <Copy onPress={copy} hitSlop={8} accessibilityLabel={`Copiar ${label}`}>
          <Icon name="content-copy" size={16} color={colors.gold.main} />
          <CopyText>Copiar</CopyText>
        </Copy>
      )}
    </Row>
  );
}
