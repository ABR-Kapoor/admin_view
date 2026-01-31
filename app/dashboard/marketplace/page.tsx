'use client';

import { useState, useEffect } from 'react';
import { Download, Filter, Package, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Medicine } from '@/lib/types';
import DataTable, { Column } from '@/components/DataTable';
import SearchBar from '@/components/SearchBar';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import ConfirmDialog from '@/components/ConfirmDialog';
import { exportToCSV, formatDateTimeForCSV } from '@/lib/exportCSV';
import { useRouter } from 'next/navigation';
import ImageModal from '@/components/ImageModal';
import Image from 'next/image';

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [viewImageMedicine, setViewImageMedicine] = useState<Medicine | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    filterMedicines();
  }, [medicines, searchQuery, categoryFilter, stockFilter]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setMedicines(data || []);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMedicines = () => {
    let filtered = medicines;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(med => {
        const name = med.name?.toLowerCase() || '';
        const manufacturer = med.manufacturer?.toLowerCase() || '';
        const category = med.category?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        
        return name.includes(query) || 
               manufacturer.includes(query) || 
               category.includes(query);
      });
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(med => med.category === categoryFilter);
    }

    // Stock filter
    if (stockFilter === 'low') {
      filtered = filtered.filter(med => med.stock_quantity < 10);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(med => med.stock_quantity === 0);
    }

    setFilteredMedicines(filtered);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!selectedMedicine) return;

    try {
      const { error } = await supabase
        .from('medicines')
        .delete()
        .eq('id', selectedMedicine.id);

      if (error) throw error;

      setMedicines(medicines.filter(m => m.id !== selectedMedicine.id));
      setDeleteDialogOpen(false);
      setSelectedMedicine(null);
    } catch (error) {
      console.error('Error deleting medicine:', error);
      alert('Failed to delete medicine');
    }
  };

  const handleExport = () => {
    const exportData = filteredMedicines.map(med => ({
      'Medicine ID': med.id,
      'Name': med.name,
      'Category': med.category || 'N/A',
      'Manufacturer': med.manufacturer || 'N/A',
      'Price': med.price,
      'Stock Quantity': med.stock_quantity,
      'Dosage': med.dosage || 'N/A',
      'Created At': formatDateTimeForCSV(med.created_at)
    }));

    exportToCSV(exportData, 'medicines');
  };

  // Get unique categories
  const categories = Array.from(new Set(medicines.map(m => m.category).filter(Boolean)));

  // Pagination
  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMedicines = filteredMedicines.slice(startIndex, endIndex);

  const columns: Column<Medicine>[] = [
    {
      key: 'image_url',
      label: 'Image',
      render: (med) => (
        <div 
          className="relative w-12 h-12 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border border-gray-100 bg-white"
          onClick={(e) => {
            e.stopPropagation();
            if (med.image_url) {
              setViewImageMedicine(med);
            }
          }}
        >
          {med.image_url ? (
            <Image
              src={med.image_url}
              alt={med.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="w-full h-full bg-gray-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-gray-300" />
            </div>
          )}
        </div>
      ),
      sortable: false
    },
    {
      key: 'name',
      label: 'Medicine Name',
      render: (med) => (
        <div>
          <p className="font-semibold text-gray-900">{med.name}</p>
          <p className="text-xs text-gray-500">{med.dosage || 'N/A'}</p>
        </div>
      ),
      sortable: true
    },
    {
      key: 'category',
      label: 'Category',
      render: (med) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {med.category || 'Uncategorized'}
        </span>
      ),
      sortable: true
    },
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      render: (med) => (
        <p className="text-sm text-gray-600">{med.manufacturer || 'N/A'}</p>
      ),
      sortable: true
    },
    {
      key: 'price',
      label: 'Price',
      render: (med) => (
        <p className="font-semibold text-emerald-600">₹{med.price.toFixed(2)}</p>
      ),
      sortable: true
    },
    {
      key: 'stock_quantity',
      label: 'Stock',
      render: (med) => (
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${
            med.stock_quantity === 0 ? 'text-red-600' :
            med.stock_quantity < 10 ? 'text-amber-600' :
            'text-emerald-600'
          }`}>
            {med.stock_quantity}
          </span>
          {med.stock_quantity === 0 && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
              OUT
            </span>
          )}
          {med.stock_quantity > 0 && med.stock_quantity < 10 && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
              LOW
            </span>
          )}
        </div>
      ),
      sortable: true
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Medicines & Products</h1>
          <p className="text-gray-600 mt-1">Manage marketplace inventory</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard/marketplace/add')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 hover:shadow-lg transition-all"
          >
            <Plus className="h-5 w-5" />
            Add Medicine
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Download className="h-5 w-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-bold text-emerald-600">{medicines.length}</p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Value</p>
          <p className="text-2xl font-bold text-blue-600">
            ₹{medicines.reduce((sum, m) => sum + (m.price * m.stock_quantity), 0).toFixed(2)}
          </p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Low Stock</p>
          <p className="text-2xl font-bold text-amber-600">
            {medicines.filter(m => m.stock_quantity > 0 && m.stock_quantity < 10).length}
          </p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">
            {medicines.filter(m => m.stock_quantity === 0).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchBar
            placeholder="Search by name, manufacturer, or category..."
            onSearch={setSearchQuery}
            className="md:col-span-1"
          />
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Stock Levels</option>
            <option value="low">Low Stock (&lt; 10)</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>
            Showing {filteredMedicines.length} of {medicines.length} products
          </span>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={paginatedMedicines}
        columns={columns}
        loading={loading}
        emptyMessage="No medicines found"
        onView={(med) => router.push(`/dashboard/marketplace/${med.id}`)}
        onEdit={(med) => router.push(`/dashboard/marketplace/${med.id}/edit`)}
        onDelete={(med) => {
          setSelectedMedicine(med);
          setDeleteDialogOpen(true);
        }}
        actions={true}
      />

      {/* Pagination */}
      {filteredMedicines.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredMedicines.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Image Modal */}
      {viewImageMedicine && viewImageMedicine.image_url && (
        <ImageModal
          imageUrl={viewImageMedicine.image_url}
          name={viewImageMedicine.name}
          onClose={() => setViewImageMedicine(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Medicine"
        message={`Are you sure you want to delete "${selectedMedicine?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedMedicine(null);
        }}
      />
    </div>
  );
}
