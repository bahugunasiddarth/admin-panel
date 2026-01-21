# **App Name**: Gleaming Admin

## Core Features:

- Secure Admin Login: Implement a secure login page at /admin/login with restricted access to the admin dashboard.
- Dashboard Metrics: Display key metrics including total, completed, and pending orders.
- Product Management (Gold): Enable CRUD operations for Gold products with name, description, price, category, image URL, and availability status. Category uses a LLM tool to generate more consistent options and labels for options selected for all product types in order to assist with data reporting. Show size for Rings only.
- Product Management (Silver): Enable CRUD operations for Silver products with name, description, price, category, image URL, and availability status. Show size for Rings only.
- Order Listing: List all orders with details like Order ID, customer details, order date, total amount, and current status.
- Delivery Management: Update delivery status (Processing, Shipped, Delivered) via a dropdown, updating Firestore in real time.

## Style Guidelines:

- Primary color: Soft gold (#D4AF37) to reflect the precious metals theme.
- Background color: Light beige (#F5F5DC), nearly the same hue as gold, very desaturated.
- Accent color: A deep brown (#8B4513), 30 degrees to the left of gold, creating contrast and a sense of richness.
- Body font: 'Inter', sans-serif, to ensure a clean and modern reading experience, suitable for both headlines and body text.
- Use refined, minimalist icons to represent actions and categories.
- Employ ShadCN UI components for a consistent and clean design.
- Subtle transitions and animations to enhance user experience.