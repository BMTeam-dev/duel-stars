import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner, type Code } from 'react-native-vision-camera';
import { NoCamera } from './styles';

type Props = {
  isActive: boolean;
  onScanned: (values: (string | undefined)[]) => void;
  onError: () => void;
};

// VisionCamera 4 (e não a 5): a 5 só compila com o SDK do Xcode 26. O leitor
// de QR já vem embutido (ML Kit no Android, AVFoundation no iOS). Sem câmera
// (lista ainda carregando, aparelho/emulador sem câmera) vira só uma mensagem.
export function QrScanner({ isActive, onScanned, onError }: Props) {
  const device = useCameraDevice('back');
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes: Code[]) => onScanned(codes.map(code => code.value)),
  });

  if (!device) {
    return <NoCamera>Nenhuma câmera traseira encontrada neste aparelho.</NoCamera>;
  }
  return (
    <Camera
      style={StyleSheet.absoluteFill}
      isActive={isActive}
      device={device}
      codeScanner={codeScanner}
      onError={onError}
    />
  );
}
