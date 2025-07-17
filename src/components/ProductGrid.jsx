import React, { useEffect, useState } from 'react';

const ProductGrid = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(
      'https://raw.githubusercontent.com/Lex-Salas/bramsstore-data/main/products.json'
    )
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error('Error al cargar productos:', err));
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
      {products.map((product, index) => (
        <div
          key={index}
          className="bg-white text-black rounded-lg shadow-lg overflow-hidden hover:scale-105 transition-transform"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <p className="text-gray-700">₡{product.price}</p>
            <p className="text-sm mt-2">{product.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;
