export type ProductImage = {
  url: string;
  hint: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  imageUrls: string[];
  imageUrl?: string;
  availability: 'READY TO SHIP' | 'MADE TO ORDER';
  stockQuantity?: number; 
  imageHint: string; 
  images: ProductImage[]; 
  tag?: string;
  slug: string;
  category: string;
  description: string;
  material: 'Gold' | 'Silver'; // This fixes the 'material' error
  isBestseller?: boolean;
  priceOnRequest?: boolean;    // This fixes the 'priceOnRequest' error
  sizes?: string[];            // Ensure sizes is typed if used
};

export type Category = {
  name: string;
  imageUrl: string;
  imageHint: string;
};

export type Review = {
  id: number;
  name: string;
  comment: string;
  avatarUrl: string;
};

export type Collection = {
  id: number;
  title: string;
  imageUrl: string;
  imageHint: string;
  slug: string;
  description: string;
};

export type MegaMenuItem = {
  name: string;
  href: string;
};

export type MegaMenu = {
    title: string;
    items: MegaMenuItem[];
}

export type BlogPost = {
    id: number;
    title: string;
    excerpt: string;
    content: string;
    imageUrl: string;
    imageHint: string;
    date: string;
    slug: string;
};

export type InstagramPost = {
  id: number;
  imageUrl: string;
  imageHint: string;
  slug: string;
}

export type Order = {
    id: string;
    userId: string;
    orderDate: { seconds: number; nanoseconds: number; };
    totalAmount: number;
    shippingAddress: string;
    billingAddress: string;
    paymentMethod: string;
    status: string;
    orderStatus?: string;
}

export type OrderItem = {
    id: string;
    productId: string;
    name: string;
    imageUrl: string;
    quantity: number;
    itemPrice: number;
    size?: string;
}

export type RingSizeGuideEntry = {
  insideDiameterMm: string;
  insideCircumferenceMm: string;
  usCanadaMexico: string;
  ukAustralia: string;
  eastAsia: string;
  india: string;
  italySpainSwitzerland: string;
};

export type RingSizeGuideEntryInches = {
  insideDiameterIn: string;
  insideCircumferenceIn: string;
  usCanadaMexico: string;
  ukAustralia: string;
  eastAsia: string;
  india: string;
  italySpainSwitzerland: string;
};