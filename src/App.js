import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShoppingCart, User, Menu, Smartphone, Laptop, Headphones, Shirt, Settings, Star, Truck, CreditCard, Trash2, Loader, AlertTriangle, CheckCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

// ===================================
// BRAMSSTORE API MANAGER INTEGRATION
// ===================================

/**
 * BramsStore API Manager - Versión integrada para la tienda
 * Conecta directamente con GitHub y crea pedidos en tiempo real
 */
class BramsStoreAPI {
  constructor(config = {}) {
    this.config = {
      baseURL: 'https://raw.githubusercontent.com/Lex-Salas/bramsstore-data/main',
      updateURL: 'https://api.github.com/repos/Lex-Salas/bramsstore-data/contents',
      autoSync: config.autoSync !== false,
      syncInterval: config.syncInterval || 30000, // 30 segundos
      debug: config.debug || false,
      ...config
    };

    this.cache = new Map();
    this.eventListeners = new Map();
    this.isOnline = navigator.onLine;
    this.lastSync = null;

    this.init();
  }

  init() {
    if (this.config.debug) {
      console.log('🚀 BramsStore API inicializado');
    }
    
    // Configurar eventos de conectividad
    window.addEventListener('online', () => this.handleOnlineStatus(true));
    window.addEventListener('offline', () => this.handleOnlineStatus(false));
  }

  handleOnlineStatus(isOnline) {
    this.isOnline = isOnline;
    this.emit('connection-changed', { isOnline });
  }

