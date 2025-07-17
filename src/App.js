import React, { useState } from 'react';
import { Search, ShoppingCart, User, Menu, Smartphone, Laptop, Headphones, Shirt, Settings, Star, Truck, CreditCard, Trash2 } from 'lucide-react';

const BramsStore = () => {
  // Productos fijos (sin modificación desde la interfaz)
  const products = [
    {
      id: 1,
      name: "iPhone 15 Pro",
      category: "smartphones",
      price: 650000,
      image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop",
      description: "Último modelo con chip A17 Pro, 128GB de almacenamiento, cámara profesional",
      stock: 15,
      featured: true,
      sku: "IP15P-128"
    },
    {
      id: 2,
      name: "MacBook Pro 14\"",
      category: "laptops",
      price: 1200000,
      image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300&h=300&fit=crop",
      description: "M3 chip, 16GB RAM, 512GB SSD, pantalla Retina",
      stock: 8,
      featured: true,
      sku: "MBP14-M3"
    },
    {
      id: 3,
      name: "AirPods Pro 2",
      category: "accesorios",
      price: 125000,
      image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=300&h=300&fit=crop",
      description: "Cancelación de ruido activa, estuche de carga MagSafe",
      stock: 25,
      featured: false,
      sku: "APP2-WHITE"
    },
    {
      id: 4,
      name: "Microsoft Office 365",
      category: "software",
      price: 45000,
      image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=300&fit=crop",
      description: "Licencia anual completa, incluye Word, Excel, PowerPoint, Teams",
      stock: 100,
      featured: false,
      sku: "MS365-ANNUAL"
    },
    {
      id: 5,
      name: "Servicio Reparación iPhone",
      category: "servicios",
      price: 35000,
      image: "https://images.unsplash.com/photo-1621768216002-5ac171876625?w=300&h=300&fit=crop",
      description: "Diagnóstico y reparación profesional, garantía de 6 meses",
      stock: 999,
      featured: false,
      sku: "SERV-IPHONE"
    },
    {
      id: 6,
      name: "Camiseta Tech Premium",
      category: "ropa",
      price: 15000,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop",
      description: "100% algodón, diseño exclusivo BramsStore, tallas S-XL",
      stock: 30,
      featured: false,
      sku: "SHIRT-TECH"
    }
  ];

  // Estados de la aplicación
  const [currentView, setCurrentView] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);

  // Tipo de cambio fijo
  const exchangeRate = 540;

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

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
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

  // Calcular total del carrito
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

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

  // Procesar pago
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      alert('Por favor completa la información requerida');
      return;
    }

    // Aquí se integraría con el servicio de pago real
    alert(`Pedido procesado exitosamente!\n\nTotal: ${formatPrice(cartTotal)}\nMétodo de pago: ${paymentMethods.find(p => p.id === customerInfo.paymentMethod)?.name}\n\nRecibirás un email de confirmación pronto.`);
    
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
  };

  // Componente de producto
  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        {product.featured && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
            <Star className="w-3 h-3 mr-1" />
            Destacado
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
          Stock: {product.stock}
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
              {formatPrice(product.price)}
            </div>
            <div className="text-sm text-gray-500">
              {formatPrice(product.price, 'USD')}
            </div>
          </div>
        </div>
        <button
          onClick={() => addToCart(product)}
          disabled={product.stock === 0}
          className="w-full bg-gradient-to-r from-blue-500 to-orange-500 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {product.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
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
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setCurrentView('products')}
              className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
            >
              Explorar Productos
            </button>
            <div className="flex items-center text-blue-100">
              <Truck className="w-5 h-5 mr-2" />
              <span className="text-sm">*Envío no incluido - Se cobra por separado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Productos destacados */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Productos Destacados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.filter(p => p.featured).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

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

  // Vista de productos
  const ProductsView = () => (
    <div className="space-y-6">
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

      {/* Lista de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No se encontraron productos</p>
        </div>
      )}
    </div>
  );

  // Vista del carrito y checkout
  const CheckoutView = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Carrito de Compras</h2>
        
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
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                    <p className="text-blue-600 font-bold">{formatPrice(item.price)}</p>
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
                El costo de envío se calculará según la dirección de entrega y se agregará al total final.
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-2xl font-bold text-gray-800 mb-6">
                <span>Total:</span>
                <div className="text-right">
                  <div>{formatPrice(cartTotal)}</div>
                  <div className="text-sm text-gray-500 font-normal">
                    {formatPrice(cartTotal, 'USD')} + Envío
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
                className="w-full bg-gradient-to-r from-blue-500 to-orange-500 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-blue-600 hover:to-orange-600 transition-all duration-300 flex items-center justify-center"
              >
                <CreditCard className="w-6 h-6 mr-2" />
                Proceder al Pago
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

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
                  <p className="text-xs text-gray-500">www.bramsstore.com</p>
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
                Productos
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
