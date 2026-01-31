
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Medicine } from '@/lib/types';
import MedicineForm from '@/components/MedicineForm';

export default function EditMedicinePage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMedicine();
  }, []);

  const fetchMedicine = async () => {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setMedicine(data);
    } catch (error) {
      console.error('Error fetching medicine:', error);
      router.push('/dashboard/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Partial<Medicine>) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('medicines')
        .update(data)
        .eq('id', params.id);

      if (error) throw error;

      router.push('/dashboard/marketplace');
      router.refresh();
    } catch (error) {
      console.error('Error updating medicine:', error);
      alert('Failed to update medicine');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Edit Medicine</h1>
          <p className="text-gray-600 mt-1">Update product details and inventory</p>
        </div>
      </div>

      <div className="glass-card p-6 rounded-lg">
        {medicine && (
          <MedicineForm 
            initialData={medicine}
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            submitLabel="Update Medicine"
          />
        )}
      </div>
    </div>
  );
}
