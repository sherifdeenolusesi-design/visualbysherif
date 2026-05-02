export interface Photo {
  id: string
  title: string
  description: string | null
  url: string
  category: string
  width: number
  height: number
  order_index: number
  created_at: string
}

export interface ClientGallery {
  id: string
  name: string
  slug: string
  description: string | null
  cover_image: string | null
  expires_at: string | null
  created_at: string
}

export interface ClientGalleryPhoto {
  id: string
  gallery_id: string
  url: string
  filename: string
  size_bytes: number
  created_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  cover_image: string | null
  published: boolean
  published_at: string | null
  tags: string[]
  created_at: string
}

export interface Booking {
  id: string
  name: string
  email: string
  phone: string | null
  session_type: string
  preferred_date: string
  message: string | null
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
}

export interface Product {
  id: string
  title: string
  description: string
  price: number
  image_url: string
  category: string
  sizes: string[]
  stock: number
  stripe_price_id: string | null
  created_at: string
}

export interface CartItem {
  product: Product
  size: string
  quantity: number
}
