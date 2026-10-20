# Duel Stars

App de Yu-Gi-Oh para duelos presenciais: um jogador desafia outro por QR
code, os dois apostam estrelas e o resultado vira post num feed por cidade.
Especificação do MVP (regras, telas, modelo de dados, roadmap):
https://claude.ai/code/artifact/b486dc3f-2a39-4670-8c88-574c31d86340

Criado a partir do scaffold `BrenoEndymion/rn-app-scaffold`: React Native
(0.87.x, New Architecture), TypeScript, Redux Toolkit, React Navigation v7,
styled-components/native. Este CLAUDE.md explica a estrutura e,
principalmente, **como adicionar um módulo novo** seguindo o mesmo padrão
do resto do projeto.

## Estrutura de pastas (`src/`)

- `App.tsx` - bootstrap: Redux `Provider` + `PersistGate`, `NavigationContainer`,
  `PaperProvider`, e o listener de auth. Ponto único onde tudo se conecta -
  não deveria crescer muito além disso.
- `navigation/` - tudo relacionado a rotas:
  - `screensTypes.ts` - uma entrada por tela, com os parâmetros que ela
    recebe (ou `undefined`).
  - `navigationTypes.ts` / `props.tsx` - tipos derivados de `screensTypes.ts`
    pra cada tela importar suas próprias `Props` já tipadas.
  - `index.tsx` - o `Stack.Navigator` de verdade, registra cada `Screen`.
- `redux/` - um arquivo de slice por domínio (`authSlice.ts`,
  `persistedSlice.ts`, `mainSlice.ts`), mais:
  - `types.ts` - o shape de cada slice, num lugar só.
  - `store.ts` - monta o store e decide **o que persiste** (ver seção
    própria abaixo).
  - `storage.ts` - o adapter de storage (MMKV) que o `redux-persist` usa.
- `services/` - lógica que fala com o mundo de fora (Firebase, APIs, SDKs
  nativos), sem depender de nenhuma tela específica. Hoje tem `auth/`
  (Firebase Auth + Google Sign-In), `analytics/` (Firebase Analytics),
  `crashReporting/` (Crashlytics). Services não importam de `features/`
  nunca - a dependência é sempre features → services, não o contrário.
- `features/<nome>/` - uma tela (ou grupo pequeno de telas relacionadas) +
  tudo que só ela usa. Ver a seção "como adicionar um módulo" abaixo pro
  padrão exato.
- `shared/` - utilitário genérico usado por mais de um service/feature, sem
  dependência de nenhum dos dois (ex: `deviceId.ts`).
- `configs/` - configuração de bibliotecas de UI (`colors.ts`,
  `paperTheme.ts`) - paleta e tema num lugar só, não espalhado em cada tela.

## Como adicionar um módulo/feature novo

Exemplo real nesse próprio scaffold: `features/auth/` (duas telas,
Login+Signup) e `features/home/` (uma tela placeholder). Pra criar um
módulo `pedidos`, por exemplo:

1. Registre a(s) tela(s) em `navigation/screensTypes.ts`:
   ```ts
   export type ScreensTypes = {
     Home: undefined;
     Pedidos: { pedidoId?: string }; // parâmetros que a tela recebe, se tiver
     // ...
   };
   ```
2. Adicione a linha correspondente em `navigation/props.tsx`:
   ```ts
   export type PedidosProps = StackScreenProps<'Pedidos'>;
   ```
3. Crie `src/features/pedidos/`:
   - `styles.ts` - todo o styled-components do módulo, exportado por nome
     (`Container`, `Title`, etc. - ver `features/home/styles.ts` pro
     exemplo mais simples, `features/auth/styles.ts` pro mais completo).
   - `PedidosScreen.tsx` - o componente, recebendo `PedidosProps`. Se a
     lógica/estado for simples, fica tudo aqui mesmo (ver `HomeScreen.tsx`).
     Se crescer (múltiplos `useState`, side effects, chamadas assíncronas),
     extraia pra um hook próprio: `usePedidos.ts`, que a `Screen` só chama -
     mantém o componente focado em renderizar, não em orquestrar (ver o
     app de origem desse scaffold, que tinha um `useConversation.ts`
     orquestrando toda a lógica de uma tela de chat, enquanto a `Screen`
     só montava JSX).
4. Registre a tela em `navigation/index.tsx` (importa o componente, adiciona
   um `<Stack.Screen name="Pedidos" component={PedidosScreen} ... />`).
