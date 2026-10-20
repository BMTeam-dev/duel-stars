import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useBarcodeScannerOutput, type Barcode } from 'react-native-vision-camera-barcode-scanner';
import styled from 'styled-components/native';
import { colors } from '../../configs/colors';
import { fontSize, spacing } from '../../configs/theme';

type Props = {
  isActive: boolean;
  onScanned: (barcodes: Barcode[]) => void;
  onError: () => void;
};

// No lugar do <CodeScanner> pronto da lib: ele lança erro quando ainda não
// há câmera (lista carregando ou aparelho/emulador sem câmera) e derruba a
// tela inteira. Aqui isso vira só uma mensagem.
export function QrScanner({ isActive, onScanned, onError }: Props) {
  const device = useCameraDevice('back');
  const output = useBarcodeScannerOutput({
    barcodeFormats: ['qr-code'],
    onBarcodeScanned: onScanned,
    onError,
  });

  if (!device) {
    return <NoCamera>Nenhuma câmera traseira encontrada neste aparelho.</NoCamera>;
  }
  return (
    <Camera
      style={StyleSheet.absoluteFill}
      isActive={isActive}
      device={device}
      outputs={[output]}
      onError={onError}
    />
  );
}

const NoCamera = styled.Text`
  position: absolute;
  top: ${spacing.xl}px;
  left: ${spacing.xl}px;
  right: ${spacing.xl}px;
  color: ${colors.text.secondary};
  font-size: ${fontSize.body}px;
  text-align: center;
`;
