import * as React from 'react';
import { useState } from 'react';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import {
  AdPlacement,
  adUnitId,
  useAdsReady,
} from '../../../services/ads/ads.service';
import { spacing } from '../../../configs/theme';
import { Container } from './styles';

type Props = {
  placement: AdPlacement;
  // Altura ocupada (0 sem anúncio), pra quem tem lista por baixo reservar o
  // espaço no fim da rolagem.
  onHeight?: (height: number) => void;
};

// Banner fixo no pé da tela, no menor formato padrão (320x50). Some sem
// deixar buraco quando não há anúncio (sem rede, sem bloco configurado,
// sem preenchimento).
export function AdBanner({ placement, onHeight }: Props) {
  const ready = useAdsReady();
  const [failed, setFailed] = useState(false);
  const unitId = adUnitId(placement);
  if (!ready || !unitId || failed) return null;

  return (
    <Container>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.BANNER}
        onAdLoaded={({ height }) => onHeight?.(height + spacing.sm)}
        onAdFailedToLoad={() => {
          setFailed(true);
          onHeight?.(0);
        }}
      />
    </Container>
  );
}
