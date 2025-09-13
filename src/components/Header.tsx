// src/components/Header.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, MapPin, Trophy, User, List, Shield, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle"; // Add this import
import { useTheme } from "@/contexts/ThemeContext"; // Add this import

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme } = useTheme(); // Add theme hook

  // Base navigation items (always shown to logged-in users)
  const baseNavigation = [
    { name: "Map", href: "/map", icon: MapPin },
    { name: "Quests", href: "/quests", icon: List },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Profile", href: "/profile", icon: User },
  ];

  // Admin navigation item (only shown to admin users)
  const adminNavigation = [
    { name: "Admin", href: "/admin", icon: Shield },
  ];

  // Combine navigation based on user role
  const navigation = [
    ...baseNavigation,
    ...(user?.isAdmin ? adminNavigation : []),
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsOpen(false);
  };

  return (
    <header className="bg-card dark:bg-gray-900 border-b border-border dark:border-gray-700 shadow-card-custom">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">NAVIGO</span>
          </Link>

          {/* Desktop Navigation - Only show when logged in */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link key={item.name} to={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Icon className="w-4 w-4" />
                      <span>{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
              
              {/* Theme Toggle - Add this */}
              <ThemeToggle />
              
              {/* User info and logout button */}
              <div className="flex items-center ml-4 space-x-2">
                <span className="text-sm text-muted-foreground dark:text-gray-300">
                  Hello, {user.displayName || user.email}
                  {user.isAdmin && (
                    <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                      Admin
                    </span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="w-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            </nav>
          )}

          {/* Show login button when not logged in */}
          {!user && (
            <div className="hidden md:flex items-center space-x-2">
              <ThemeToggle /> {/* Add theme toggle for non-logged in users */}
              <Link to="/signup">
                <Button variant="default" size="sm">
                  Login / Sign Up
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle /> {/* Add theme toggle in mobile header */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-foreground hover:bg-accent"
            >
              {isOpen ? <X className="w-6 w-6" /> : <Menu className="w-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border dark:border-gray-700">
            <nav className="flex flex-col space-y-2">
              {/* Show navigation items only when logged in */}
              {user && (
                <>
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsOpen(false)}
                      >
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          size="sm"
                          className="w-full justify-start space-x-2"
                        >
                          <Icon className="w-4 w-4" />
                          <span>{item.name}</span>
                        </Button>
                      </Link>
                    );
                  })}
                  
                  {/* Mobile logout button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full justify-start space-x-2"
                  >
                    <LogOut className="w-4 w-4" />
                    <span>Logout</span>
                  </Button>
                  
                  {/* Mobile user info */}
                  <div className="px-4 py-2 text-sm text-muted-foreground dark:text-gray-300">
                    Logged in as: {user.displayName || user.email}
                    {user.isAdmin && (
                      <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                </>
              )}
              
              {/* Show login option when not logged in */}
              {!user && (
                <Link to="/signup" onClick={() => setIsOpen(false)}>
                  <Button variant="default" size="sm" className="w-full">
                    Login / Sign Up
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;