export interface MenuItem {
  _id: string;
  name: string;
  category: string;
  subCategory: string;
  pricing: {
    type: 'SINGLE' | 'HALF_FULL';
    price?: number;
    priceHalf?: number;
    priceFull?: number;
  };
  isAvailable: boolean;
  imageUrl: string;
  description?: string;
}
