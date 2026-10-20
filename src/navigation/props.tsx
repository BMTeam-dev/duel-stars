import { StackScreenProps, TabScreenProps } from './navigationTypes';

// Uma linha por tela registrada em screensTypes.ts - é o que cada
// Screen.tsx importa pra tipar suas props de `navigation`/`route`.
export type LoginProps = StackScreenProps<'Login'>;
export type SignupProps = StackScreenProps<'Signup'>;
export type OnboardingProps = StackScreenProps<'Onboarding'>;
export type EditProfileProps = StackScreenProps<'EditProfile'>;
export type CreateChallengeProps = StackScreenProps<'CreateChallenge'>;
export type ScanChallengeProps = StackScreenProps<'ScanChallenge'>;
export type DuelProps = StackScreenProps<'Duel'>;

export type FeedProps = TabScreenProps<'Feed'>;
export type CardsProps = TabScreenProps<'Cards'>;
export type ProfileProps = TabScreenProps<'Profile'>;
