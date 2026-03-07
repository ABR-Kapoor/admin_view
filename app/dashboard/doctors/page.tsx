'use client';

import { useState, useEffect } from 'react';
import { Download, Search, Filter } from 'lucide-react';
import { Doctor } from '@/lib/types';
import DataTable, { Column } from '@/components/DataTable';
import ProfileImage from '@/components/ProfileImage';
import ImageModal from '@/components/ImageModal';
import { exportToCSV, formatDateTimeForCSV } from '@/lib/exportCSV';
import { useRouter } from 'next/navigation';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const router = useRouter();

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchQuery, verifiedFilter]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/doctors');
      const result = await response.json();
      if (result.success) {
        setDoctors(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doctor => 
        (doctor.user?.name?.toLowerCase() || '').includes(query) || 
        (doctor.user?.email?.toLowerCase() || '').includes(query) || 
        (doctor.specialization || '').toString().toLowerCase().includes(query) ||
        (doctor.registration_number?.toLowerCase() || '').includes(query)
      );
    }
    if (verifiedFilter !== 'all') {
      filtered = filtered.filter(doctor => 
        verifiedFilter === 'verified' ? doctor.is_verified : !doctor.is_verified
      );
    }
    setFilteredDoctors(filtered);
    setCurrentPage(1);
  };

  const handleExport = () => {
     const exportData = filteredDoctors.map(doctor => ({
      'Doctor ID': doctor.did,
      'Name': doctor.user?.name || 'N/A',
      'Email': doctor.user?.email || 'N/A',
      'Specialization': Array.isArray(doctor.specialization) ? doctor.specialization.join(', ') : doctor.specialization,
      'License': doctor.registration_number || 'N/A',
      'Experience': doctor.years_of_experience,
      'Fee': doctor.consultation_fee,
      'Verified': doctor.is_verified ? 'Yes' : 'No'
    }));
    exportToCSV(exportData, 'doctors_list');
  };

  const columns: Column<Doctor>[] = [
    {
      key: 'user',
      label: 'DOCTOR',
      render: (doctor) => (
        <div className="flex items-center gap-4">
          <ProfileImage 
            imageUrl={doctor.user?.profile_image_url}
            name={doctor.user?.name || 'Doctor'}
            size="md"
            onClick={() => {
              if (doctor.user?.profile_image_url) {
                setSelectedImage({
                  url: doctor.user.profile_image_url,
                  name: doctor.user.name || 'Doctor'
                });
              }
            }}
          />
          <div>
            <p className="font-bold text-gray-900 leading-tight">{doctor.user?.name || 'Unknown'}</p>
            <p className="text-xs text-gray-400">{doctor.user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'specialization',
      label: 'SPECIALIZATION',
      render: (doctor) => (
        <div>
          <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
            {Array.isArray(doctor.specialization) ? doctor.specialization.join(', ') : doctor.specialization}
          </p>
          <p className="text-xs text-gray-400">{doctor.years_of_experience || 0} years exp.</p>
        </div>
      ),
    }
  ];

  // Manual pagination for custom table
  const paginatedDoctors = filteredDoctors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-emerald-500">Doctors</h1>
          <p className="text-gray-500 mt-1">Manage all registered doctors</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all font-semibold shadow-lg shadow-emerald-500/20"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl card-shadow">
          <p className="text-sm text-gray-500 font-medium mb-2">Total Doctors</p>
          <p className="text-3xl font-bold text-gray-900">{doctors.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl card-shadow">
          <p className="text-sm text-gray-500 font-medium mb-2">Verified</p>
          <p className="text-3xl font-bold text-green-500">
            {doctors.filter(d => d.is_verified).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl card-shadow">
          <p className="text-sm text-gray-500 font-medium mb-2">Pending Verification</p>
          <p className="text-3xl font-bold text-orange-400">
            {doctors.filter(d => !d.is_verified).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl card-shadow">
          <p className="text-sm text-gray-500 font-medium mb-2">Avg. Consultation Fee</p>
          <p className="text-3xl font-bold text-blue-500">
            ₹{doctors.length > 0 
              ? Math.ceil(doctors.reduce((sum, d) => sum + (Number(d.consultation_fee) || 0), 0) / doctors.length)
              : 0}
          </p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
           <Search className="w-5 h-5 text-emerald-500 absolute left-4 top-1/2 -translate-y-1/2" />
           <input
             type="text"
             placeholder="Search by name, email, specialization, or license..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full pl-12 pr-4 py-3 rounded-xl border border-emerald-100 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 text-gray-700"
           />
        </div>
        <select
          value={verifiedFilter}
          onChange={(e) => setVerifiedFilter(e.target.value)}
          className="px-6 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-700 min-w-[200px]"
        >
          <option value="all">All Doctors</option>
          <option value="verified">Verified Only</option>
          <option value="pending">Pending</option>
        </select>
      </div>

       <div className="text-sm text-gray-500 flex items-center gap-2">
           <Filter className="w-4 h-4" />
           Showing {filteredDoctors.length} of {doctors.length} doctors
       </div>

      {/* Table */}
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
         {/* Custom Table Header */}
         <div className="bg-emerald-50/50 border-b border-emerald-100 px-6 py-4 grid grid-cols-12 gap-4">
            <div className="col-span-4 text-xs font-bold text-emerald-800 uppercase tracking-wider">Doctor</div>
            <div className="col-span-8 text-xs font-bold text-emerald-800 uppercase tracking-wider">Specialization</div>
         </div>

         {/* Items */}
         <div className="divide-y divide-gray-50">
           {loading ? (
             <div className="p-8 text-center text-gray-500">Loading...</div>
           ) : paginatedDoctors.length > 0 ? (
             paginatedDoctors.map((doctor) => (
                <div key={doctor.did} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50/80 transition-colors group cursor-pointer" onClick={() => router.push(`/dashboard/doctors/${doctor.did}`)}>
                   <div className="col-span-4">
                      {columns[0].render!(doctor)}
                   </div>
                   <div className="col-span-8">
                      {columns[1].render!(doctor)}
                   </div>
                </div>
             ))
           ) : (
             <div className="p-8 text-center text-gray-500">No doctors found matching your criteria.</div>
           )}
         </div>
      </div>
    
      {/* Simple Pagination */}
      {filteredDoctors.length > itemsPerPage && (
        <div className="flex justify-center gap-2 mt-4">
           {Array.from({ length: Math.ceil(filteredDoctors.length / itemsPerPage) }).map((_, i) => (
             <button
               key={i}
               onClick={() => setCurrentPage(i + 1)}
               className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                 currentPage === i + 1
                   ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                   : 'bg-white text-gray-500 hover:bg-gray-100'
               }`}
             >
               {i + 1}
             </button>
           ))}
        </div>
      )}

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
