import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, LogOut, X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none"
          >
            <div className="bg-[#1a1a1a] border border-white/10 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl pointer-events-auto">
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Body */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const AccountMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'profile' | 'security' | 'logout' | null>(null);

  const menuItems = [
    { 
      id: 'profile', 
      label: 'Tu Perfil', 
      icon: User, 
      color: 'text-blue-400',
      action: () => setActiveModal('profile')
    },
    { 
      id: 'security', 
      label: 'Seguridad', 
      icon: Shield, 
      color: 'text-nexdom-lime',
      action: () => setActiveModal('security')
    },
    { 
      id: 'logout', 
      label: 'Cerrar Sesión', 
      icon: LogOut, 
      color: 'text-red-400',
      action: () => setActiveModal('logout')
    },
  ];

  return (
    <>
      {/* Trigger Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all overflow-hidden"
        >
          <img 
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" 
            alt="User" 
            className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
          />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-14 w-64 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-white/5 bg-white/5">
                  <p className="text-white font-bold">Admin User</p>
                  <p className="text-xs text-gray-400">admin@nexdom.os</p>
                </div>
                <div className="p-2">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.action();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                    >
                      <div className={`p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors ${item.color}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="text-gray-300 group-hover:text-white text-sm font-medium">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <Modal
        isOpen={activeModal === 'profile'}
        onClose={() => setActiveModal(null)}
        title="Tu Perfil"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10">
              <img 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Admin User</h4>
              <p className="text-nexdom-lime text-sm">Pro Account</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Nombre</label>
              <input 
                type="text" 
                value="Admin User" 
                readOnly 
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-gray-300 focus:outline-none focus:border-nexdom-lime/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Email</label>
              <input 
                type="email" 
                value="admin@nexdom.os" 
                readOnly 
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-gray-300 focus:outline-none focus:border-nexdom-lime/50"
              />
            </div>
          </div>
          
          <button className="w-full py-3 bg-nexdom-lime text-black font-bold rounded-xl hover:bg-nexdom-lime/90 transition-colors">
            Guardar Cambios
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'security'}
        onClose={() => setActiveModal(null)}
        title="Seguridad"
      >
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <Shield className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-400 font-bold text-sm mb-1">2FA Desactivado</h4>
              <p className="text-xs text-gray-400">Recomendamos activar la autenticación de dos factores para mayor seguridad.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div>
                <p className="text-white font-medium">Contraseña</p>
                <p className="text-xs text-gray-500">Último cambio hace 3 meses</p>
              </div>
              <button className="text-sm text-nexdom-lime hover:underline">Cambiar</button>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div>
                <p className="text-white font-medium">Sesiones Activas</p>
                <p className="text-xs text-gray-500">2 dispositivos conectados</p>
              </div>
              <button className="text-sm text-gray-400 hover:text-white">Ver todas</button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'logout'}
        onClose={() => setActiveModal(null)}
        title="Cerrar Sesión"
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <LogOut className="w-8 h-8 text-red-500" />
          </div>
          
          <div>
            <h4 className="text-xl font-bold text-white mb-2">¿Estás seguro?</h4>
            <p className="text-gray-400 text-sm">Tendrás que volver a iniciar sesión para acceder a tu hogar inteligente.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setActiveModal(null)}
              className="py-3 px-4 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                console.log('Logging out...');
                setActiveModal(null);
              }}
              className="py-3 px-4 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
