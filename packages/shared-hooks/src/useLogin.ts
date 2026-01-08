import { useState } from 'react';
import { IAuthService } from '@protocolsync/shared-services';

export const useLogin = (authService: IAuthService) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);

    try {
      await authService.login();
    } catch (err: any) {
      const errorMessage = err?.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  };

  return { isLoggingIn, error, handleLogin };
};
