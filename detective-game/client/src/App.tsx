import React from 'react';

export function App() {
  return (
    <div className="min-h-screen bg-noir-950 text-noir-100 flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-4xl font-serif text-accent-gold mb-4">Detective Noir</h1>
        <p className="text-noir-400 mb-6">Game is loading...</p>
        <p className="text-sm text-noir-600">Please wait while we initialize the game engine.</p>
      </div>
    </div>
  );
}

export default App;
