import * as React from 'react';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { spacing } from '../../../../configs/theme';
import { CreateTournamentProps } from '../../../../navigation/props';
import { duelErrorMessage } from '../../../../services/duels/duels.service';
import {
  CATEGORIES,
  CATEGORY_LABEL,
  Category,
  DuelFormat,
} from '../../../../services/duels/duels.types';
import { useActiveCategory } from '../../../../services/profile/useActiveCategory';
import {
  createTournament,
  joinTournament,
} from '../../../../services/tournaments/tournaments.service';
import {
  MAX_STARS_ENTRY,
  ROUND_DEADLINES,
  RoundMode,
  TOURNAMENT_FORMAT_LABEL,
  TournamentFormat,
} from '../../../../services/tournaments/tournaments.types';
import { Button } from '../../../../shared/ui/Button';
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader';
import { TextField } from '../../../../shared/ui/TextField';
import { toast } from '../../../../shared/ui/toast';
import { OptionChips } from '../../components/OptionChips';
import { Footer, Hint, Label, Row, RowItem, Screen, Section } from './styles';
import { parseStart, maskDate, maskTime, parseMoney } from '../../parse';

// Padrão do prazo da rodada: presencial acaba no dia; online pode levar semanas.
const defaultDeadline = (category: Category) =>
  category === 'tcg' ? 50 : 60 * 24 * 7;
// Online (DL/MD) costuma ter rodadas de dias, com aviso do organizador.
const defaultRoundMode = (category: Category): RoundMode =>
  category === 'tcg' ? 'auto' : 'manual';

