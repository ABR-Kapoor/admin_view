'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  PieChart,
  Settings,
  LogOut,
  CreditCard,
  ShoppingCart,
  Truck,
  Calendar,
  FileText,
  Package
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const mainMenu = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/dashboard/patients', icon: Users },
    { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    { name: 'Statistics', href: '/dashboard/analytics', icon: PieChart },
  ];

  const teams = [
    { name: 'Doctors', href: '/dashboard/doctors', color: 'bg-orange-400' },
    { name: 'Clinics', href: '/dashboard/clinics', color: 'bg-purple-500' },
    { name: 'Delivery', href: '/dashboard/delivery-boys', color: 'bg-blue-500' },
  ];

  const otherMenu = [
     { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
     { name: 'Prescriptions', href: '/dashboard/prescriptions', icon: FileText },
     { name: 'Orders', href: '/dashboard/orders', icon: Package },
     { name: 'Marketplace', href: '/dashboard/marketplace', icon: ShoppingCart },
  ];

  return (
    <aside className="w-64 bg-white min-h-screen sticky top-0 flex flex-col font-sans border-r border-gray-100">
      {/* Logo */}
      <div className="p-8 pb-4 flex items-center gap-3">
        <Image
          src="/images/logos/logo_transparent.png"
          alt="AuraSutra Logo"
          width={40}
          height={40}
          className="w-10 h-10 object-contain"
          priority
        />
        <span className="text-2xl font-bold text-gray-800 tracking-tight">AuraSutra</span>
      </div>

      {/* Main Menu */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="mb-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Main Menu</h3>
          <nav className="space-y-1">
            {mainMenu.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-gray-100/80 text-gray-900 font-semibold shadow-sm' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="mb-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Management</h3>
             <nav className="space-y-1">
            {otherMenu.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-gray-100/80 text-gray-900 font-semibold shadow-sm' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Teams Section */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Teams</h3>
          <nav className="space-y-1">
            {teams.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer / Settings */}
      <div className="p-6">
        <nav className="space-y-1">
          <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Log Out</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
