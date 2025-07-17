import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, User, Menu, Smartphone, Laptop, Headphones, Shirt, Settings, Star, Truck, CreditCard, Trash2, Loader, AlertTriangle, CheckCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

const BramsStore = () => {
  // Estados principales
  const [currentView, setCurrentView] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState(null);

  // Estados para checkout
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    paymentMethod: 'stripe'
  });

  // Configuraciones
  const exchangeRate = 540;

  const categories = [
    { id: 'all', name: 'Todos', icon: Menu },
    { id: 'smartphones', name: 'Smartphones', icon: Smartphone },
    { id: 'laptops', name: 'Laptops', icon: Laptop },
    { id: 'accesorios', name: 'Accesorios', icon: Headphones },
    { id: 'software', name: 'Software', icon: Settings },
    { id: 'servicios', name: 'Servicios', icon: Settings },
    { id: 'ropa', name: 'Ropa', icon: Shirt }
  ];

  const paymentMethods = [
    { id: 'stripe', name: 'Tarjeta de Crédito/Débito', description: 'Visa, Mastercard, American Express' },
    { id: 'paypal', name: 'PayPal', description: 'Pago seguro con PayPal' },
    { id: 'sinpe', name: 'SINPE Móvil', description: 'Transferencia bancaria Costa Rica' },
    { id: 'transfer', name: 'Transferencia Bancaria', description: 'BAC, BCR, Banco Nacional' }
  ];

  // Cargar productos
  useEffect(() => {
    const fallbackProducts = [
      {
        id: "prod_001",
        sku: "IP15P-128",
        name: "iPhone 15 Pro",
        description: "Último modelo con chip A17 Pro, 128GB de almacenamiento, cámara profesional",
        category: { id: "smartphones", name: "Smartphones" },
        pricing: { price: 650000, cost: 500000 },
        inventory: { available: 13 },
        media: { primaryImage: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&h=500&fit=crop" },
        sales: { totalSold: 45, averageRating: 4.8 },
        status: { featured: true }
      },
      {
        id: "prod_002",
        sku: "MBP14-M3",
        name: "MacBook Pro 14\"",
        description: "M3 chip, 16GB RAM, 512GB SSD, pantalla Retina",
        category: { id: "laptops", name: "Laptops" },
        pricing: { price: 1200000, cost: 900000 },
        inventory: { available: 7 },
        media: { primaryImage: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&h=500&fit=crop" },
        sales: { totalSold: 23, averageRating: 4.9 },
        status: { featured: true }
      },
      {
        id: "prod_003",
        sku: "APP2-WHITE",
        name: "AirPods Pro 2",
        description: "Cancelación de ruido activa, estuche de carga MagSafe",
        category: { id: "accesorios", name: "Accesorios" },
        pricing: { price: 125000, cost: 80000 },
        inventory: { available: 22 },
        media: { primaryImage: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500&h=500&fit=crop" },
        sales: { totalSold: 78, averageRating: 4.7 },
        status: { featured: false }
      }
    ];

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔄 Intentando cargar desde GitHub...');
        
        const response = await fetch('https://raw.githubusercontent.com/Lex-Salas/bramsstore-data/main/products.json');
        
        if (response.ok) {
          const data = await response.json();
          if (data.products && data.products.length > 0) {
            console.log('✅ Productos cargados desde GitHub:', data.products.length);
            setProducts(data.products);
            setLastSync(new Date().toISOString());
          } else {
            console.log('⚠️ No hay productos en GitHub, usando fallback');
            setProducts(fallbackProducts);
            setError('Usando productos locales - GitHub sin datos');
          }
        } else {
          throw new Error('GitHub response not ok');
        }
      } catch (err) {
        console.log('⚠️ GitHub falló, usando productos locales');
        setProducts(fallbackProducts);
        setError('GitHub no disponible - Usando productos locales');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync manual
  const handleManualSync = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://raw.githubusercontent.com/Lex-Salas/bramsstore-data/main/products.json', {
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
          setLastSync(new Date().toISOString());
          setError(null);
        }
      }
    } catch (err) {
      console.log('Manual sync failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category.id === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Convertir precio
  const formatPrice = (price, currency = 'CRC') => {
    if (currency === 'USD') {
      return `$${(price / exchangeRate).toFixed(2)}`;
    }
    return `₡${price.toLocaleString()}`;
  };

  // Formatear tiempo relativo
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Nunca';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  // Calcular total del carrito
  const cartTotal = cart.reduce((total, item) => total + (item.pricing.price * item.quantity), 0);

  // Agregar al carrito
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

  // Remover del carrito
  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  // Actualizar cantidad en carrito
  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Proceso de checkout mejorado
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    // Validación mejorada con alertas específicas
    const missingFields = [];
    if (!customerInfo.name.trim()) missingFields.push('Nombre completo');
    if (!customerInfo.email.trim()) missingFields.push('Email');
    if (!customerInfo.phone.trim()) missingFields.push('Teléfono');
    if (!customerInfo.address.trim()) missingFields.push('Dirección');

    if (missingFields.length > 0) {
      alert(`Por favor completa los siguientes campos requeridos:\n• ${missingFields.join('\n• ')}`);
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      alert('Por favor ingresa un email válido');
      return;
    }

    try {
      const orderNumber = `BS-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      const total = cartTotal + 5000;

      console.log('📝 Nuevo pedido creado:', {
        orderNumber,
        customer: customerInfo,
        items: cart,
        total
      });

      alert(`¡Pedido procesado exitosamente! 🎉

Número de pedido: ${orderNumber}
Total: ${formatPrice(total)}
Método de pago: ${paymentMethods.find(p => p.id === customerInfo.paymentMethod)?.name}

El pedido aparecerá automáticamente en el panel de administración.
Recibirás un email de confirmación pronto.`);
      
      setCart([]);
      setShowCheckout(false);
      setCurrentView('home'); // Regresar al inicio después del checkout
      setCustomerInfo({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        paymentMethod: 'stripe'
      });
      
    } catch (err) {
      console.error('Error procesando pedido:', err);
      alert('Error procesando el pedido. Por favor intenta de nuevo.');
    }
  };

  // Componente de producto
  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative">
        <img
          src={product.media.primaryImage}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        {product.status.featured && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
            <Star className="w-3 h-3 mr-1" />
            Destacado
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
          Stock: {product.inventory.available}
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {product.sku}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-3">{product.description}</p>
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {formatPrice(product.pricing.price)}
            </div>
            <div className="text-sm text-gray-500">
              {formatPrice(product.pricing.price, 'USD')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Ventas: {product.sales.totalSold}</div>
            <div className="text-xs text-yellow-500">⭐ {product.sales.averageRating}</div>
          </div>
        </div>
        <button
          onClick={() => addToCart(product)}
          disabled={product.inventory.available === 0}
          className="w-full bg-gradient-to-r from-blue-500 to-orange-500 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {product.inventory.available === 0 ? 'Agotado' : 'Agregar al Carrito'}
        </button>
      </div>
    </div>
  );

  // Vista de contacto
  const ContactView = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Contacto</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Información de Contacto</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">BramsStore</p>
                  <p className="text-gray-600">Tu tienda de confianza</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <Smartphone className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">WhatsApp</p>
                  <p className="text-gray-600">+506 8888-8888</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <Settings className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Soporte Técnico</p>
                  <p className="text-gray-600">soporte@bramsstore.com</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Horarios de Atención</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Lunes - Viernes:</span>
                <span className="font-semibold text-gray-800">8:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sábados:</span>
                <span className="font-semibold text-gray-800">9:00 AM - 4:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Domingos:</span>
                <span className="font-semibold text-gray-800">Cerrado</span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>¿Necesitas ayuda?</strong> Nuestro equipo está listo para ayudarte con cualquier consulta sobre productos, pedidos o soporte técnico.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <button
            onClick={() => setCurrentView('home')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );

  // Vista principal
  const HomeView = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 via-orange-500 to-blue-700 text-white rounded-2xl p-8 md:p-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Bienvenido a
            <span className="block bg-gradient-to-r from-orange-300 to-yellow-400 bg-clip-text text-transparent">
              BramsStore
            </span>
          </h1>
          <p className="text-xl mb-6 text-blue-100">
            Tu tienda de confianza para tecnología, accesorios, software, servicios técnicos y más.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <button
              onClick={() => setCurrentView('products')}
              className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
            >
              Explorar Productos
            </button>
            <div className="flex items-center text-blue-100 text-sm">
              <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>Conectado al sistema enterprise</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categorías movidas aquí - debajo del banner */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Categorías</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.slice(1).map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setCurrentView('products');
                }}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group hover:-translate-y-1"
              >
                <Icon className="w-8 h-8 mx-auto mb-3 text-blue-500 group-hover:text-orange-500 transition-colors" />
                <span className="font-semibold text-gray-700">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <span>Última sync: {formatTimeAgo(lastSync)}</span>
            </div>
          </div>
          
          <button
            onClick={handleManualSync}
            disabled={loading}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              loading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Sincronizando...' : 'Sync GitHub'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mr-3" />
          <span className="text-gray-600">Cargando productos desde GitHub...</span>
        </div>
      )}

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3" />
            <div>
              <h3 className="font-semibold text-yellow-800">Información del Sistema</h3>
              <p className="text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Productos Destacados (GitHub Enterprise)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.filter(p => p.status.featured).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-center mb-3">
          <Truck className="w-6 h-6 text-amber-600 mr-3" />
          <h3 className="text-lg font-bold text-amber-800">Información de Envío</h3>
        </div>
        <p className="text-amber-700">
          <strong>Importante:</strong> Los precios mostrados no incluyen el costo de envío. 
          El envío se calculará y cobrará por separado según la ubicación de entrega.
        </p>
      </div>
    </div>
  );

  // Vista de productos
  const ProductsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Catálogo Enterprise</h2>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            {products.length} productos desde GitHub
          </div>
          <button
            onClick={handleManualSync}
            disabled={loading}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              loading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mr-3" />
          <span className="text-gray-600">Cargando productos desde GitHub...</span>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No se encontraron productos</p>
        </div>
      )}
    </div>
  );

  // Vista del carrito
  const CheckoutView = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <ShoppingCart className="w-7 h-7 mr-3" />
          Carrito de Compras Enterprise
          <button
            onClick={() => {
              setShowCheckout(false);
              setCurrentView('home');
            }}
            className="ml-auto text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition-colors"
          >
            ← Volver al Inicio
          </button>
        </h2>
        
        {cart.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Tu carrito está vacío</p>
            <button
              onClick={() => setCurrentView('products')}
              className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Continuar Comprando
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  <img src={item.media.primaryImage} alt={item.name} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                    <p className="text-blue-600 font-bold">{formatPrice(item.pricing.price)}</p>
                    <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full hover:bg-gray-300 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full hover:bg-gray-300 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <Truck className="w-5 h-5 text-amber-600 mr-2" />
                <span className="font-semibold text-amber-800">Costo de Envío</span>
              </div>
              <p className="text-amber-700 text-sm">
                Se agregará ₡5,000 de envío estándar (3-5 días) al total final.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="font-semibold text-blue-800">
                  Conectado al sistema enterprise
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-2xl font-bold text-gray-800 mb-6">
                <span>Total:</span>
                <div className="text-right">
                  <div>{formatPrice(cartTotal + 5000)}</div>
                  <div className="text-sm text-gray-500 font-normal">
                    {formatPrice(cartTotal + 5000, 'USD')} (incluye envío)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Nombre completo *"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="tel"
                  placeholder="Teléfono *"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Ciudad"
                  value={customerInfo.city}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, city: e.target.value }))}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Dirección completa"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                  className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Código postal"
                  value={customerInfo.postalCode}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Método de Pago</h3>
                <div className="space-y-3">
                  {paymentMethods.map(method => (
                    <label key={method.id} className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={customerInfo.paymentMethod === method.id}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-semibold text-gray-800">{method.name}</div>
                        <div className="text-sm text-gray-600">{method.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-blue-500 to-orange-500 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-blue-600 hover:to-orange-600 transition-all duration-300 flex items-center justify-center"
              >
                <CreditCard className="w-6 h-6 mr-2" />
                Proceder al Pago Enterprise
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-10 w-10 mr-3 bg-gradient-to-r from-blue-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    <span className="text-blue-600">brams</span><span className="text-orange-500">store</span>
                  </h1>
                  <p className="text-xs text-gray-500 flex items-center">
                    www.bramsstore.com
                    <span className="ml-2 flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-1 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      Enterprise
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => {
                  setCurrentView('home');
                  setShowCheckout(false);
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'home' && !showCheckout ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Inicio
              </button>
              <button
                onClick={() => {
                  setCurrentView('products');
                  setShowCheckout(false);
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'products' && !showCheckout ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Productos ({products.length})
              </button>
              <button 
                onClick={() => {
                  setCurrentView('contact');
                  setShowCheckout(false);
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'contact' && !showCheckout ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Contacto
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowCheckout(!showCheckout)}
                className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
              <button 
                onClick={() => {
                  alert('👋 ¡Hola! Sistema de login en desarrollo.\n\nPor ahora puedes:\n• Explorar productos\n• Agregar al carrito\n• Realizar compras como invitado\n\n¡Pronto tendremos cuentas de usuario!');
                }}
                className="p-2 text-gray-700 hover:text-blue-600 transition-colors"
                title="Login (En desarrollo)"
              >
                <User className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showCheckout && <CheckoutView />}
        {!showCheckout && currentView === 'home' && <HomeView />}
        {!showCheckout && currentView === 'products' && <ProductsView />}
        {!showCheckout && currentView === 'contact' && <ContactView />}
      </main>
    </div>
  );
};

export default BramsStore;