function CreateTournamentScreen({ navigation }: CreateTournamentProps) {
  const { category: activeCategory } = useActiveCategory();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(activeCategory);
  const [format, setFormat] = useState<TournamentFormat>('swiss');
  const [matchFormat, setMatchFormat] = useState<DuelFormat>('bo3');
  const [scheduled, setScheduled] = useState(true);
  const [playsToo, setPlaysToo] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(16);
  const [roundMinutes, setRoundMinutes] = useState<number | null>(
    defaultDeadline(activeCategory),
  );
  const [deadlineTouched, setDeadlineTouched] = useState(false);
  const [roundMode, setRoundMode] = useState<RoundMode>(
    defaultRoundMode(activeCategory),
  );
  const [modeTouched, setModeTouched] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [password, setPassword] = useState('');
  const [listed, setListed] = useState(true);
  const [contact, setContact] = useState('');
  const [paid, setPaid] = useState(false);
  const [requireDeck, setRequireDeck] = useState(false);
  const [fee, setFee] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [starsEntry, setStarsEntry] = useState(0);
  const [minStars, setMinStars] = useState('');
  const [saving, setSaving] = useState(false);

  const changeCategory = (next: Category) => {
    setCategory(next);
    if (!deadlineTouched) setRoundMinutes(defaultDeadline(next));
    if (!modeTouched) setRoundMode(defaultRoundMode(next));
  };

  const startsAt = parseStart(date, time);
  const feeCents = parseMoney(fee);
  const problems = [
    name.trim().length < 3 && 'Dê um nome ao torneio.',
    scheduled &&
      !startsAt &&
      'Informe a data (DD/MM) e a hora (HH:MM) de início.',
    visibility === 'private' &&
      password.trim().length < 3 &&
      'Defina a senha do torneio privado.',
    paid &&
      (!feeCents || pixKey.trim().length < 5) &&
      'Informe o valor e a chave Pix da inscrição.',
  ].filter(Boolean) as string[];

  const handleCreate = async () => {
    if (problems.length) {
      toast.error(problems[0]);
      return;
    }
    setSaving(true);
    try {
      const { id } = await createTournament({
        name: name.trim(),
        description: description.trim(),
        category,
        format,
        matchFormat,
        visibility,
        password: visibility === 'private' ? password.trim() : undefined,
        listed: visibility === 'public' || listed,
        contact: contact.trim(),
        entryFeeCents: paid ? feeCents : null,
        pixKey: paid ? pixKey.trim() : '',
        starsEntry,
        minStars: Number(minStars) > 0 ? Number(minStars) : null,
        maxPlayers,
        roundMode,
        requireDeck,
        roundMinutes: roundMode === 'manual' ? null : roundMinutes,
        startsAt: scheduled ? startsAt : null,
      });
      // Organizador que joga entra pela inscrição normal (mesmas regras de
      // ID do jogo e estrelas); se faltar algo, ele se inscreve pela tela.
      if (playsToo) {
        try {
          await joinTournament(
            id,
            visibility === 'private' ? password.trim() : undefined,
          );
        } catch (error) {
          toast.error(
            `Torneio criado, mas não deu para te inscrever: ${duelErrorMessage(
              error,
            )}`,
          );
          navigation.replace('Tournament', { tournamentId: id });
          return;
        }
      }
      toast.success(
        playsToo ? 'Torneio criado e você está inscrito' : 'Torneio criado',
      );
      navigation.replace('Tournament', { tournamentId: id });
    } catch (error) {
      toast.error(duelErrorMessage(error));
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Criar torneio" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ padding: spacing.xl }}
          keyboardShouldPersistTaps="handled"
        >
          <TextField
            label="Nome do torneio"
            value={name}
            onChangeText={setName}
            maxLength={60}
          />
          <TextField
            label="Descrição (opcional)"
            placeholder="Banlist, regras da casa, premiação..."
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
          />

          <Section>
            <Label>Categoria</Label>
            <OptionChips
              options={CATEGORIES.map(c => ({
                value: c,
                label: CATEGORY_LABEL[c],
              }))}
              value={category}
              onChange={changeCategory}
            />
          </Section>

          <Section>
            <Label>Formato</Label>
            <OptionChips<TournamentFormat>
              options={[
                { value: 'swiss', label: TOURNAMENT_FORMAT_LABEL.swiss },
                { value: 'single', label: TOURNAMENT_FORMAT_LABEL.single },
              ]}
              value={format}
              onChange={setFormat}
            />
            <Hint>
              {format === 'swiss'
                ? 'Rodadas e top cut calculados pelo número de jogadores, como no oficial.'
                : 'Chave eliminatória: quem perde sai.'}
            </Hint>
          </Section>

          <Section>
            <Label>Partidas</Label>
            <OptionChips<DuelFormat>
              options={[
                { value: 'bo3', label: 'Melhor de 3' },
                { value: 'bo1', label: 'Melhor de 1' },
              ]}
              value={matchFormat}
              onChange={setMatchFormat}
            />
          </Section>

          <Section>
            <Label>Início</Label>
            <OptionChips<boolean>
              options={[
                { value: true, label: 'Data marcada' },
                { value: false, label: 'Quando eu iniciar' },
              ]}
              value={scheduled}
              onChange={setScheduled}
            />
            {scheduled ? (
              <Row>
                <RowItem>
                  <TextField
                    label="Data"
                    placeholder="DD/MM"
                    value={date}
                    onChangeText={v => setDate(maskDate(v))}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </RowItem>
                <RowItem>
                  <TextField
                    label="Hora"
                    placeholder="HH:MM"
                    value={time}
                    onChangeText={v => setTime(maskTime(v))}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </RowItem>
              </Row>
            ) : (
              <Hint>
                Sem data: as inscrições ficam abertas até você abrir o check-in
                e iniciar. Sem começar em 30 dias, o torneio é cancelado e as
                estrelas voltam.
              </Hint>
            )}
          </Section>

          <Section>
            <Label>Você vai jogar?</Label>
            <OptionChips<boolean>
              options={[
                { value: false, label: 'Só organizo' },
                { value: true, label: 'Organizo e jogo' },
              ]}
              value={playsToo}
              onChange={setPlaysToo}
            />
            {playsToo && (
              <Hint>
                Você entra inscrito. Nas suas partidas o resultado é pelo
                informe dos dois e pelo prazo, como para todos: você não decide
                a própria partida.
              </Hint>
            )}
          </Section>

          <Section>
            <Label>Vagas</Label>
            <OptionChips<number>
              options={[4, 8, 16, 32, 64].map(n => ({
                value: n,
                label: String(n),
              }))}
              value={maxPlayers}
              onChange={setMaxPlayers}
            />
          </Section>

          <Section>
            <Label>Print do deck</Label>
            <OptionChips<boolean>
              options={[
                { value: false, label: 'Não pedir' },
                { value: true, label: 'Pedir e validar' },
              ]}
              value={requireDeck}
              onChange={setRequireDeck}
            />
            {requireDeck && (
              <Hint>
                Cada jogador envia o print do deck na inscrição e só você vê.
                Quem não tiver o deck aprovado não consegue fazer o check-in. As
                imagens são apagadas quando o torneio termina.
              </Hint>
            )}
          </Section>

          <Section>
            <Label>Rodadas</Label>
            <OptionChips<RoundMode>
              options={[
                { value: 'manual', label: 'Eu inicio cada uma' },
                { value: 'auto', label: 'Automáticas' },
              ]}
              value={roundMode}
              onChange={value => {
                setModeTouched(true);
                setRoundMode(value);
              }}
            />
            <Hint>
              {roundMode === 'manual'
                ? 'Os confrontos aparecem e esperam você. Ao iniciar cada rodada, você marca até quando ela vai (dia e hora) e escreve o aviso, que chega por notificação para todos.'
                : 'Cada rodada começa sozinha assim que a anterior termina, com a duração escolhida abaixo.'}
            </Hint>
          </Section>

          {roundMode === 'auto' && (
            <Section>
              <Label>Prazo da rodada</Label>
              <OptionChips<number | null>
                options={ROUND_DEADLINES.map(o => ({
                  value: o.minutes,
                  label: o.label,
                }))}
                value={roundMinutes}
                onChange={value => {
                  setDeadlineTouched(true);
                  setRoundMinutes(value);
                }}
              />
              <Hint>
                {roundMinutes === null
                  ? 'A rodada só avança quando todas as partidas tiverem resultado; você pode destravar partidas paradas.'
                  : 'Partida sem resultado no fim do prazo é derrota dupla.'}
              </Hint>
            </Section>
          )}

          <Section>
            <Label>Visibilidade</Label>
            <OptionChips<'public' | 'private'>
              options={[
                { value: 'public', label: 'Público' },
                { value: 'private', label: 'Privado (com senha)' },
              ]}
              value={visibility}
              onChange={setVisibility}
            />
            {visibility === 'private' && (
              <>
                <TextField
                  label="Senha"
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  maxLength={30}
                />
                <OptionChips<boolean>
                  options={[
                    { value: true, label: 'Mostrar na lista' },
                    { value: false, label: 'Só por código' },
                  ]}
                  value={listed}
                  onChange={setListed}
                />
                <Hint>
                  {listed
                    ? 'Aparece no Feed e na aba Torneios com cadeado; quem quiser entrar pede a senha.'
                    : 'Não aparece na lista: só entra quem receber o código e a senha.'}
                </Hint>
              </>
            )}
          </Section>

          <Section>
            <Label>Contato do organizador (opcional)</Label>
            <TextField
              label="WhatsApp, Discord ou Instagram"
              value={contact}
              onChangeText={setContact}
              autoCapitalize="none"
              maxLength={80}
            />
          </Section>

          <Section>
            <Label>Inscrição</Label>
            <OptionChips<'free' | 'paid'>
              options={[
                { value: 'free', label: 'Grátis' },
                { value: 'paid', label: 'Paga (Pix)' },
              ]}
              value={paid ? 'paid' : 'free'}
              onChange={v => setPaid(v === 'paid')}
            />
            {paid && (
              <>
                <TextField
                  label="Valor (R$)"
                  placeholder="10,00"
                  value={fee}
                  onChangeText={setFee}
                  keyboardType="decimal-pad"
                  maxLength={9}
                />
                <TextField
                  label="Chave Pix"
                  value={pixKey}
                  onChangeText={setPixKey}
                  autoCapitalize="none"
                  maxLength={77}
                />
                <Hint>
                  O app não recebe o pagamento: você confere o Pix e marca quem
                  pagou na lista de inscritos.
                </Hint>
              </>
            )}
          </Section>

          <Section>
            <Label>Estrelas</Label>
            <OptionChips<number>
              options={Array.from({ length: MAX_STARS_ENTRY + 1 }, (_, n) => ({
                value: n,
                label: n === 0 ? 'Sem estrelas' : `${n} por jogador`,
              }))}
              value={starsEntry}
              onChange={setStarsEntry}
            />
            <Hint>
              {starsEntry === 0
                ? 'Sem bolo de estrelas.'
                : 'Cada inscrito trava essas estrelas. O bolo: até 3 jogadores, tudo pro campeão; 4 a 7, 70% e 30%; 8 ou mais, 50%, 30% e 10% pro 3º e 4º.'}
            </Hint>
            <TextField
              label="Mínimo de estrelas para entrar (opcional)"
              value={minStars}
              onChangeText={v => setMinStars(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
            />
          </Section>
        </ScrollView>
        <Footer>
          <Button
            label="Criar torneio"
            icon="tournament"
            size="lg"
            loading={saving}
            onPress={handleCreate}
          />
        </Footer>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export default CreateTournamentScreen;
