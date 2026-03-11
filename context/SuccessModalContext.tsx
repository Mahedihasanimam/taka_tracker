import ProfessionalSuccessModal from '@/components/ProfessionalSuccessModal';
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

type SuccessModalOptions = {
  title?: string;
  message: string;
  buttonText?: string;
  onConfirm?: () => void | Promise<void>;
  secondaryButtonText?: string;
  onSecondaryConfirm?: () => void | Promise<void>;
};

type SuccessModalContextType = {
  showSuccess: (options: SuccessModalOptions) => void;
  hideSuccess: () => void;
};

const SuccessModalContext = createContext<SuccessModalContextType | undefined>(undefined);

export const SuccessModalProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('Success');
  const [message, setMessage] = useState('');
  const [buttonText, setButtonText] = useState('OK');
  const [onConfirm, setOnConfirm] = useState<(() => void | Promise<void>) | null>(null);
  const [secondaryButtonText, setSecondaryButtonText] = useState<string | undefined>();
  const [onSecondaryConfirm, setOnSecondaryConfirm] = useState<(() => void | Promise<void>) | null>(null);

  const hideSuccess = useCallback(() => {
    setVisible(false);
    setOnConfirm(null);
    setSecondaryButtonText(undefined);
    setOnSecondaryConfirm(null);
  }, []);

  const handleConfirm = useCallback(() => {
    setVisible(false);
    if (onConfirm) {
      setTimeout(() => {
        Promise.resolve(onConfirm()).catch((error) => {
          console.error('Success modal callback failed:', error);
        });
      }, 120);
    }
    setOnConfirm(null);
    setSecondaryButtonText(undefined);
    setOnSecondaryConfirm(null);
  }, [onConfirm]);

  const handleSecondary = useCallback(() => {
    setVisible(false);
    if (onSecondaryConfirm) {
      setTimeout(() => {
        Promise.resolve(onSecondaryConfirm()).catch((error) => {
          console.error('Success modal secondary callback failed:', error);
        });
      }, 120);
    }
    setOnConfirm(null);
    setSecondaryButtonText(undefined);
    setOnSecondaryConfirm(null);
  }, [onSecondaryConfirm]);

  const showSuccess = useCallback((options: SuccessModalOptions) => {
    setTitle(options.title || 'Success');
    setMessage(options.message);
    setButtonText(options.buttonText || 'OK');
    setOnConfirm(() => options.onConfirm || null);
    setSecondaryButtonText(options.secondaryButtonText);
    setOnSecondaryConfirm(() => options.onSecondaryConfirm || null);
    setVisible(true);
  }, []);

  const value = useMemo(
    () => ({
      showSuccess,
      hideSuccess,
    }),
    [hideSuccess, showSuccess]
  );

  return (
    <SuccessModalContext.Provider value={value}>
      {children}
      <ProfessionalSuccessModal
        visible={visible}
        title={title}
        message={message}
        buttonText={buttonText}
        secondaryButtonText={secondaryButtonText}
        onConfirm={handleConfirm}
        onSecondaryPress={handleSecondary}
        onDismiss={hideSuccess}
      />
    </SuccessModalContext.Provider>
  );
};

export const useSuccessModal = () => {
  const context = useContext(SuccessModalContext);
  if (!context) {
    throw new Error('useSuccessModal must be used within a SuccessModalProvider');
  }
  return context;
};
