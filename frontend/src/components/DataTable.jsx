import React, { useState, useEffect } from 'react'

export default function DataTable({ 
  columns, 
  data, 
  isLoading, 
  emptyMessage = "No data found", 
  page = 1, 
  totalPages = 1, 
  onPageChange, 
  onSearch, 
  searchPlaceholder = "Search..." 
}) {
  const [searchTerm, setSearchTerm] = useState('')

  // Debounce search
  useEffect(() => {
    if (!onSearch) return
    const delayDebounceFn = setTimeout(() => {
      onSearch(searchTerm)
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, onSearch])

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden flex flex-col">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
        {onSearch && (
          <div className="relative w-full sm:max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent text-sm"
            />
          </div>
        )}
        <div className="text-sm text-gray-500 font-medium">
          Total: {data?.length || 0} items
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F1F5F9]">
              {columns.map((col, idx) => (
                <th 
                  key={col.key || idx} 
                  className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {isLoading ? (
              // Skeleton Loading
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`px-4 py-4 ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data && data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-[#F8FAFC] transition-colors group">
                  {columns.map((col, colIndex) => (
                    <td 
                      key={colIndex} 
                      className={`px-4 py-3 text-sm text-[#1E293B] ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {onPageChange && totalPages > 1 && (
        <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between bg-white">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            &larr; Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  )
}
