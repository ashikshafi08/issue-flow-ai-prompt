import { useCallback } from 'react';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export const useToast = () => {
  const addToast = useCallback((toast: Toast) => {
    // Simple console notification for now - in a full app this would use a proper toast system
    const typeEmoji = {
      success: '✅',
      error: '❌', 
      info: 'ℹ️',
      warning: '⚠️'
    };
    
    console.log(`${typeEmoji[toast.type]} ${toast.message}`);
    
    // Also create a temporary visual notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
    notification.style.backgroundColor = {
      success: '#10b981',
      error: '#ef4444',
      info: '#3b82f6', 
      warning: '#f59e0b'
    }[toast.type];
    notification.style.color = 'white';
    notification.innerHTML = `
      <div class="flex items-center gap-2 text-sm font-medium">
        <span>${typeEmoji[toast.type]}</span>
        <span>${toast.message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
      notification.style.transform = 'translateX(full)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, toast.duration || 3000);
    
    return Math.random().toString(36).substring(7);
  }, []);

  return {
    addToast
  };
};