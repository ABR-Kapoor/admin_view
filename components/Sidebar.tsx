'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UserCog,
  Users,
  Building2,
  ShoppingCart,
  Truck,
  Calendar,
  FileText,
  CreditCard,
  Package,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Doctors', href: '/dashboard/doctors', icon: UserCog },
    { name: 'Patients', href: '/dashboard/patients', icon: Users },
    { name: 'Clinics', href: '/dashboard/clinics', icon: Building2 },
    { name: 'Marketplace', href: '/dashboard/marketplace', icon: ShoppingCart },
    { name: 'Delivery Boys', href: '/dashboard/delivery-boys', icon: Truck },
    { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
    { name: 'Prescriptions', href: '/dashboard/prescriptions', icon: FileText },
    { name: 'Orders', href: '/dashboard/orders', icon: Package },
    { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  ];

  return (
    <aside className="w-64 glass border-r border-emerald-200/50 min-h-screen sticky top-0 flex flex-col shadow-xl">
      {/* Logo */}
      <div className="p-6 border-b border-emerald-200/50">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <img src="/Logos/logo_transparent.png" alt="AuraSutra" className="h-12" />
          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent" style={{ fontFamily: 'Alatsi, sans-serif' }}>
            AuraSutra
          </span>
        </Link>
        <p className="text-xs text-emerald-600 font-semibold mt-2 ml-14">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-xl smooth-transition group
                ${isActive 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30' 
                  : 'text-gray-700 hover:bg-emerald-50/80 hover:text-emerald-700'
                }
              `}
            >
              <Icon className={`w-5 h-5 group-hover:scale-110 smooth-transition ${isActive ? 'animate-pulse-green' : ''}`} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-emerald-200/50 glass-dark">
        <div className="text-center">
          <p className="text-xs text-emerald-700 font-semibold">
            Admin Dashboard v1.0
          </p>
          <p className="text-xs text-emerald-600 mt-1">
            Powered by AuraSutra
          </p>
        </div>
      </div>
    </aside>
  );
}
