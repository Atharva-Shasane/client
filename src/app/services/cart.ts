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
    // 1. Calculate the price based on the selected variant
    let price = 0;
    if (variant === 'SINGLE') price = item.pricing.price || 0;
    if (variant === 'HALF') price = item.pricing.priceHalf || 0;
    if (variant === 'FULL') price = item.pricing.priceFull || 0;

    this.cartItems.update((currentItems) => {
      // 2. Check if this specific item + variant already exists
      const existing = currentItems.find(
        (i) => i._id === item._id && i.selectedVariant === variant
      );

      if (existing) {
        // 3. If yes, just increment quantity
        return currentItems.map((i) =>
          i._id === item._id && i.selectedVariant === variant
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      // 4. If no, add as new item
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

  removeFromCart(itemId: string, variant?: string) {
    this.cartItems.update((items) =>
      items.filter(
        (i) =>
          // Filter out item if ID matches AND (variant matches OR no variant specified)
          !(i._id === itemId && (!variant || i.selectedVariant === variant))
      )
    );
  }

  clearCart() {
    this.cartItems.set([]);
  }
}
