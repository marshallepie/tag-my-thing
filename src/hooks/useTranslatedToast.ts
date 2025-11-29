import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export const useTranslatedToast = () => {
  const { t } = useTranslation();

  return {
    success: (key: string, options?: any) => {
      const message = t(key, options);
      return toast.success(message);
    },
    error: (key: string, options?: any) => {
      const message = t(key, options);
      return toast.error(message);
    },
    loading: (key: string, options?: any) => {
      const message = t(key, options);
      return toast.loading(message);
    },
    custom: (key: string, options?: any) => {
      const message = t(key, options);
      return toast(message);
    },
    // Direct message toasts (for cases where we already have translated text)
    successDirect: (message: string) => toast.success(message),
    errorDirect: (message: string) => toast.error(message),
    loadingDirect: (message: string) => toast.loading(message)
  };
};