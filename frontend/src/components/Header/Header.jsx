import React from 'react';

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
      <div className="flex items-center">
        <img 
          src="/logo.svg" 
          alt="Medical Assistant" 
          className="h-10 w-10 mr-2"
        />
        <h1 className="text-xl font-semibold text-primary-700">Medical Assistant</h1>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="text-sm text-gray-500 hidden md:block">
          Your Virtual Doctor
        </div>
        <div className="h-2 w-2 rounded-full bg-green-500"></div>
        <div className="text-xs font-medium text-green-600">Online</div>
      </div>
    </header>
  );
};

export default Header;