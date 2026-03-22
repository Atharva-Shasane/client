import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CartService } from './cart';
import { MenuItem } from '../models/menu-item.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);
  private cartService = inject(CartService);
  private apiUrl = `${environment.apiUrl}/orders`;

  private readonly httpOptions = { withCredentials: true };

  createOrder(orderData: any) {
    return this.http.post(this.apiUrl, orderData, this.httpOptions);
  }

  getMyOrders() {
    return this.http.get<any[]>(`${this.apiUrl}/my-orders`, this.httpOptions);
  }

  getOwnerOrders() {
    return this.http.get<any[]>(`${this.apiUrl}/owner/all`, this.httpOptions);
  }

  getOwnerDashboardData() {
    return this.getOwnerOrders();
  }

  updateOrderStatus(id: string, status: string, paymentStatus?: string) {
    return this.http.put(
      `${this.apiUrl}/owner/${id}/status`,
      { status, paymentStatus },
      this.httpOptions
    );
  }

  cancelOrder(id: string) {
    return this.http.put(`${this.apiUrl}/${id}/cancel`, {}, this.httpOptions);
  }

  getKitchenVolume() {
    return this.http.get<{ activeOrders: number; waitTime: number; occupiedTables: number[] }>(
      `${this.apiUrl}/status/volume`,
      this.httpOptions
    );
  }

  getKitchenStatus() {
    return this.getKitchenVolume();
  }

  /**
   * Fix: Correctly passes item and variant as separate arguments to cartService
   */
  reorderToCart(order: any) {
    if (order && order.items) {
      order.items.forEach((item: any) => {
        const menuItem: MenuItem = {
          _id: item.menuItemId,
          name: item.name,
          category: item.category,
          subCategory: item.subCategory || 'INDIAN',
          pricing: {
            type: item.variant === 'SINGLE' ? 'SINGLE' : 'HALF_FULL',
            price: item.unitPrice
          },
          imageUrl: item.imageUrl || '',
          isAvailable: true,
          averageRating: 0,
          totalReviews: 0
        };

        const variant = item.variant || 'SINGLE';
        // Fix: Expected 2 arguments (item, variant)
        this.cartService.addToCart(menuItem, variant);
      });
    }
  }
}