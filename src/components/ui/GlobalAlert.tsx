import React from 'react';
import { X, CheckCircle, AlertCircle, Info, HelpCircle } from 'lucide-react';

interface GlobalAlertProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning'; // Tambah 'warning' untuk konfirmasi
  onClose: () => void;
  onConfirm?: () => void; // 👇 Prop baru (Opsional)
}

const GlobalAlert: React.FC<GlobalAlertProps> = ({ isOpen, title, message, type, onClose, onConfirm }) => {
  if (!isOpen) return null;

  const styles = {
    success: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-6 h-6 text-green-600" /> },
    error:   { bg: 'bg-red-100',   text: 'text-red-800',   icon: <AlertCircle className="w-6 h-6 text-red-600" /> },
    info:    { bg: 'bg-blue-100',  text: 'text-blue-800',  icon: <Info className="w-6 h-6 text-blue-600" /> },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <HelpCircle className="w-6 h-6 text-yellow-600" /> },
  };

  const style = styles[type] || styles.info;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className={`px-6 py-4 flex items-center gap-3 ${style.bg}`}>
          {style.icon}
          <h3 className={`font-bold ${style.text}`}>{title}</h3>
          <button onClick={onClose} className="ml-auto text-gray-500 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
          {/* 👇 LOGIKA TOMBOL */}
          {onConfirm ? (
            <>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Ya, Lanjutkan
              </button>
            </>
          ) : (
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalAlert;