# Contribuindo

## Setup local

```
yarn install
cp .env.example .env   # preenche com os valores reais, se o projeto usar algum
```

Pra Firebase funcionar (Auth/Analytics/Crashlytics), crie seu próprio
projeto em console.firebase.google.com, registre os apps Android/iOS, e
coloque `google-services.json` (Android, em `android/app/`) e
`GoogleService-Info.plist` (iOS, em `ios/<NomeDoApp>/`) - nenhum dos dois
vem versionado neste repo por padrão (ver `.gitignore`).

Depois disso, os comandos normais do React Native funcionam (`yarn android`,
`yarn ios`). Pra gerar um build de release (AAB) do Android: `yarn release:android`.

## Fluxo de branches

- `main` — só recebe merge quando algo vai virar release de verdade. Não dê
  push direto aqui.
- `dev` — branch de integração. É pra onde as PRs de feature vão.
- Fluxo: cria uma branch a partir de `dev` (`feature/nome-da-coisa`), abre
  PR pra `dev`. Quando `dev` estiver pronta pra lançar, abre PR de `dev`
  pra `main` — o build/release em si continua sendo feito manualmente
  depois do merge.

Se o repo for privado, a proteção de `main` no GitHub (bloquear push direto,
exigir aprovação) exige plano Pro - nesse caso é combinado por convenção,
não travado pela plataforma. Se for público, a proteção é gratuita e vale a
pena ativar de verdade (Settings → Branches).
