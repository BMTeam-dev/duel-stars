import * as React from 'react';
import { forwardRef } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreensTypes } from '../../navigation/screensTypes';
import { CATEGORY_LABEL, isOnlineCategory } from '../../services/duels/duels.types';
import { useActiveCategory } from '../../services/profile/useActiveCategory';
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
  const { category } = useActiveCategory();
  const online = isOnlineCategory(category);
  const dismiss = () => (ref as React.RefObject<BottomSheetModal | null>).current?.dismiss();

  // Presencial (TCG): QR na mesa. Online: código mandado por mensagem.
  const options: Option[] = online
    ? [
        {
          icon: 'pound',
          title: 'Gerar código',
          subtitle: 'Defina a aposta e mande o código pro oponente',
          onPress: () => {
            dismiss();
            navigation.navigate('CreateChallenge');
          },
        },
        {
          icon: 'keyboard',
          title: 'Digitar código',
          subtitle: 'Use o código que o oponente te mandou',
          onPress: () => {
            dismiss();
            navigation.navigate('ScanChallenge', { mode: 'code' });
          },
        },
      ]
    : [
        {
          icon: 'qrcode',
          title: 'Gerar meu QR',
          subtitle: 'Defina a aposta e mostre o QR pro oponente',
          onPress: () => {
            dismiss();
            navigation.navigate('CreateChallenge');
          },
        },
        {
          icon: 'qrcode-scan',
          title: 'Escanear QR',
          subtitle: 'Leia o QR de quem te desafiou',
          onPress: () => {
            dismiss();
            navigation.navigate('ScanChallenge', { mode: 'camera' });
          },
        },
      ];

  return (
    <AppSheet ref={ref} title={`Desafiar · ${CATEGORY_LABEL[category]}`}>
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
