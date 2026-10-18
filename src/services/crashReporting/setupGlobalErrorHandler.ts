import { crashReportingService } from './crashReporting.service';

// Sem isso, só pegamos erro em quem lembrou de escrever um try/catch com
// crashReportingService.recordError() na mão (útil, mas incompleto) -
// qualquer exceção JS não tratada em outro lugar simplesmente sumia sem
// registro nenhum. `global.ErrorUtils` é injetado pelo próprio React Native
// antes de qualquer código do app rodar (não tem tipo ambiente pronto pra
// ele, por isso o `as any`) - encadeia com o handler original em vez de
// substituir, pra não perder o comportamento padrão (red-box em dev, etc.).
export function setupGlobalErrorHandler(): void {
  const globalAny = globalThis as unknown as {
    ErrorUtils?: {
      getGlobalHandler: () => (error: unknown, isFatal?: boolean) => void;
      setGlobalHandler: (handler: (error: unknown, isFatal?: boolean) => void) => void;
    };
  };

  if (!globalAny.ErrorUtils) return;

  const originalHandler = globalAny.ErrorUtils.getGlobalHandler();

  globalAny.ErrorUtils.setGlobalHandler((error, isFatal) => {
    crashReportingService.recordError(error, isFatal ? 'uncaught fatal error' : 'uncaught error');
    originalHandler(error, isFatal);
  });
}
