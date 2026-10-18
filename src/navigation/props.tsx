import { StackScreenProps } from './navigationTypes';

// Uma linha por tela registrada em screensTypes.ts - é o que cada
// Screen.tsx importa pra tipar suas props de `navigation`/`route`.
export type HomeProps = StackScreenProps<'Home'>;
export type LoginProps = StackScreenProps<'Login'>;
export type SignupProps = StackScreenProps<'Signup'>;
