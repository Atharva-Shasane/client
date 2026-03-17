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
  private apiUrl = 'http://localhost:5000/api/orders';

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
    return this.http.put(`${this.apiUrl}/owner/${orderId}/status`, payload, { withCredentials: true });
  }

  /**
   * PUBLIC: Fetch current kitchen load and wait time
   * UPDATED: Now includes occupiedTables array
   */
  getKitchenStatus(): Observable<{ activeOrders: number; waitTime: number; occupiedTables: number[] }> {
    return this.http.get<{ activeOrders: number; waitTime: number; occupiedTables: number[] }>(`${this.apiUrl}/status/volume`);
  }

  /**
   * Complex Reorder Logic
   * 1. Fetches latest menu
   * 2. Filters for items that still exist and are available
   * 3. Re-populates the cart
   */
  async reorderToCart(oldOrder: any) {
    try {
      const latestMenu = await firstValueFrom(this.menuService.getMenu());
      this.cartService.clearCart();

      let itemsAdded = 0;
      for (const oldItem of oldOrder.items) {
        const currentItem = latestMenu.find(
          (m: MenuItem) => m._id === (oldItem.menuItemId || oldItem._id)
        );

        if (currentItem && currentItem.isAvailable) {
          const variant = oldItem.selectedVariant || oldItem.variant || 'SINGLE';
          // Using loop to match original quantity
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
      this.toast.error('Failed to process reorder.');
    }
  }
}