5. Se o módulo precisa lembrar alguma coisa entre sessões (ex: uma
   preferência, um rascunho) - ver a seção de Redux/persistência abaixo
   antes de inventar outro mecanismo de storage.

## Redux: o que persiste e por quê

`redux/store.ts` decide isso explicitamente, em duas camadas:

1. `whitelist: ['persisted']` - só o slice `persisted` sobrevive a fechar o
   app (os outros, tipo `auth`, recalculam do zero toda sessão - no caso de
   auth, o próprio Firebase já lembra a sessão por conta própria via
   `onAuthStateChanged`, não precisa duplicar isso no redux-persist).
2. `createWhitelistFilter('persisted', ['token'])` - mesmo dentro do slice
   `persisted`, só o campo `token` (exemplo) realmente é salvo. Adicionar um
   campo novo em `PersistedSlice` (ver `redux/types.ts`) SEM adicionar o
   nome dele nessa lista não tem efeito nenhum - ele nunca sai da memória.

Pra persistir um slice inteiro sem filtrar campo a campo (útil pra algo
tipo um histórico que cresce com o tempo, em vez de poucas preferências
fixas), basta incluir o nome do slice em `whitelist` e não adicionar um
`createWhitelistFilter` pra ele.

## Convenção de comentários

Comentário só quando explica um **porquê** não óbvio - uma decisão de
produto, um workaround pra um bug real de uma biblioteca, uma armadilha de
API. Nunca o "o quê" (nomes de função/variável já dizem isso). Vários
comentários neste scaffold documentam bugs reais e corrigidos no app de
origem (ex: por que o Crashlytics não funciona em build de debug, por que o
`KeyboardAvoidingView` precisa de `behavior="height"` no Android) - não
apague sem entender o contexto, e siga o mesmo padrão ao adicionar algo
novo.

## Limitações conhecidas

- **Crashlytics não funciona em build de debug** - é um gate nativo
  (`BuildConfig.DEBUG`), não um bug seu. Funciona normalmente em release.
  Ver comentário em `services/crashReporting/crashReporting.service.ts`.
- Nenhum backend está incluso de propósito (varia demais de projeto pra
  projeto) - `services/auth/` fala direto com Firebase Auth, sem servidor
  próprio no meio. Se seu app precisar de um backend, ele é um projeto
  separado, não faz parte deste scaffold.

## Firebase deste projeto

- Projeto: display name "Duel Stars", ID `newagent-90870` (projeto antigo
  reaproveitado por falta de cota no Google Cloud - o ID não muda).
- Firestore: banco **nomeado** `duel-start` (modo nativo, Standard,
  `southamerica-east1`). Não é o `(default)` - o `(default)` desse projeto é
  um banco legado em modo Datastore, vazio, que não serve pro SDK. Todo
  acesso ao Firestore (app e Cloud Functions) precisa passar o ID
  `duel-start` explicitamente.
- `google-services.json` / `GoogleService-Info.plist` ficam fora do git;
  baixe com `firebase apps:sdkconfig` (ver `CONTRIBUTING.md`).
- Regras de segurança em `firestore.rules`, publicadas com
  `firebase deploy --only firestore` (o `firebase.json` já aponta pro banco
  `duel-start`). Estrelas/vitórias/derrotas só nascem com valor fixo no
  cadastro e depois só mudam via Cloud Functions - o app nunca escreve isso.
- Perfil: `users/{uid}`; unicidade de nick: `nicks/{nickEmMinúsculas}`
  (ver `services/profile/profile.service.ts`).

## Backend (Cloud Functions) e operação

- Código em `functions/` (TypeScript, Node 22, região `southamerica-east1`).
  Tudo que mexe em estrelas está em `functions/src/duels.ts`, em transação;
  o app só chama as funções (`createChallenge`, `acceptChallenge`,
  `reportResult`, `cancelChallenge`) e lê os docs.
- Deploy é MANUAL (push no git não sobe nada):
  `firebase deploy --only functions` (backend) e
  `firebase deploy --only firestore` (regras + índices). Índice novo leva
  alguns minutos para ficar utilizável depois do deploy.
- Tarefas agendadas (Cloud Scheduler): `expireDuels` a cada hora (prazos de
  24h/48h) e `weeklyRefill` toda segunda 6h.
- Onde ver: Firestore (dados/regras/índices), Firebase > Functions (deploys,
  logs), Cloud Scheduler (agendamentos), Firebase > Uso e faturamento.
- Plano Blaze ativo; limpeza de imagens antigas das Functions configurada
  (`firebase functions:artifacts:setpolicy`) pra não acumular custo.
