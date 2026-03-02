import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth';
import { CartService } from './cart';
import { MenuService } from './menu';
import { ToastService } from './toast';
import { Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { MenuItem } from '../models/menu-item.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private menuService = inject(MenuService);
  private toast = inject(ToastService);
  private router = inject(Router);

  // Using your specific API URL and ensuring all requests use withCredentials for secure cookie handling
  private apiUrl = 'http://localhost:5000/api/orders';

  /**
   * NEW: Publicly accessible endpoint to get current kitchen load and wait time
   */
  getKitchenStatus(): Observable<{ activeOrders: number; waitTime: number }> {
    return this.http.get<{ activeOrders: number; waitTime: number }>(
      `${this.apiUrl}/status/volume`,
      { withCredentials: true },
    );
  }

  /**
   * Create a new order with all transaction details
   */
  createOrder(orderData: any): Observable<any> {
    return this.http.post(this.apiUrl, orderData, { withCredentials: true });
  }

  /**
   * Fetch orders for the logged-in user
   */
  getMyOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-orders`, { withCredentials: true });
  }

  /**
   * Cancel an order (Allowed only if status is NEW)
   */
  cancelOrder(orderId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${orderId}/cancel`, {}, { withCredentials: true });
  }

  /**
   * Fetch all orders for the Owner Dashboard (Admin Only)
   */
  getOwnerDashboardData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/owner/all`, { withCredentials: true });
  }

  /**
   * Update order and payment status from the Owner Dashboard
   */
  updateOrderStatus(orderId: string, status: string, paymentStatus?: string): Observable<any> {
    const payload: any = { status };
    if (paymentStatus) {
      payload.paymentStatus = paymentStatus;
    }
    return this.http.put(`${this.apiUrl}/owner/${orderId}/status`, payload, {
      withCredentials: true,
    });
  }

  /**
   * Reorder items from a previous order by syncing with the latest menu availability
   */
  async reorderToCart(oldOrder: any) {
    try {
      this.toast.info('Syncing with menu...');

      // Fetch the latest menu to verify item availability and current pricing
      const latestMenu: MenuItem[] = await firstValueFrom(this.menuService.getMenu());

      // Clear existing cart before adding reorder items
      this.cartService.clearCart();

      let itemsAdded = 0;

      for (const oldItem of oldOrder.items) {
        // Find the item in the current menu by its ID
        const currentItem = latestMenu.find(
          (m: MenuItem) => m._id === (oldItem.menuItemId || oldItem._id),
        );

        // Only add items if they still exist and are marked as available
        if (currentItem && currentItem.isAvailable) {
          const variant = oldItem.selectedVariant || oldItem.variant || 'SINGLE';

          // Add the item to cart based on the old quantity
          for (let i = 0; i < oldItem.quantity; i++) {
            this.cartService.addToCart(currentItem, variant as any);
            itemsAdded++;
          }
        }
      }

      if (itemsAdded > 0) {
        this.toast.success('Reorder items added to cart!');
        this.router.navigate(['/cart']);
      } else {
        this.toast.error('These items are no longer available on our menu.');
      }
    } catch (err) {
      console.error('Reorder Error:', err);
      this.toast.error('Failed to process reorder. Please try manual selection.');
    }
  }
}
