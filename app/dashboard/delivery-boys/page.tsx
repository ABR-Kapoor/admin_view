'use client';

import { useState, useEffect } from 'react';
import { Download, Filter, Truck, Plus } from 'lucide-react';
import { DeliveryAgent } from '@/lib/types';
import DataTable, { Column } from '@/components/DataTable';
import SearchBar from '@/components/SearchBar';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import ConfirmDialog from '@/components/ConfirmDialog';
import { exportToCSV, formatDateTimeForCSV } from '@/lib/exportCSV';
import ProfileImage from '@/components/ProfileImage';
import ImageModal from '@/components/ImageModal';

export default function DeliveryBoysPage() {
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<DeliveryAgent | null>(null);
  
  // Pagination
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    filterAgents();
  }, [agents, searchQuery, activeFilter]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/delivery-agents');
      const result = await response.json();

      if (!response.ok) {
        console.error('Error fetching delivery agents:', result.error);
        throw new Error(result.error || 'Failed to fetch delivery agents');
      }

      setAgents(result.data || []);
    } catch (error) {
      console.error('Error fetching delivery agents:', error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAgents = () => {
    let filtered = agents;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(agent => {
        const name = agent.name?.toLowerCase() || '';
        const email = agent.email?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        
        return name.includes(query) || email.includes(query);
      });
    }

    // Active filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(agent => 
        activeFilter === 'active' ? agent.is_active : !agent.is_active
      );
    }

    setFilteredAgents(filtered);
    setCurrentPage(1);
  };

  const handleToggleActive = async (agent: DeliveryAgent) => {
    try {
      const response = await fetch(`/api/admin/delivery-agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !agent.is_active })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setAgents(agents.map(a => 
        a.id === agent.id ? { ...a, is_active: !a.is_active } : a
      ));
    } catch (error) {
      console.error('Error toggling agent status:', error);
      alert('Failed to update agent status');
    }
  };

  const handleDelete = async () => {
    if (!selectedAgent) return;

    try {
      const response = await fetch(`/api/admin/delivery-agents/${selectedAgent.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete agent');
      }

      setAgents(agents.filter(a => a.id !== selectedAgent.id));
      setDeleteDialogOpen(false);
      setSelectedAgent(null);
    } catch (error) {
      console.error('Error deleting agent:', error);
      alert('Failed to delete delivery agent');
    }
  };

  const handleExport = () => {
    const exportData = filteredAgents.map(agent => ({
      'Agent ID': agent.id,
      'Name': agent.name,
      'Email': agent.email,
      'Active': agent.is_active ? 'Yes' : 'No',
      'Created At': formatDateTimeForCSV(agent.created_at)
    }));

    exportToCSV(exportData, 'delivery_agents');
  };

  // Pagination
  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAgents = filteredAgents.slice(startIndex, endIndex);

  const columns: Column<DeliveryAgent>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (agent) => (
        <div className="flex items-center gap-3">
          <ProfileImage
            imageUrl={agent.profile_image_url}
            name={agent.name}
            size="md"
            onClick={() => {
              if (agent.profile_image_url) {
                setSelectedImage({
                  url: agent.profile_image_url,
                  name: agent.name
                });
              }
            }}
          />
          <p className="font-semibold text-gray-900">{agent.name}</p>
        </div>
      ),
      sortable: true
    },
    {
      key: 'email',
      label: 'Email',
      render: (agent) => (
        <p className="text-sm text-gray-600">{agent.email}</p>
      ),
      sortable: true
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (agent) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={agent.is_active ? 'active' : 'inactive'} />
          <button
            onClick={() => handleToggleActive(agent)}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Toggle
          </button>
        </div>
      ),
      sortable: true
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (agent) => (
        <p className="text-sm text-gray-600">
          {new Date(agent.created_at).toLocaleDateString()}
        </p>
      ),
      sortable: true
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Delivery Agents</h1>
          <p className="text-gray-600 mt-1">Manage delivery personnel</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-emerald-500 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-all"
          >
            <Download className="h-5 w-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Agents</p>
          <p className="text-2xl font-bold text-emerald-600">{agents.length}</p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {agents.filter(a => a.is_active).length}
          </p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Inactive</p>
          <p className="text-2xl font-bold text-gray-600">
            {agents.filter(a => !a.is_active).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchBar
            placeholder="Search by name or email..."
            onSearch={setSearchQuery}
            className="md:col-span-1"
          />
          
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Agents</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>
            Showing {filteredAgents.length} of {agents.length} delivery agents
          </span>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={paginatedAgents}
        columns={columns}
        loading={loading}
        emptyMessage="No delivery agents found"
        onDelete={(agent) => {
          setSelectedAgent(agent);
          setDeleteDialogOpen(true);
        }}
        actions={true}
      />

      {/* Pagination */}
      {filteredAgents.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredAgents.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Delivery Agent"
        message={`Are you sure you want to delete "${selectedAgent?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedAgent(null);
        }}
      />
      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage.url}
          name={selectedImage.name}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
