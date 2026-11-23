import * as React from 'react';
import { forwardRef } from 'react';
import { View } from 'react-native';
import { colors } from '../../../configs/colors';
import { Icon } from '../Icon';
import { medalColor } from '../../medalColor';
import {
  SHARE_IMAGE_LIMIT,
  ShareContent,
  ShareMatch,
} from '../ShareSheet/content';
import {
  Brand,
  BrandText,
  Card,
  Code,
  CodeBox,
  CutLabel,
  Footer,
  FooterText,
  Heading,
  Hero,
  HeroLabel,
  HeroName,
  Label,
  Match,
  MatchStatus,
  MatchTable,
  MatchTop,
  Nick,
  Note,
  Num,
  Players,
  Pos,
  Row,
  RowNick,
  Side,
  Subtitle,
  Table,
  Title,
  Tournament,
  Value,
  Versus,
} from './styles';

type Props = { content: ShareContent };

// A imagem que vai para o WhatsApp. Fica fora da tela e só existe enquanto o
// sheet de compartilhar está aberto; sem avatares, para não esperar foto
// carregar antes de capturar.
export const ShareCard = forwardRef<React.ComponentRef<typeof View>, Props>(
  ({ content }, ref) => {
    const total =
      content.kind === 'standings'
        ? content.rows.length
        : content.kind === 'round'
        ? content.matches.length
        : 0;
    const hidden = Math.max(0, total - SHARE_IMAGE_LIMIT);
    return (
      <View ref={ref} collapsable={false}>
        <Card>
          <Brand>
            <Icon name="star-four-points" size={14} color={colors.gold.main} />
            <BrandText>DUEL STARS</BrandText>
          </Brand>
          {content.kind === 'champion' ? (
            <Hero>
              <Icon name="crown" size={48} color={colors.gold.main} />
              <HeroLabel>Campeão</HeroLabel>
              <HeroName numberOfLines={1}>
                {content.champion ? `@${content.champion}` : 'Sem campeão'}
              </HeroName>
              <Tournament>{content.heading}</Tournament>
              <Subtitle>{content.subtitle}</Subtitle>
            </Hero>
          ) : (
            <Heading>
              <Tournament>{content.heading}</Tournament>
              <Title>{content.title}</Title>
              <Subtitle>{content.subtitle}</Subtitle>
            </Heading>
          )}

          {content.kind === 'ranking' ? (
            <Table>
              {content.podium.map((p, i) => (
                <Row key={`${p.nick}-${i}`} tall>
                  <Icon name="medal" size={22} color={medalColor(i + 1)!} />
                  <RowNick numberOfLines={1} big>
                    @{p.nick}
                  </RowNick>
                  <Num strong wide>
                    {p.stars}
                  </Num>
                  <Icon
                    name="star-four-points"
                    size={14}
                    color={colors.gold.main}
                  />
                  <Num wide>
                    {p.wins}V {p.losses}D
                  </Num>
                </Row>
              ))}
            </Table>
          ) : content.kind === 'champion' ? (
            content.podium.length > 0 && (
              <Table>
                {content.podium.map((p, i) => (
                  <Row key={`${p.nick}-${i}`}>
                    <Icon
                      name="medal"
                      size={16}
                      color={medalColor(i === 0 ? 2 : 3)!}
                    />
                    <RowNick numberOfLines={1}>@{p.nick}</RowNick>
                    <Label>{p.label}</Label>
                  </Row>
                ))}
              </Table>
            )
          ) : content.kind === 'invite' ? (
            <>
              <Table>
                {content.info.map(([label, value]) => (
                  <Row key={label}>
                    <Label>{label}</Label>
                    <Value numberOfLines={1}>{value}</Value>
                  </Row>
                ))}
              </Table>
              <CodeBox>
                <HeroLabel>Código do torneio</HeroLabel>
                <Code>{content.code}</Code>
                <Note>Abra o Duel Stars → Torneios → Código</Note>
              </CodeBox>
            </>
          ) : content.kind === 'standings' ? (
            <Table>
              <Row header>
                <Pos>#</Pos>
                <RowNick header>Jogador</RowNick>
                <Num header>Pts</Num>
                <Num header>V-D</Num>
                <Num header wide>
                  Adv. %
                </Num>
              </Row>
              {content.rows.slice(0, SHARE_IMAGE_LIMIT).map((row, i) => (
                <React.Fragment key={`${row.nick}-${i}`}>
                  <Row cut={!!content.topCut && i === content.topCut - 1}>
                    <Pos color={medalColor(i + 1)}>{i + 1}</Pos>
                    <RowNick numberOfLines={1}>@{row.nick}</RowNick>
                    <Num strong>{row.points}</Num>
                    <Num>
                      {row.wins}-{row.losses}
                    </Num>
                    <Num wide>{Math.round(row.omw * 100)}%</Num>
                  </Row>
                  {!!content.topCut &&
                    i === content.topCut - 1 &&
                    i < content.rows.length - 1 && (
                      <CutLabel>Top {content.topCut} classificado</CutLabel>
                    )}
                </React.Fragment>
              ))}
            </Table>
          ) : (
            <Table>
              {content.matches.slice(0, SHARE_IMAGE_LIMIT).map(match => (
                <MatchCard key={match.table} match={match} />
              ))}
            </Table>
          )}

          {hidden > 0 && (
            <Note>
              + {hidden}{' '}
              {content.kind === 'standings' ? 'jogadores' : 'partidas'} · veja
              tudo no app
            </Note>
          )}
          {content.kind === 'champion' && content.pot > 0 && (
            <Note>
              Bolo de {content.pot} estrelas dividido entre os primeiros.
            </Note>
          )}
          {content.kind === 'standings' && (
            <Note>
              Adv. % = aproveitamento dos adversários enfrentados. Desempata
              quem tem os mesmos pontos.
            </Note>
          )}
          <Footer>
            <FooterText>Torneios de Yu-Gi-Oh! online</FooterText>
            <FooterText>Duel Stars</FooterText>
          </Footer>
        </Card>
      </View>
    );
  },
);

function MatchCard({ match }: { match: ShareMatch }) {
  const check = <Icon name="check-circle" size={14} color={colors.gold.main} />;
  const side = (i: 0 | 1) => {
    const nick = match.players[i];
    const won = match.winner === i;
    const lost = match.winner !== null && !won;
    return (
      <Side right={i === 1}>
        {won && i === 1 && check}
        <Nick numberOfLines={1} won={won} lost={lost}>
          {nick ? `@${nick}` : '—'}
        </Nick>
        {won && i === 0 && check}
      </Side>
    );
  };
  return (
    <Match>
      <MatchTop>
        <MatchTable>Mesa {match.table}</MatchTable>
        {!!match.status && <MatchStatus>{match.status}</MatchStatus>}
      </MatchTop>
      <Players>
        {side(0)}
        {!!match.players[1] && (
          <>
            <Versus>x</Versus>
            {side(1)}
          </>
        )}
      </Players>
    </Match>
  );
}
