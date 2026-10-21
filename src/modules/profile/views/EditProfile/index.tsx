import * as React from 'react';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { colors } from '../../../../configs/colors';
import { spacing } from '../../../../configs/theme';
import { EditProfileProps } from '../../../../navigation/props';
import { useAppSelector } from '../../../../redux/store';
import { NickStatus, nextNickChangeAt, normalizeNick, updateProfile } from '../../../../services/profile/profile.service';
import { City } from '../../../../services/profile/profile.types';
import { Avatar } from '../../../../shared/ui/Avatar';
import { Button } from '../../../../shared/ui/Button';
import { Icon } from '../../../../shared/ui/Icon';
import { toast } from '../../../../shared/ui/toast';
import { CityPicker } from '../../components/CityPicker';
import { NickField } from '../../components/NickField';
import {
  Screen,
  Header,
  IconButton,
  Title,
  PickerBody,
  AvatarWrapper,
  Locked,
  LockedText,
  Hint,
  FieldLabel,
  CityButton,
  CityButtonText,
  Footer,
} from './styles';

function EditProfileScreen({ navigation }: EditProfileProps) {
  const profile = useAppSelector(state => state.profile.profile);
  const [nick, setNick] = useState(profile?.nick ?? '');
  const [nickStatus, setNickStatus] = useState<NickStatus | 'checking' | null>('yours');
  const [city, setCity] = useState<City | null>(
    profile ? { id: profile.cityId, name: profile.cityName, stateId: profile.stateId } : null,
  );
  const [pickingCity, setPickingCity] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!profile || !city) return null;

  const lockedUntil = nextNickChangeAt(profile);
  // Só conta como troca se mudar o nick de fato - mudar só maiúsculas
  // gastaria a troca dos 30 dias à toa.
  const nickChanged = normalizeNick(nick) !== normalizeNick(profile.nick);
  const cityChanged = city.id !== profile.cityId;
  const nickOk = !nickChanged || nickStatus === 'available' || nickStatus === 'yours';
  const canSave = (nickChanged || cityChanged) && nickOk && !saving;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(profile, {
        nick: nickChanged ? nick : undefined,
        city: cityChanged ? city : undefined,
      });
      toast.success('Perfil atualizado');
      navigation.goBack();
    } catch (error) {
      setSaving(false);
      if ((error as { code?: string }).code === 'firestore/permission-denied') {
        toast.error('Esse nick não está disponível agora. Escolha outro.');
        setNickStatus('taken');
      } else {
        toast.error('Não foi possível salvar. Verifique a internet e tente de novo.');
      }
    }
  };

  if (pickingCity) {
    return (
      <Screen>
        <Header>
          <IconButton onPress={() => setPickingCity(false)} hitSlop={12}>
            <Icon name="arrow-left" />
          </IconButton>
          <Title>Escolher cidade</Title>
        </Header>
        <PickerBody>
          <CityPicker
            selected={city}
            onSelect={selected => {
              setCity(selected);
              setPickingCity(false);
            }}
          />
        </PickerBody>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header>
        <IconButton onPress={() => navigation.goBack()} hitSlop={12}>
          <Icon name="arrow-left" />
        </IconButton>
        <Title>Editar perfil</Title>
      </Header>

      <ScrollView contentContainerStyle={{ padding: spacing.xl }} keyboardShouldPersistTaps="handled">
        <AvatarWrapper>
          <Avatar name={nick || profile.nick} photoUrl={profile.photoUrl} size={96} />
        </AvatarWrapper>

        {lockedUntil ? (
          <Locked>
            <Icon name="lock-clock" size={20} color={colors.text.secondary} />
            <LockedText>
              Você trocou de nick recentemente. Poderá trocar de novo em{' '}
              {new Date(lockedUntil).toLocaleDateString('pt-BR')}.
            </LockedText>
          </Locked>
        ) : (
          <>
            <NickField uid={profile.uid} value={nick} onChange={setNick} onStatusChange={setNickStatus} />
            <Hint>Dá para trocar o nick 1 vez a cada 30 dias.</Hint>
          </>
        )}

        <FieldLabel>Cidade</FieldLabel>
        <CityButton onPress={() => setPickingCity(true)}>
          <Icon name="map-marker" color={colors.gold.main} />
          <CityButtonText>
            {city.name} · {city.stateId}
          </CityButtonText>
          <Icon name="chevron-right" color={colors.text.muted} />
        </CityButton>
      </ScrollView>

      <Footer>
        <Button label="Salvar" disabled={!canSave} loading={saving} onPress={handleSave} />
      </Footer>
    </Screen>
  );
}

export default EditProfileScreen;
