import * as React from 'react';
import { forwardRef } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { colors } from '../../configs/colors';
import { AppSheet } from '../../shared/ui/AppSheet';
import { Icon, IconName } from '../../shared/ui/Icon';
import { toast } from '../../shared/ui/toast';
import {
  OptionCard,
  OptionIcon,
  OptionTexts,
  OptionTitle,
  OptionSubtitle,
  OptionsList,
} from './styles';

type Option = {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
};

// As duas portas de entrada de um duelo (ver "Fluxo do desafio" no doc do
// MVP). Gerar/escanear QR entram na fase 2 - por enquanto só avisam.
export const ChallengeSheet = forwardRef<BottomSheetModal>((_, ref) => {
  const options: Option[] = [
    {
      icon: 'qrcode',
      title: 'Gerar meu QR',
      subtitle: 'Defina a aposta e mostre o QR pro oponente',
      onPress: () => toast('Gerar QR chega na próxima etapa'),
    },
    {
      icon: 'qrcode-scan',
      title: 'Escanear QR',
      subtitle: 'Leia o QR de quem te desafiou',
      onPress: () => toast('Escanear QR chega na próxima etapa'),
    },
  ];

  return (
    <AppSheet ref={ref} title="Desafiar">
      <OptionsList>
        {options.map(option => (
          <OptionCard key={option.title} onPress={option.onPress}>
            <OptionIcon>
              <Icon name={option.icon} size={28} color={colors.gold.main} />
            </OptionIcon>
            <OptionTexts>
              <OptionTitle>{option.title}</OptionTitle>
              <OptionSubtitle>{option.subtitle}</OptionSubtitle>
            </OptionTexts>
            <Icon name="chevron-right" color={colors.text.muted} />
          </OptionCard>
        ))}
      </OptionsList>
    </AppSheet>
  );
});
