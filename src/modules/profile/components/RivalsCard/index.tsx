import * as React from 'react';
import { colors } from '../../../../configs/colors';
import { PublicProfile } from '../../../../services/duels/duels.types';
import { MIN_RIVALRY, Rival } from '../../../../services/rivals/rivals.service';
import { Avatar } from '../../../../shared/ui/Avatar';
import { Icon, IconName } from '../../../../shared/ui/Icon';
import { Empty, Kind, KindRow, Nick, RecordText, Row, Slot } from './styles';

type Props = {
  fregues: Rival | null;
  nemesis: Rival | null;
  profiles: Record<string, PublicProfile>;
};

type SlotProps = {
  icon: IconName;
  label: string;
  tone: 'gold' | 'negative';
  rival: Rival | null;
  profile: PublicProfile | undefined;
  empty: string;
};

function RivalSlot({ icon, label, tone, rival, profile, empty }: SlotProps) {
  const color = tone === 'gold' ? colors.gold.main : colors.feedback.negative;
  return (
    <Slot tone={tone}>
      <KindRow>
        <Icon name={icon} size={16} color={color} />
        <Kind color={color}>{label}</Kind>
      </KindRow>
      {rival ? (
        <>
          <Avatar name={profile?.nick ?? '?'} photoUrl={profile?.photoUrl ?? null} size={56} />
          <Nick numberOfLines={1}>@{profile?.nick ?? '...'}</Nick>
          <RecordText>
            Placar {rival.wins} × {rival.losses}
          </RecordText>
        </>
      ) : (
        <Empty>{empty}</Empty>
      )}
    </Slot>
  );
}

// "Meu Freguês / Minha Nêmesis": o placar contra cada rival vira história -
// quem você sempre vence e quem sempre te vence.
export function RivalsCard({ fregues, nemesis, profiles }: Props) {
  return (
    <Row>
      <RivalSlot
        icon="emoticon-tongue"
        label="Meu Freguês"
        tone="gold"
        rival={fregues}
        profile={fregues ? profiles[fregues.uid] : undefined}
        empty={`Vença o mesmo duelista ${MIN_RIVALRY} vezes para ter um freguês.`}
      />
      <RivalSlot
        icon="skull"
        label="Minha Nêmesis"
        tone="negative"
        rival={nemesis}
        profile={nemesis ? profiles[nemesis.uid] : undefined}
        empty={`Quem te vencer ${MIN_RIVALRY} vezes vira sua nêmesis.`}
      />
    </Row>
  );
}