  // Sistema de eventos
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  emit(event, data = null) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en evento ${event}:`, error);
        }
      });
    }
  }

  // Obtener productos desde GitHub
  async getProducts(forceRefresh = false) {
    const cacheKey = 'products';
    
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const response = await fetch(`${this.config.baseURL}/products.json`);
      if (!response.ok) throw new Error('Error fetching products');
      
      const data = await response.json();
      
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: 300000 // 5 minutos
      });

      this.lastSync = new Date().toISOString();
      this.emit('products-updated', data);
      
      if (this.config.debug) {
        console.log('✅ Productos actualizados desde GitHub:', data.products?.length);
      }
      
      return data;

    } catch (error) {
      console.error('Error obteniendo productos:', error);
      this.emit('api-error', { type: 'products', error });
      
      // Intentar retornar cache expirado como fallback
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      
      throw new Error('No se pudieron obtener los productos');
    }
  }

  // Crear nuevo pedido
  async createOrder(orderData) {
    try {
      if (this.config.debug) {
        console.log('📝 Creando nuevo pedido:', orderData);
      }
      
      // Generar ID único
      const orderId = this.generateOrderId();
      const orderNumber = this.generateOrderNumber();
      
      const newOrder = {
        id: orderId,
        orderNumber: orderNumber,
        status: 'pending',
        paymentStatus: 'pending',
        shippingStatus: 'not_shipped',
        ...orderData,
        timestamps: {
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        }
      };

      // Emitir eventos para que el admin los capture
      this.emit('new-order-created', newOrder);
      this.emit('order-notification', {
        type: 'new_order',
        message: `Nuevo pedido ${orderNumber} recibido`,
        data: newOrder
      });
      
      if (this.config.debug) {
        console.log('✅ Pedido creado exitosamente:', orderNumber);
      }
      
      return {
        success: true,
        orderId: orderId,
        orderNumber: orderNumber,
        order: newOrder
      };

    } catch (error) {
      console.error('Error creando pedido:', error);
      this.emit('api-error', { type: 'order', error });
      throw error;
    }
  }

  // Utilidades
  isCacheValid(key) {
    if (!this.cache.has(key)) return false;
    const cached = this.cache.get(key);
    return (Date.now() - cached.timestamp) < cached.ttl;
  }

  generateOrderId() {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateOrderNumber() {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `BS-${year}-${timestamp}`;
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      lastSync: this.lastSync,
      cacheSize: this.cache.size
    };
  }
}

// ===================================
// COMPONENTE PRINCIPAL BRAMSSTORE
// ===================================

const BramsStore = () => {
  // Estados principales
  const [currentView, setCurrentView] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);

  // Estados de la API y datos enterprise
  const [apiManager, setApiManager] = useState(null);
  const [enterpriseData, setEnterpriseData] = useState({
    products: [],
    loading: true,
    error: null
  });
  const [apiStatus, setApiStatus] = useState({
    isOnline: navigator.onLine,
    lastSync: null,
    syncing: false
  });

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

  // ===================================
  // INICIALIZACIÓN DE LA API
  // ===================================

  useEffect(() => {
    const initializeAPI = async () => {
      try {
        const api = new BramsStoreAPI({
          debug: true,
          autoSync: true
        });

        // Configurar event listeners
        api.on('products-updated', (data) => {
          setEnterpriseData(prev => ({
            ...prev,
            products: data.products || [],
            loading: false,
            error: null
          }));
        });

        api.on('connection-changed', ({ isOnline }) => {
          setApiStatus(prev => ({ ...prev, isOnline }));
        });

        api.on('api-error', ({ type, error }) => {
          setEnterpriseData(prev => ({
            ...prev,
            loading: false,
            error: `Error cargando ${type}: ${error.message}`
          }));
        });

        api.on('new-order-created', (order) => {
          console.log('✅ Pedido creado y notificado al admin:', order.orderNumber);
        });

        setApiManager(api);
        
        // Cargar productos iniciales
        await loadProducts(api);

      } catch (error) {
        console.error('Error inicializando API:', error);
        setEnterpriseData(prev => ({
          ...prev,
          loading: false,
          error: 'Error conectando con el servidor'
        }));
      }
    };

    initializeAPI();
  }, []);

  // Cargar productos desde GitHub
  const loadProducts = useCallback(async (api = apiManager) => {
    if (!api) return;

    try {
      setApiStatus(prev => ({ ...prev, syncing: true }));
      setEnterpriseData(prev => ({ ...prev, loading: true, error: null }));

      const data = await api.getProducts(true);
      
      setEnterpriseData({
        products: data.products || [],
        loading: false,
        error: null
      });

      setApiStatus(prev => ({
        ...prev,
        syncing: false,
        lastSync: new Date().toISOString()
      }));

    } catch (error) {
      console.error('Error cargando productos:', error);
      setEnterpriseData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      setApiStatus(prev => ({ ...prev, syncing: false }));
    }
  }, [apiManager]);

  // Sync manual
  const handleManualSync = () => {
    if (apiManager) {
      loadProducts();
    }
  };

  // ===================================
  // FUNCIONES DE PRODUCTOS Y CARRITO
  // ===================================

  // Filtrar productos enterprise
  const filteredProducts = enterpriseData.products.filter(product => {
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

  // ===================================
  // PROCESO DE CHECKOUT INTEGRADO
  // ===================================

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      alert('Por favor completa la información requerida');
      return;
    }

    if (!apiManager) {
      alert('Error: No hay conexión con el servidor');
      return;
    }

    try {
      // Preparar datos del pedido según el formato enterprise
      const orderData = {
        customer: {
          id: `cust_${Date.now()}`,
          firstName: customerInfo.name.split(' ')[0],
          lastName: customerInfo.name.split(' ').slice(1).join(' ') || '',
          fullName: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          document: '', // Se puede agregar después
          type: 'regular'
        },
        billing: {
          firstName: customerInfo.name.split(' ')[0],
          lastName: customerInfo.name.split(' ').slice(1).join(' ') || '',
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: {
            line1: customerInfo.address,
            line2: null,
            city: customerInfo.city,
            state: customerInfo.city,
            zipCode: customerInfo.postalCode,
            country: 'CR',
            countryName: 'Costa Rica'
          }
        },
        shipping: {
          firstName: customerInfo.name.split(' ')[0],
          lastName: customerInfo.name.split(' ').slice(1).join(' ') || '',
          phone: customerInfo.phone,
          address: {
            line1: customerInfo.address,
            line2: null,
            city: customerInfo.city,
            state: customerInfo.city,
            zipCode: customerInfo.postalCode,
            country: 'CR',
            countryName: 'Costa Rica'
          },
          method: 'standard',
          methodName: 'Envío Estándar (3-5 días)',
          cost: 5000,
          estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          trackingNumber: null,
          carrier: 'Correos de Costa Rica'
        },
        items: cart.map((item, index) => ({
          id: `item_${index + 1}`,
          productId: item.id,
          sku: item.sku,
          name: item.name,
          image: item.media.primaryImage,
          quantity: item.quantity,
          unitPrice: item.pricing.price,
          totalPrice: item.pricing.price * item.quantity,
          cost: item.pricing.cost * item.quantity,
          profit: (item.pricing.price - item.pricing.cost) * item.quantity,
          specifications: item.specifications || {}
        })),
        pricing: {
          subtotal: cartTotal,
          tax: 0,
          taxRate: 0,
          shipping: 5000,
          discount: 0,
          discountCode: null,
          total: cartTotal + 5000,
          currency: 'CRC',
          totalCost: cart.reduce((sum, item) => sum + (item.pricing.cost * item.quantity), 0),
          totalProfit: cart.reduce((sum, item) => sum + ((item.pricing.price - item.pricing.cost) * item.quantity), 0),
          profitMargin: 0 // Se calculará después
        },
        payment: {
          method: customerInfo.paymentMethod,
          methodName: paymentMethods.find(p => p.id === customerInfo.paymentMethod)?.name,
          status: 'pending',
          transactionId: null,
          referenceNumber: null,
          paidAt: null,
          amount: cartTotal + 5000,
          currency: 'CRC',
          gateway: customerInfo.paymentMethod,
          fees: 0
        },
        notes: {
          customer: '',
          internal: `Pedido desde www.bramsstore.com`,
          admin: 'Nuevo pedido recibido desde la tienda online'
        },
        analytics: {
          source: 'website',
          campaign: null,
          device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
          browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other',
          referrer: document.referrer,
          utm: {
            source: null,
            medium: 'organic',
            campaign: null
          }
        }
      };

      // Calcular margen de ganancia
      orderData.pricing.profitMargin = orderData.pricing.totalProfit > 0 
        ? (orderData.pricing.totalProfit / orderData.pricing.subtotal) * 100 
        : 0;

      // Crear pedido usando la API enterprise
      const result = await apiManager.createOrder(orderData);
      
      if (result.success) {
        alert(`¡Pedido procesado exitosamente! 🎉

Número de pedido: ${result.orderNumber}
Total: ${formatPrice(orderData.pricing.total)}
Método de pago: ${orderData.payment.methodName}

El pedido aparecerá automáticamente en el panel de administración.
Recibirás un email de confirmación pronto.`);
        
        // Limpiar carrito y checkout
        setCart([]);
        setShowCheckout(false);
        setCustomerInfo({
          name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          postalCode: '',
          paymentMethod: 'stripe'
        });
      }
      
    } catch (error) {
      console.error('Error procesando pedido:', error);
      alert('Error procesando el pedido. Por favor intenta de nuevo.');
    }
  };

  // ===================================
  // COMPONENTES DE UI
  // ===================================

  // Componente de producto enterprise
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

  // Vista principal
  const HomeView = () => (
    <div className="space-y-8">
      {/* Hero Section */}
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
              <div className={`w-2 h-2 rounded-full mr-2 ${apiStatus.isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>Conectado al sistema enterprise</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estado de conexión y sync */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              {apiStatus.isOnline ? (
                <Wifi className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span>{apiStatus.isOnline ? 'Online' : 'Offline'}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <span>Última sync: {formatTimeAgo(apiStatus.lastSync)}</span>
            </div>
          </div>
          
          <button
            onClick={handleManualSync}
            disabled={apiStatus.syncing}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              apiStatus.syncing 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${apiStatus.syncing ? 'animate-spin' : ''}`} />
            {apiStatus.syncing ? 'Sincronizando...' : 'Sync GitHub'}
          </button>
        </div>
      </div>

      {/* Loading o error */}
      {enterpriseData.loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mr-3" />
          <span className="text-gray-600">Cargando productos desde GitHub...</span>
        </div>
      )}

      {enterpriseData.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
            <div>
              <h3 className="font-semibold text-red-800">Error de Conexión</h3>
              <p className="text-red-600">{enterpriseData.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Productos destacados desde GitHub */}
      {!enterpriseData.loading && !enterpriseData.error && enterpriseData.products.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Productos Destacados (GitHub Enterprise)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enterpriseData.products.filter(p => p.status.featured).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Información de envío */}
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

      {/* Categorías */}
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
    </div>
  );

  // Vista de productos enterprise
  const ProductsView = () => (
    <div className="space-y-6">
      {/* Header con estado de sync */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Catálogo Enterprise</h2>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            {enterpriseData.products.length} productos desde GitHub
          </div>
          <button
            onClick={handleManualSync}
            disabled={apiStatus.syncing}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              apiStatus.syncing 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${apiStatus.syncing ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
      </div>

      {/* Filtros */}
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

      {/* Loading o error */}
      {enterpriseData.loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mr-3" />
          <span className="text-gray-600">Cargando productos desde GitHub...</span>
        </div>
      )}

      {enterpriseData.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
            <div>
              <h3 className="font-semibold text-red-800">Error de Conexión</h3>
              <p className="text-red-600">{enterpriseData.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de productos enterprise */}
      {!enterpriseData.loading && !enterpriseData.error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {!enterpriseData.loading && !enterpriseData.error && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No se encontraron productos</p>
        </div>
      )}
    </div>
  );

  // Vista del carrito y checkout enterprise
  const CheckoutView = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Carrito de Compras Enterprise</h2>
        
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

            {/* Información de envío */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <Truck className="w-5 h-5 text-amber-600 mr-2" />
                <span className="font-semibold text-amber-800">Costo de Envío</span>
              </div>
              <p className="text-amber-700 text-sm">
                Se agregará ₡5,000 de envío estándar (3-5 días) al total final.
              </p>
            </div>

            {/* Estado de conexión API */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                {apiStatus.isOnline ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                )}
                <span className="font-semibold text-blue-800">
                  {apiStatus.isOnline 
                    ? 'Conectado al sistema enterprise' 
                    : 'Sin conexión - Pedido se procesará cuando se restablezca la conexión'
                  }
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

              {/* Formulario de información del cliente */}
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
              </div>

              {/* Métodos de pago */}
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
                disabled={!apiStatus.isOnline}
                className="w-full bg-gradient-to-r from-blue-500 to-orange-500 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-blue-600 hover:to-orange-600 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-6 h-6 mr-2" />
                {apiStatus.isOnline ? 'Proceder al Pago Enterprise' : 'Sin conexión - Esperando...'}
              </button>
              
              {!apiStatus.isOnline && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  El pedido se procesará automáticamente cuando se restablezca la conexión
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ===================================
  // RENDER PRINCIPAL
  // ===================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
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
                      <div className={`w-2 h-2 rounded-full mr-1 ${apiStatus.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      Enterprise
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => setCurrentView('home')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Inicio
              </button>
              <button
                onClick={() => setCurrentView('products')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'products' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Productos ({enterpriseData.products.length})
              </button>
              <button className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
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
              <button className="p-2 text-gray-700 hover:text-blue-600 transition-colors">
                <User className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showCheckout && <CheckoutView />}
        {!showCheckout && currentView === 'home' && <HomeView />}
        {!showCheckout && currentView === 'products' && <ProductsView />}
      </main>
    </div>
  );
};

export default BramsStore;
