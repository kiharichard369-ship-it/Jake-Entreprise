import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ShoppingCart, Package, TrendingUp, Users, Truck,
  Settings, LogOut, Menu, X, ChevronRight, Droplets, Flame,
  MapPin, CreditCard, FileText, AlertCircle, DollarSign, RotateCcw, Building2
} from 'lucide-react';

interface NavItem { label: string; path: string; icon: React.ReactNode; }

const navByRole: Record<string, NavItem[]> = {
  super_admin: [
    { label: 'Dashboard',        path: '/super-admin/dashboard',      icon: <LayoutDashboard size={18}/> },
    { label: 'Revenue Overview', path: '/super-admin/revenue',         icon: <TrendingUp size={18}/> },
    { label: 'Price Management', path: '/super-admin/prices',          icon: <DollarSign size={18}/> },
    { label: 'User Management',  path: '/super-admin/users',           icon: <Users size={18}/> },
    { label: 'Debt Overview',    path: '/super-admin/debts',           icon: <AlertCircle size={18}/> },
    { label: 'Branches',          path: '/super-admin/branches',         icon: <Building2 size={18}/> },
    { label: 'Payment Config',   path: '/super-admin/payment-config',  icon: <CreditCard size={18}/> },
  ],
  water_admin: [
    { label: 'Dashboard',        path: '/water/admin/dashboard',       icon: <LayoutDashboard size={18}/> },
    { label: 'Revenue',          path: '/water/admin/revenue',         icon: <TrendingUp size={18}/> },
    { label: 'Delivery Revenue', path: '/water/delivery/revenue',      icon: <Truck size={18}/> },
    { label: 'Products & Stock', path: '/water/admin/products',        icon: <Package size={18}/> },
    { label: 'Stock Requests',   path: '/water/admin/stock-requests',  icon: <Package size={18}/> },
    { label: 'Refund Requests',  path: '/water/admin/refunds',         icon: <RotateCcw size={18}/> },
    { label: 'Transactions',     path: '/water/admin/transactions',    icon: <FileText size={18}/> },
    { label: 'Customers',        path: '/water/admin/customers',       icon: <Users size={18}/> },
    { label: 'Credits',          path: '/water/admin/credits',         icon: <CreditCard size={18}/> },
  ],
  water_cashier: [
    { label: 'POS',              path: '/water/cashier/pos',           icon: <ShoppingCart size={18}/> },
    { label: 'Transactions',     path: '/water/cashier/transactions',  icon: <FileText size={18}/> },
    { label: 'Stock Request',    path: '/water/cashier/stock-request', icon: <Package size={18}/> },
    { label: 'Refund Request',   path: '/water/cashier/refund',        icon: <RotateCcw size={18}/> },
  ],
  driver: [
    { label: 'Dashboard',        path: '/water/driver/dashboard',      icon: <LayoutDashboard size={18}/> },
    { label: 'Deliveries',       path: '/water/driver/deliveries',     icon: <Truck size={18}/> },
    { label: 'GPS Tracker',      path: '/water/driver/gps',            icon: <MapPin size={18}/> },
    { label: 'Debts',            path: '/water/driver/debts',          icon: <AlertCircle size={18}/> },
    { label: 'Expenses',         path: '/water/driver/expenses',       icon: <DollarSign size={18}/> },
  ],
  rb_manager: [
    { label: 'Dashboard',        path: '/rb/manager/dashboard',        icon: <LayoutDashboard size={18}/> },
    { label: 'Revenue',          path: '/rb/manager/revenue',          icon: <TrendingUp size={18}/> },
    { label: 'Stock & Prices',   path: '/rb/manager/stock',            icon: <Package size={18}/> },
    { label: 'Cashiers',         path: '/rb/manager/cashiers',         icon: <Users size={18}/> },
    { label: 'Transactions',     path: '/rb/manager/transactions',     icon: <FileText size={18}/> },
  ],
  rb_cashier: [
    { label: 'POS',              path: '/rb/cashier/pos',              icon: <ShoppingCart size={18}/> },
    { label: 'Transactions',     path: '/rb/cashier/transactions',     icon: <FileText size={18}/> },
  ],
};

const themeByRole: Record<string, { gradient: string; accent: string; label: string; icon: React.ReactNode }> = {
  super_admin:   { gradient: 'hero-admin',    accent: 'bg-purple-500', label: 'Super Admin',    icon: <Settings size={20}/> },
  water_admin:   { gradient: 'hero-water',    accent: 'bg-blue-400',   label: 'Water Retail',   icon: <Droplets size={20}/> },
  water_cashier: { gradient: 'hero-water',    accent: 'bg-blue-400',   label: 'Water Cashier',  icon: <Droplets size={20}/> },
  driver:        { gradient: 'hero-delivery', accent: 'bg-green-400',  label: 'Water Delivery', icon: <Truck size={20}/> },
  rb_manager:    { gradient: 'hero-rb',       accent: 'bg-orange-400', label: 'R&B Manager',    icon: <Flame size={20}/> },
  rb_cashier:    { gradient: 'hero-rb',       accent: 'bg-orange-400', label: 'R&B Cashier',    icon: <Flame size={20}/> },
};

export function Sidebar() {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!role) return null;
  const navItems = navByRole[role] || [];
  const theme = themeByRole[role] || themeByRole.super_admin;

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const SidebarContent = () => (
    <div className={`flex flex-col h-full ${theme.gradient} text-white`}>
      {/* Brand header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 ${theme.accent} rounded-lg flex items-center justify-center shadow-lg flex-shrink-0`}>
            {theme.icon}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight truncate" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
              JAKE'S ENTERPRISE
            </p>
            <p className="text-white/60 text-xs truncate">{theme.label}</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
            {profile?.full_name?.charAt(0) ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{profile?.full_name}</p>
            <p className="text-xs text-white/60 capitalize">{role?.replace(/_/g, ' ')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => isActive ? 'sidebar-item-active' : 'sidebar-item'}
          >
            {item.icon}
            <span className="flex-1 text-sm">{item.label}</span>
            <ChevronRight size={13} className="opacity-30 flex-shrink-0" />
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="sidebar-item w-full text-red-300 hover:text-red-200 hover:bg-red-900/30"
        >
          <LogOut size={18} />
          <span className="flex-1 text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex flex-col w-60 flex-shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} className="text-gray-700" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64">
            <SidebarContent />
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}