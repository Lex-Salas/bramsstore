import React from 'react';
import ProductGrid from './components/ProductGrid';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-black text-white p-4 text-center text-2xl font-bold shadow">
        BramsStore
      </header>

      <main className="p-4">
        <ProductGrid />
      </main>

      <footer className="bg-black text-white text-center p-4 mt-10">
        © {new Date().getFullYear()} BramsStore. Todos los derechos reservados.
      </footer>
    </div>
  );
}

export default App;
