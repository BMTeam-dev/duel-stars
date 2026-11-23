import { useEffect, useState } from 'react';
import mobileAds, { AdsConsent, TestIds } from 'react-native-google-mobile-ads';

// Blocos de anúncio criados no AdMob (Apps > Duel Stars > Blocos de
// anúncios). Em debug sempre os de teste do Google: clicar em anúncio real
// do próprio app pode suspender a conta.
const UNITS = {
  feed: '',
  ranking: '',
};
export type AdPlacement = keyof typeof UNITS;

export const adUnitId = (placement: AdPlacement): string | null =>
  __DEV__ ? TestIds.ADAPTIVE_BANNER : UNITS[placement] || null;

let started: Promise<boolean> | null = null;

// Consentimento antes de pedir anúncio: o formulário só aparece onde a lei
// exige (Europa e Reino Unido) e se houver mensagem criada em "Privacidade e
// mensagens" no AdMob. No Brasil passa direto.
export function startAds(): Promise<boolean> {
  if (!started) {
    started = (async () => {
      const consent = await AdsConsent.gatherConsent().catch(() => null);
      if (consent && !consent.canRequestAds) return false;
      await mobileAds().initialize();
      return true;
    })().catch(() => false);
  }
  return started;
}

export function useAdsReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    startAds().then(ok => alive && setReady(ok));
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}
