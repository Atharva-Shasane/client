import { Injectable, signal, computed } from '@angular/core';
import { MenuItem } from '../models/menu-item.model';
import { CartItem } from '../models/cart-item.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  // Main state signal
  cartItems = signal<CartItem[]>([]);

  // Computed values that update automatically when cartItems change
  totalItems = computed(() => this.cartItems().reduce((acc, item) => acc + item.quantity, 0));

  totalPrice = computed(() =>
    this.cartItems().reduce((acc, item) => {
      return acc + item.computedPrice * item.quantity;
    }, 0)
  );

  addToCart(item: MenuItem, variant: 'SINGLE' | 'HALF' | 'FULL' = 'SINGLE') {
    let price = 0;
    if (variant === 'SINGLE') price = item.pricing.price || 0;
    if (variant === 'HALF') price = item.pricing.priceHalf || 0;
    if (variant === 'FULL') price = item.pricing.priceFull || 0;

    this.cartItems.update((currentItems) => {
      const existing = currentItems.find(
        (i) => i._id === item._id && i.selectedVariant === variant
      );

      if (existing) {
        return currentItems.map((i) =>
          i._id === item._id && i.selectedVariant === variant
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      return [
        ...currentItems,
        {
          ...item,
          quantity: 1,
          selectedVariant: variant,
          computedPrice: price,
        },
      ];
    });
  }

  /**
   * New: Update quantity with +/- change
   */
  updateQuantity(itemId: string, variant: string, change: number) {
    this.cartItems.update((items) => {
      return items
        .map((i) => {
          if (i._id === itemId && i.selectedVariant === variant) {
            const newQty = i.quantity + change;
            return newQty > 0 ? { ...i, quantity: newQty } : i;
          }
          return i;
        })
        .filter((i) => i.quantity > 0); // Remove if quantity becomes 0
    });
  }

  removeFromCart(itemId: string, variant?: string) {
    this.cartItems.update((items) =>
      items.filter((i) => !(i._id === itemId && (!variant || i.selectedVariant === variant)))
    );
  }

  clearCart() {
    this.cartItems.set([]);
  }
}
