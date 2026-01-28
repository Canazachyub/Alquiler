import { create } from 'zustand';

type ModalType =
  | 'habitacion'
  | 'inquilino'
  | 'pago'
  | 'gasto'
  | 'ciudad'
  | 'edificio'
  | 'piso'
  | 'confirmar'
  | null;

interface ModalData {
  id?: string;
  mode?: 'create' | 'edit' | 'view';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  onConfirm?: () => void;
  title?: string;
  message?: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIState {
  // Modales
  activeModal: ModalType;
  modalData: ModalData | null;

  // Notificaciones
  notifications: Notification[];

  // Loading global
  isLoading: boolean;
  loadingMessage: string;

  // Actions - Modales
  openModal: (type: ModalType, data?: ModalData) => void;
  closeModal: () => void;

  // Actions - Notificaciones
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Actions - Loading
  setLoading: (loading: boolean, message?: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  modalData: null,
  notifications: [],
  isLoading: false,
  loadingMessage: '',

  openModal: (type, data) => set({ activeModal: type, modalData: data || null }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: Date.now().toString() },
      ],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),

  setLoading: (loading, message = '') => set({ isLoading: loading, loadingMessage: message }),
}));

// Helper hooks
export function useModal() {
  const { activeModal, modalData, openModal, closeModal } = useUIStore();
  return { activeModal, modalData, openModal, closeModal };
}

export function useNotifications() {
  const { notifications, addNotification, removeNotification, clearNotifications } = useUIStore();

  const notify = {
    success: (message: string) => addNotification({ type: 'success', message }),
    error: (message: string) => addNotification({ type: 'error', message }),
    warning: (message: string) => addNotification({ type: 'warning', message }),
    info: (message: string) => addNotification({ type: 'info', message }),
  };

  return { notifications, notify, removeNotification, clearNotifications };
}

export function useLoading() {
  const { isLoading, loadingMessage, setLoading } = useUIStore();
  return { isLoading, loadingMessage, setLoading };
}
