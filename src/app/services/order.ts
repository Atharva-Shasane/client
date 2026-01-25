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

  createOrder(orderData: any): Observable<any> {
    return this.http.post(this.apiUrl, orderData, { withCredentials: true });
  }

  getMyOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-orders`, { withCredentials: true });
  }

  cancelOrder(orderId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${orderId}/cancel`, {}, { withCredentials: true });
  }

  getOwnerDashboardData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/owner/all`, { withCredentials: true });
  }

  updateOrderStatus(orderId: string, status: string, paymentStatus?: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/owner/${orderId}/status`,
      { status, paymentStatus },
      { withCredentials: true },
    );
  }

  async reorderToCart(oldOrder: any) {
    try {
      this.toast.info('Syncing with menu...');

      // Fix: Explicitly type the response to avoid 'unknown' error
      const latestMenu: MenuItem[] = await firstValueFrom(this.menuService.getMenu());

      this.cartService.clearCart();

      let itemsAdded = 0;

      for (const oldItem of oldOrder.items) {
        // Fix: Explicitly type 'm' to avoid implicit any error
        const currentItem = latestMenu.find(
          (m: MenuItem) => m._id === (oldItem.menuItemId || oldItem._id),
        );

        if (currentItem && currentItem.isAvailable) {
          const variant = oldItem.selectedVariant || oldItem.variant || 'SINGLE';
          for (let i = 0; i < oldItem.quantity; i++) {
            this.cartService.addToCart(currentItem, variant);
            itemsAdded++;
          }
        }
      }

      if (itemsAdded > 0) {
        this.toast.success('Reorder items added to cart!');
        this.router.navigate(['/cart']);
      } else {
        this.toast.error('These items are no longer available.');
      }
    } catch (err) {
      this.toast.error('Reorder failed.');
    }
  }
}
