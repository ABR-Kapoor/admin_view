
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Medicine } from '@/lib/types';
import MedicineForm from '@/components/MedicineForm';

export default function AddMedicinePage() {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Partial<Medicine>) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('medicines')
        .insert([data]);

      if (error) throw error;

      router.push('/dashboard/marketplace');
      router.refresh();
    } catch (error) {
      console.error('Error creating medicine:', error);
      alert('Failed to create medicine');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-3xl font-bold gradient-text">Add New Medicine</h1>
          <p className="text-gray-600 mt-1">Add a new product to the marketplace inventory</p>
        </div>
      </div>

      <div className="glass-card p-6 rounded-lg">
        <MedicineForm 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting}
          submitLabel="Create Medicine"
        />
      </div>
    </div>
  );
}
