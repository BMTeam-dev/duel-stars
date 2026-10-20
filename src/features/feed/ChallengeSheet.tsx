import * as React from 'react';
import { forwardRef } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreensTypes } from '../../navigation/screensTypes';
import { colors } from '../../configs/colors';
import { AppSheet } from '../../shared/ui/AppSheet';
import { Icon, IconName } from '../../shared/ui/Icon';
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

// As duas portas de entrada de um duelo (ver "Fluxo do desafio" no doc do MVP).
export const ChallengeSheet = forwardRef<BottomSheetModal>((_, ref) => {
  const navigation = useNavigation<NativeStackNavigationProp<ScreensTypes>>();
  const open = (screen: 'CreateChallenge' | 'ScanChallenge') => {
    (ref as React.RefObject<BottomSheetModal | null>).current?.dismiss();
    navigation.navigate(screen);
  };
  const options: Option[] = [
    {
      icon: 'qrcode',
      title: 'Gerar meu QR',
      subtitle: 'Defina a aposta e mostre o QR pro oponente',
      onPress: () => open('CreateChallenge'),
    },
    {
      icon: 'qrcode-scan',
      title: 'Escanear QR',
      subtitle: 'Leia o QR de quem te desafiou',
      onPress: () => open('ScanChallenge'),
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
