import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  signOut as firebaseSignOut,
  updateProfile,
  getIdToken as getFirebaseIdToken,
  deleteUser,
  GoogleAuthProvider,
  type User,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { crashReportingService } from '../crashReporting/crashReporting.service';

// Client ID "Web" (client_type 3), gerado automaticamente pelo Firebase ao
// habilitar o provedor Google em Authentication > Sign-in method - é o mesmo
// em Android e iOS (não é a chave por-plataforma). Não é segredo: já vai
// embutido em texto claro no google-services.json/GoogleService-Info.plist
// que o app carrega de qualquer forma. SUBSTITUA pelo client ID do SEU
// projeto Firebase antes de usar Google Sign-In de verdade.
const GOOGLE_WEB_CLIENT_ID = 'SEU_WEB_CLIENT_ID.apps.googleusercontent.com';

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
});

const auth = getAuth();

export type AuthUser = {
  uid: string;
  email: string | null;
  name: string | null;
};

function toAuthUser(user: User): AuthUser {
  return { uid: user.uid, email: user.email, name: user.displayName };
}

export function onAuthStateChanged(
  callback: (user: AuthUser | null) => void,
): () => void {
  return onFirebaseAuthStateChanged(auth, firebaseUser => {
    callback(firebaseUser ? toAuthUser(firebaseUser) : null);
  });
}

export async function signUpWithEmail(
  name: string,
  email: string,
  password: string,
): Promise<AuthUser> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  // Não usa toAuthUser(credential.user) aqui: updateProfile não faz o
  // onAuthStateChanged disparar de novo, então o objeto `user` em memória
  // fica com o displayName antigo (null) até a próxima sessão - usamos o
  // `name` que a gente mesmo acabou de salvar.
  return { uid: credential.user.uid, email: credential.user.email, name };
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return toAuthUser(credential.user);
}

// `isNewUser` vem do próprio Firebase (additionalUserInfo) - o Google não
// tem uma tela de "cadastro" separada da de "login" como o email/senha tem
// (é o mesmo botão pros dois casos); use isso pra contar certo na analytics.
export async function signInWithGoogle(): Promise<{ user: AuthUser; isNewUser: boolean }> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();

  if (response.type !== 'success' || !response.data.idToken) {
    throw new Error('Login com Google cancelado.');
  }

  const googleCredential = GoogleAuthProvider.credential(response.data.idToken);
  const credential = await signInWithCredential(auth, googleCredential);
  return {
    user: toAuthUser(credential.user),
    isNewUser: credential.additionalUserInfo?.isNewUser ?? false,
  };
}

export async function signOut(): Promise<void> {
  await GoogleSignin.signOut().catch(() => undefined);
  await firebaseSignOut(auth);
}

// Exclusão de conta - exigida pelas lojas (Apple e Google) se o app permite
// criar conta. Pode falhar com `auth/requires-recent-login` se a sessão for
// antiga (ver mapAuthError) - trate reautenticação se seu app precisar.
export async function deleteAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  await GoogleSignin.signOut().catch(() => undefined);
  await deleteUser(user);
}

// Útil pra anexar o token num header Authorization quando chamar seu
// próprio backend com o usuário logado.
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return getFirebaseIdToken(user);
}

export function mapAuthError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code ?? '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Esse email já está cadastrado.';
    case 'auth/invalid-email':
      return 'Email inválido.';
    case 'auth/weak-password':
      return 'A senha precisa ter pelo menos 6 caracteres.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email ou senha incorretos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Tente novamente mais tarde.';
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet.';
    case 'auth/requires-recent-login':
      return 'Por segurança, saia e entre de novo antes de excluir sua conta.';
    default:
      // Só registra os casos SEM mapeamento próprio - senha errada, email já
      // cadastrado etc. são erro de digitação do usuário, não bug; o
      // "default" é onde erros de verdade inesperados apareceriam (ex: um
      // certificado de assinatura não registrado no Google Sign-In).
      crashReportingService.recordError(error, 'mapAuthError - erro sem mapeamento específico');
      return 'Não foi possível completar a ação. Tente novamente.';
  }
}
