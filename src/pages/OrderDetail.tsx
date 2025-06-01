
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Truck, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  shipping_address: any;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    title: string;
    image_url: string;
  };
}

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (id && user) {
      fetchOrderDetails();
    }
  }, [id, user]);

  const fetchOrderDetails = async () => {
    if (!id || !user) return;

    setLoading(true);
    
    // Fetch order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      setLoading(false);
      return;
    }

    // Fetch order items
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        products (
          title,
          image_url
        )
      `)
      .eq('order_id', id);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
    } else {
      setOrderItems(itemsData || []);
    }

    setOrder(orderData);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Package className="h-5 w-5" />;
      case 'processing':
        return <Package className="h-5 w-5" />;
      case 'shipped':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h1>
          <Link to="/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/orders" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Orders
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    Placed on {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={getStatusColor(order.status)}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(order.status)}
                    <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                  </div>
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <img
                      src={item.products.image_url || '/placeholder.svg'}
                      alt={item.products.title}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-grow">
                      <h4 className="font-medium text-gray-900">{item.products.title}</h4>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary & Shipping */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    ${(order.total_amount - (order.total_amount >= 50 ? 0 : 9.99)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {order.total_amount >= 50 ? 'Free' : '$9.99'}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">${order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p className="font-medium">{order.shipping_address.fullName}</p>
                <p>{order.shipping_address.address}</p>
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}
                </p>
                <p>{order.shipping_address.country}</p>
              </div>
            </CardContent>
          </Card>

          {/* Order Status Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={`flex items-center space-x-2 ${
                  ['pending', 'processing', 'shipped', 'delivered'].includes(order.status) 
                    ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <CheckCircle className="h-5 w-5" />
                  <span>Order Confirmed</span>
                </div>
                <div className={`flex items-center space-x-2 ${
                  ['processing', 'shipped', 'delivered'].includes(order.status) 
                    ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <Package className="h-5 w-5" />
                  <span>Processing</span>
                </div>
                <div className={`flex items-center space-x-2 ${
                  ['shipped', 'delivered'].includes(order.status) 
                    ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <Truck className="h-5 w-5" />
                  <span>Shipped</span>
                </div>
                <div className={`flex items-center space-x-2 ${
                  order.status === 'delivered' 
                    ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <CheckCircle className="h-5 w-5" />
                  <span>Delivered</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
