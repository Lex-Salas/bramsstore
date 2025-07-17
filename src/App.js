import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Star, Truck } from 'lucide-react';

const BramsStore = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [currentView, setCurrentView] = useState('home');
  const [loading, setLoading] = useState(true);

  // Productos básicos de fallback
  const fallbackProducts = [
    {
      id: "1",
      name: "iPhone 15 Pro",
      description: "Último modelo con chip A17 Pro",
      price: 650000,
      image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&h=500&fit=crop",
      stock: 10,
      featured: true
    },
    {
      id: "2", 
      name: "MacBook Pro 14\"",
      description: "M3 chip, 16GB RAM, 512GB SSD",
      price: 1200000,
      image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&h=500&fit=crop",
      stock: 5,
      featured: true
    },
    {
      id: "3",
      name: "AirPods Pro 2", 
      description: "Cancelación de ruido activa",
      price: 125000,
      image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500&h=500&fit=crop",
      stock: 15,
      featured: false
    }
  ];

  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://raw.githubusercontent.com/Lex-Salas/bramsstore-data/main/products.json');
        
        if (response.ok) {
          const data = await response.json();
          if (data.products && data.products.length > 0) {
            const simpleProducts = data.products.map(p => ({
              id: p.id,
              name: p.name,
              description: p.description,
              price: p.pricing?.price || 0,
              image: p.media?.primaryImage || '',
              stock: p.inventory?.available || 0,
              featured: p.status?.featured || false
            }));
            setProducts(simpleProducts);
          } else {
            setProducts(fallbackProducts);
          }
        } else {
          setProducts(fallbackProducts);
        }
      } catch (error) {
        setProducts(fallbackProducts);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const formatPrice = (price) => `₡${price.toLocaleString()}`;

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <img 
        src={product.image} 
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg">{product.name}</h3>
          {product.featured && (
            <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
              <Star className="w-3 h-3 mr-1" />
              Destacado
            </div>
          )}
        </div>
        <p className="text-gray-600 text-sm mb-3">{product.description}</p>
        <div className="flex justify-between items-center mb-3">
          <div className="text-2xl font-bold text-blue-600">
            {formatPrice(product.price)}
          </div>
          <div className="text-sm text-gray-500">
            Stock: {product.stock}
          </div>
        </div>
        <button
          onClick={() => addToCart(product)}
          disabled={product.stock === 0}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Agregar al Carrito
        </button>
      </div>
    </div>
  );

  const HomeView = () => (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg p-8">
        <h1 className="text-4xl font-bold mb-4">
          Bienvenido a <span className="text-yellow-300">BramsStore</span>
        </h1>
        <p className="text-xl mb-6">
          Tu tienda de confianza para tecnología y accesorios
        </p>
        <button
          onClick={() => setCurrentView('products')}
          className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100"
        >
          Ver Productos
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">Cargando productos...</p>
        </div>
      )}

      {/* Productos destacados */}
      {!loading && products.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Productos Destacados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.filter(p => p.featured).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Info de envío */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <Truck className="w-5 h-5 text-yellow-600 mr-2" />
          <span className="font-semibold">Información de Envío</span>
        </div>
        <p className="text-sm">
          Los precios no incluyen envío. Se calculará según la ubicación.
        </p>
      </div>
    </div>
  );

  const ProductsView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Todos los Productos</h2>
      
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">Cargando productos...</p>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );

  const CartView = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Carrito de Compras</h2>
      
      {cart.length === 0 ? (
        <div className="text-center py-8">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Tu carrito está vacío</p>
          <button
            onClick={() => setCurrentView('products')}
            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg"
          >
            Continuar Comprando
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-blue-600 font-bold">{formatPrice(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span>Cantidad: {item.quantity}</span>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          
          <div className="border-t pt-4">
            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <button
              onClick={() => {
                alert(`Pedido procesado por ${formatPrice(cartTotal)}!`);
                setCart([]);
              }}
              className="w-full mt-4 bg-green-500 text-white py-3 rounded-lg font-bold"
            >
              Procesar Pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">
                <span className="text-blue-600">Brams</span>
                <span className="text-orange-500">Store</span>
              </h1>
            </div>

            <nav className="flex space-x-6">
              <button
                onClick={() => setCurrentView('home')}
                className={`px-3 py-2 rounded ${currentView === 'home' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
              >
                Inicio
              </button>
              <button
                onClick={() => setCurrentView('products')}
                className={`px-3 py-2 rounded ${currentView === 'products' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
              >
                Productos ({products.length})
              </button>
              <button
                onClick={() => setCurrentView('cart')}
                className={`px-3 py-2 rounded relative ${currentView === 'cart' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
              >
                Carrito
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'home' && <HomeView />}
        {currentView === 'products' && <ProductsView />}
        {currentView === 'cart' && <CartView />}
      </main>
    </div>
  );
};

export default BramsStore;
