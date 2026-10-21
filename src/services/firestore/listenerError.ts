import { crashReportingService } from '../crashReporting/crashReporting.service';

// Todo onSnapshot precisa de um callback de erro: sem ele, o RNFirebase
// chama o callback de sucesso com snapshot = null quando a escuta cai
// (sem permissão, doc apagado, rede) e o app quebra em snapshot.data().
export const listenerError = (context: string) => (error: Error) =>
  crashReportingService.recordError(error, context);
