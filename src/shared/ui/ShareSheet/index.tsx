import * as React from 'react';
import { forwardRef, useRef, useState } from 'react';
import { View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import RNShare from 'react-native-share';
import { captureRef } from 'react-native-view-shot';
import { AppSheet } from '../AppSheet';
import { Button } from '../Button';
import { toast } from '../toast';
import { ShareContent, shareText } from './content';
import { ShareCard } from '../ShareCard';
import { CARD_WIDTH } from '../ShareCard/styles';
import { Body, Hint, Offscreen } from './styles';

type Props = { content: ShareContent | null };

export const ShareSheet = forwardRef<BottomSheetModal, Props>(
  ({ content }, ref) => {
    const cardRef = useRef<React.ComponentRef<typeof View>>(null);
    const [busy, setBusy] = useState(false);

    const sendImage = async () => {
      if (!content || !cardRef.current) return;
      setBusy(true);
      try {
        const path = await captureRef(cardRef, {
          format: 'png',
          result: 'tmpfile',
          width: CARD_WIDTH * 3,
        });
        await RNShare.open({
          url: path.startsWith('file://') ? path : `file://${path}`,
          type: 'image/png',
          failOnCancel: false,
        });
      } catch {
        toast.error('Não deu para gerar a imagem. Tente copiar como texto.');
      } finally {
        setBusy(false);
      }
    };

    const copyText = () => {
      if (!content) return;
      Clipboard.setString(shareText(content));
      toast.success('Texto copiado. É só colar no grupo.');
    };

    return (
      <>
        {!!content && (
          <Offscreen pointerEvents="none">
            <ShareCard ref={cardRef} content={content} />
          </Offscreen>
        )}
        <AppSheet
          ref={ref}
          title={
            content?.kind === 'round'
              ? `Compartilhar ${content.title.toLowerCase()}`
              : content?.kind === 'champion'
              ? 'Compartilhar campeão'
              : content?.kind === 'invite'
              ? 'Compartilhar torneio'
              : content?.kind === 'ranking'
              ? 'Compartilhar ranking'
              : 'Compartilhar classificação'
          }
        >
          <Body>
            <Hint>
              {content?.kind === 'invite' && content.password
                ? 'A imagem leva o código, sem a senha. O texto leva os dois, com a formatação do WhatsApp.'
                : 'A imagem sai com a marca do Duel Stars, pronta para o grupo. O texto já vem com a formatação do WhatsApp.'}
            </Hint>
            <Button
              label="Enviar como imagem"
              icon="image-outline"
              loading={busy}
              onPress={sendImage}
            />
            <Button
              label="Copiar como texto"
              icon="content-copy"
              variant="secondary"
              onPress={copyText}
            />
          </Body>
        </AppSheet>
      </>
    );
  },
);
