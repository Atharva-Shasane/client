import { Injectable, signal, computed } from '@angular/core';
import { MenuItem } from '../models/menu-item.model';

export interface CartItem {
  _id?: string;
  name: string;
  category: string;
  imageUrl: string;
  quantity: number;
  selectedVariant: 'SINGLE' | 'HALF' | 'FULL';
  computedPrice: number;
  // NEW: Support for granular kitchen instructions
  instructions: string;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  cartItems = signal<CartItem[]>([]);

  totalItems = computed(() => this.cartItems().reduce((acc, item) => acc + item.quantity, 0));

  totalPrice = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.computedPrice * item.quantity, 0),
  );

  addToCart(item: MenuItem, variant: 'SINGLE' | 'HALF' | 'FULL') {
    const price =
      variant === 'SINGLE'
        ? item.pricing.price!
        : variant === 'HALF'
          ? item.pricing.priceHalf!
          : item.pricing.priceFull!;

    this.cartItems.update((items) => {
      const existingItem = items.find((i) => i._id === item._id && i.selectedVariant === variant);

      if (existingItem) {
        return items.map((i) =>
          i._id === item._id && i.selectedVariant === variant
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }

      return [
        ...items,
        {
          _id: item._id,
          name: item.name,
          category: item.category,
          imageUrl: item.imageUrl,
          quantity: 1,
          selectedVariant: variant,
          computedPrice: price,
          instructions: '', // Initializing empty instructions
        },
      ];
    });
  }

  updateQuantity(id: string, variant: string, change: number) {
    this.cartItems.update((items) =>
      items
        .map((item) =>
          item._id === id && item.selectedVariant === variant
            ? { ...item, quantity: item.quantity + change }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  removeFromCart(id: string, variant: string) {
    this.cartItems.update((items) =>
      items.filter((i) => !(i._id === id && i.selectedVariant === variant)),
    );
  }

  clearCart() {
    this.cartItems.set([]);
  }

  reorderToCart(order: any) {
    this.clearCart();
    order.items.forEach((item: any) => {
      // Re-map backend order structure to CartItem structure
      const cartItem: CartItem = {
        _id: item.menuItemId,
        name: item.name,
        category: 'reordered',
        imageUrl: '', // Optional: would require a lookup if needed
        quantity: item.quantity,
        selectedVariant: item.variant,
        computedPrice: item.unitPrice,
        instructions: item.instructions || '',
      };
      this.cartItems.update((prev) => [...prev, cartItem]);
    });
  }
}
