type TablePaginationProps = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
};

export default function TablePagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  itemLabel = 'items',
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const windowSize = 5;
  const startPage = Math.max(1, Math.min(safePage - 2, totalPages - windowSize + 1));
  const endPage = Math.min(totalPages, startPage + windowSize - 1);
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  const buttonClass = 'h-8 min-w-8 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40';

  return <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-xs text-slate-500">
      Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, totalItems)} of {totalItems} {itemLabel}
    </p>
    <nav className="flex items-center gap-1" aria-label={`${itemLabel} pagination`}>
      <button type="button" aria-label="First page" title="First page" disabled={safePage === 1} onClick={() => onPageChange(1)} className={buttonClass}>&lt;&lt;</button>
      <button type="button" aria-label="Previous page" title="Previous page" disabled={safePage === 1} onClick={() => onPageChange(safePage - 1)} className={buttonClass}>&lt;</button>
      {pageNumbers.map(page => <button
        type="button"
        key={page}
        aria-label={`Page ${page}`}
        aria-current={page === safePage ? 'page' : undefined}
        onClick={() => onPageChange(page)}
        className={`h-8 min-w-8 rounded-md border px-2 text-sm font-medium ${page === safePage ? 'border-[#0b2652] bg-[#0b2652] text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'}`}
      >{page}</button>)}
      <button type="button" aria-label="Next page" title="Next page" disabled={safePage === totalPages} onClick={() => onPageChange(safePage + 1)} className={buttonClass}>&gt;</button>
      <button type="button" aria-label="Last page" title="Last page" disabled={safePage === totalPages} onClick={() => onPageChange(totalPages)} className={buttonClass}>&gt;&gt;</button>
    </nav>
  </div>;
}
