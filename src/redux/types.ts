// Só o que realmente precisa sobreviver a fechar/abrir o app entra aqui -
// qualquer coisa recalculável (ex: `remaining`/`limit` de uma API) fica de
// fora do persist. Ver store.ts pro mecanismo de persistência seletiva.
export type PersistedSlice = {
  // Exemplo de campo persistido - troque/expanda pelo que seu app precisa
  // lembrar entre sessões (ex: um token de auth, uma preferência de UI).
  token: string;
};

export type MainSlice = {
  name: string;
};

export type AuthUserState = {
  uid: string;
  email: string | null;
  name: string | null;
};

export type AuthSlice = {
  // undefined = ainda não sabemos (Firebase carregando a sessão salva, ver
  // useAuthListener.ts); null = deslogado; AuthUserState = logado.
  user: AuthUserState | null | undefined;
};
