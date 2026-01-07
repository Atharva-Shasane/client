import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth';
import { CartService } from './cart'; // ✅ Inject CartService
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private cartService = inject(CartService); // ✅ Inject
  private apiUrl = 'http://localhost:5000/api/orders';

  private getAuthHeaders() {
    const token = this.authService.getToken();
    return new HttpHeaders().set('x-auth-token', token || '');
  }

  createOrder(orderData: any) {
    return this.http.post(this.apiUrl, orderData, { headers: this.getAuthHeaders() });
  }

  // ✅ Explicitly return <any[]>
  getMyOrders() {
    return this.http.get<any[]>(`${this.apiUrl}/my-orders`, { headers: this.getAuthHeaders() });
  }

  cancelOrder(orderId: string) {
    return this.http.put(
      `${this.apiUrl}/${orderId}/cancel`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // ✅ CHANGED: Reorder now fills the cart instead of placing order directly
  reorderToCart(oldOrder: any) {
    // 1. Clear existing cart
    this.cartService.clearCart();

    // 2. Add items from old order to cart
    oldOrder.items.forEach((item: any) => {
      // Create a MenuItem-like object to pass to addToCart
      // Note: We might need to fetch full details if pricing changed,
      // but for reorder simplicity, we use the snapshot data.
      const cartItemInput = {
        _id: item.menuItemId || item._id,
        name: item.name,
        category: '', // Not critical for cart logic
        subCategory: '',
        imageUrl: '', // You might want to store this in Order items schema for better UX
        isAvailable: true,
        pricing: {
          type: 'SINGLE', // Simplified assumption or derive from data
          price: item.unitPrice,
        },
      };

      // We need to loop because addToCart adds 1 at a time usually,
      // or we can manually update the signal if we exposed a method for bulk add.
      // For now, let's just add them one by one or create a specific method in CartService.
      // Simpler approach: Manual loop
      for (let i = 0; i < item.quantity; i++) {
        this.cartService.addToCart(cartItemInput as any, 'SINGLE'); // Defaulting variant
      }
    });
  }

  getOwnerOrders() {
    return this.http.get<any[]>(`${this.apiUrl}/owner/active`, { headers: this.getAuthHeaders() });
  }

  updateOrderStatus(orderId: string, status: string) {
    return this.http.put(
      `${this.apiUrl}/owner/${orderId}/status`,
      { status },
      { headers: this.getAuthHeaders() }
    );
  }
}
