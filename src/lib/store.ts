import { Notification, User } from '../types';
import api from './api';


class UIStore {
  notifications: Notification[] = [];
  isLoading = false;
  listeners: (() => void)[] = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l());
  }

  setLoading(val: boolean) {
    this.isLoading = val;
    this.notify();
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'success') {
    const id = Math.random().toString(36).substr(2, 9);
    this.notifications.unshift({
      id,
      message,
      type,
      timestamp: new Date().toISOString()
    });
    this.notify();
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== id);
      this.notify();
    }, 5000);
  }

  clearNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notify();
  }

  // Production Helpers (added for compatibility)
  async updateZamesStatus(id: string | number, status: string) {
    console.log("Updating zames status", id, status);
  }
  async createFormovka(bunkerId: string | number, formNumber: string, blockCount: number) {
    try {
      this.setLoading(true);
      await api.post(`production/bunkers/${bunkerId}/formovka/`, {
        form_number: formNumber,
        block_count: blockCount
      });
      this.showNotification("Formovkaga muvaffaqiyatli yuborildi", "success");
    } catch (error: any) {
      const msg = error.response?.data?.error || "Formovkaga jo'natib bo'lmadi";
      this.showNotification(msg, "error");
      throw error;
    } finally {
      this.setLoading(false);
    }
  }
  async updateProductionOrderProgress(id: string | number, amount: number) {
    console.log("Updating production order progress", id, amount);
  }
  async receiveTransfer(id: string | number) {
    console.log("Receiving transfer", id);
  }
  
  // CNC & Finishing
  async updateCNCStatus(id: string | number, status: string) {
    console.log("Updating CNC status", id, status);
  }
  async updateFinishingStatus(id: string | number, status: string) {
    console.log("Updating Finishing status", id, status);
  }

  // Sales & Inventory
  getStock(productName: string): number {
    console.log("Getting stock for", productName);
    return 0;
  }
  async transferToProduction(id: string | number) {
    console.log("Transferring to production", id);
  }

  // Audit & Reports
  addAction(userId: string | number, userName: string, action: string, module: string) {
    console.log("Adding action log", userId, userName, action, module);
  }

  // More Production
  async completeProductionTask(id: string | number) {
    console.log("Completing production task", id);
  }
  async advanceProductionOrderStage(id: string | number) {
    console.log("Advancing production order stage", id);
  }
  async togglePauseProduct(id: string | number) {
    console.log("Toggling pause for product", id);
  }
  
  // Storage for formovki (referenced in Production.tsx)
  formovki: any[] = [];
}

class AuthStore {
  user: User | null = null;
  listeners: (() => void)[] = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l());
  }

  setUser(user: User | null) {
    this.user = user;
    this.notify();
  }
}

export const uiStore = new UIStore();
export const authStore = new AuthStore();
