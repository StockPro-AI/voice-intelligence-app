import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
}: PaginationProps) {
  const { t } = useTranslation();

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Page Size Selector */}
      {onPageSizeChange && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600 dark:text-slate-400">
            {t('common.itemsPerPage')}:
          </label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-center gap-1">
        {/* Previous Button */}
        <Button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
          className="px-2"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Page Numbers */}
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-2 text-slate-500">...</span>
            ) : (
              <Button
                onClick={() => onPageChange(page as number)}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                className="px-3"
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}

        {/* Next Button */}
        <Button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
          className="px-2"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Page Info */}
      <div className="text-center text-sm text-slate-600 dark:text-slate-400">
        {t('common.page')} {currentPage} {t('common.of')} {totalPages}
      </div>
    </div>
  );
}
