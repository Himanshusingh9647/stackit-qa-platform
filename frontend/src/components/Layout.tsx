import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, User, LogOut, Plus, Layers } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SearchBar from './SearchBar';
import NotificationBell from './NotificationBell';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-primary-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link 
                to="/" 
                className="flex items-center space-x-2 md:space-x-3 group cursor-pointer hover:opacity-90 transition-opacity duration-200 relative z-10"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-900 to-accent-600 rounded-xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative bg-gradient-to-r from-primary-900 to-accent-600 p-1.5 md:p-2 rounded-xl">
                    <Layers className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl md:text-2xl font-black text-gradient tracking-tight">StackIt</span>
                  <div className="text-xs text-primary-500 font-medium -mt-1 hidden md:block">Q&A Platform</div>
                </div>
              </Link>
            </div>

            {/* Search Bar - Hidden on small screens */}
            <SearchBar className="hidden lg:flex flex-1 max-w-2xl mx-8" />

            {/* Navigation */}
            <nav className="flex items-center space-x-2 md:space-x-6">
              {user ? (
                <>
                  <div className="flex items-center space-x-2 md:space-x-6">
                    {/* Notification Bell */}
                    <NotificationBell />
                    
                    <div className="flex items-center space-x-2 md:space-x-3 bg-white/60 backdrop-blur-sm border border-primary-200 rounded-xl px-2 md:px-4 py-2">
                      <div className="flex items-center space-x-2 md:space-x-3">
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-primary-600 to-accent-500 rounded-full flex items-center justify-center">
                          <User className="h-3 w-3 md:h-4 md:w-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs md:text-sm font-medium text-primary-900 truncate max-w-20 md:max-w-none">{user.username}</span>
                          {user.isAdmin && (
                            <span className="text-xs bg-gradient-to-r from-accent-500 to-accent-600 text-white px-1 md:px-2 py-0.5 rounded-full hidden md:block">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-4 md:h-6 w-px bg-primary-200 mx-1 md:mx-2"></div>
                      <button
                        onClick={logout}
                        className="p-1 md:p-2 text-primary-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-primary-100/50"
                        title="Logout"
                      >
                        <LogOut className="h-3 w-3 md:h-4 md:w-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-2 md:space-x-4">
                  <Link
                    to="/login"
                    className={`px-3 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium rounded-xl transition-all duration-200 ${
                      location.pathname === '/login'
                        ? 'btn-primary'
                        : 'btn-secondary'
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className={`px-3 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium rounded-xl transition-all duration-200 ${
                      location.pathname === '/register'
                        ? 'btn-primary'
                        : 'btn-accent'
                    }`}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        <div className="lg:hidden px-4 sm:px-6 pb-4">
          <SearchBar className="w-full" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
      
      {/* Subtle background pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-accent-500/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-primary-900/5 to-transparent rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default Layout;
