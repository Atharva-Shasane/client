import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth';
import { CartService } from './cart';
import { MenuService } from './menu';
import { ToastService } from './toast';
import { Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private menuService = inject(MenuService);
  private toast = inject(ToastService);
  private router = inject(Router);

  private apiUrl = 'http://localhost:5000/api/orders';

  private getAuthHeaders() {
    const token = this.authService.getToken();
    return new HttpHeaders().set('x-auth-token', token || '');
  }

  createOrder(orderData: any): Observable<any> {
    return this.http.post(this.apiUrl, orderData, { headers: this.getAuthHeaders() });
  }

  getMyOrders(): Observable<any[]> {
    // Explicitly calling the /my-orders endpoint
    return this.http.get<any[]>(`${this.apiUrl}/my-orders`, { headers: this.getAuthHeaders() });
  }

  cancelOrder(orderId: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${orderId}/cancel`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  getOwnerDashboardData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/owner/all`, { headers: this.getAuthHeaders() });
  }

  updateOrderStatus(orderId: string, status: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/owner/${orderId}/status`,
      { status },
      { headers: this.getAuthHeaders() }
    );
  }

  async reorderToCart(oldOrder: any) {
    try {
      this.toast.show('Syncing with menu...', 'info');
      const latestMenu = await firstValueFrom(this.menuService.getMenu());
      this.cartService.clearCart();

      let itemsAdded = 0;
      for (const oldItem of oldOrder.items) {
        const currentItem = latestMenu.find((m) => m._id === (oldItem.menuItemId || oldItem._id));
        if (currentItem && currentItem.isAvailable) {
          const variant = oldItem.selectedVariant || oldItem.variant || 'SINGLE';
          for (let i = 0; i < oldItem.quantity; i++) {
            this.cartService.addToCart(currentItem, variant);
          }
          itemsAdded++;
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
