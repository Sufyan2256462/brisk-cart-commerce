
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock: number;
}

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(6);

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setFeaturedProducts(data || []);
    }
    setLoading(false);
  };

  const handleAddToCart = async (productId: string) => {
    await addToCart(productId, 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to E-Shop
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Discover amazing products at unbeatable prices. Shop electronics, clothing, home goods, and more.
          </p>
          <div className="space-x-4">
            <Link to="/products">
              <Button size="lg" variant="secondary">
                Shop Now
              </Button>
            </Link>
            {!user && (
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-primary">
                  Sign Up
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Check out our most popular items and best sellers
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-w-16 aspect-h-12">
                  <img
                    src={product.image_url || '/placeholder.svg'}
                    alt={product.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary">{product.category}</Badge>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600 ml-1">4.5</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-primary">
                      ${product.price}
                    </span>
                    <div className="space-x-2">
                      <Link to={`/products/${product.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      {user && (
                        <Button 
                          size="sm" 
                          onClick={() => handleAddToCart(product.id)}
                          disabled={product.stock <= 0}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  </div>
                  {product.stock <= 0 && (
                    <Badge variant="destructive" className="mt-2">Out of Stock</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/products">
              <Button size="lg">View All Products</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['Electronics', 'Clothing', 'Home', 'Sports'].map((category) => (
              <Link 
                key={category} 
                to={`/products?category=${category}`}
                className="group"
              >
                <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow group-hover:scale-105 transition-transform">
                  <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                  <p className="text-gray-600 text-sm mt-1">Explore {category.toLowerCase()}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
