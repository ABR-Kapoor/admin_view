'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
      {/* Items info */}
      <div className="flex items-center gap-4">
        <p className="text-sm text-gray-700">
          Showing <span className="font-semibold text-emerald-600">{startItem}</span> to{' '}
          <span className="font-semibold text-emerald-600">{endItem}</span> of{' '}
          <span className="font-semibold text-emerald-600">{totalItems}</span> results
        </p>
        
        {onItemsPerPageChange && (
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={!canGoPrevious}
          className="p-2 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="First page"
        >
          <ChevronsLeft className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className="p-2 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNumber;
            if (totalPages <= 5) {
              pageNumber = i + 1;
            } else if (currentPage <= 3) {
              pageNumber = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNumber = totalPages - 4 + i;
            } else {
              pageNumber = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === pageNumber
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="p-2 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next page"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          className="p-2 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Last page"
        >
          <ChevronsRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
