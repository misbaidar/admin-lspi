import React, { createContext, useContext, useState, ReactNode } from 'react';
import GlobalAlert from '../components/ui/GlobalAlert';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertContextType {
  showAlert: (title: string, message: string, type?: AlertType) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void; // 👇 Fungsi Baru
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AlertType>('info');
  
  // State khusus untuk menyimpan fungsi konfirmasi
  const [confirmAction, setConfirmAction] = useState<(() => void) | undefined>(undefined);

  // 1. Alert Biasa
  const showAlert = (title: string, message: string, type: AlertType = 'info') => {
    setTitle(title);
    setMessage(message);
    setType(type);
    setConfirmAction(undefined); // Reset aksi konfirmasi
    setIsOpen(true);
  };

  // 2. Alert Konfirmasi
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setTitle(title);
    setMessage(message);
    setType('warning'); // Default kuning untuk konfirmasi
    setConfirmAction(() => onConfirm); // Simpan fungsi yang akan dijalankan nanti
    setIsOpen(true);
  };

  const closeAlert = () => {
    setIsOpen(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, closeAlert }}>
      {children}
      <GlobalAlert 
        isOpen={isOpen} 
        title={title} 
        message={message} 
        type={type} 
        onClose={closeAlert} 
        onConfirm={confirmAction} // Pass fungsi ke UI
      />
    </AlertContext.Provider>
  );
};