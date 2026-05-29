export const LIST_PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25, 30, 'all'];

export function paginateList(items, page, pageSize) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) {
    return { pageItems: [], totalPages: 1, range: { start: 0, end: 0 } };
  }
  if (pageSize === 'all') {
    return {
      pageItems: list,
      totalPages: 1,
      range: { start: 1, end: list.length },
    };
  }
  const size = Math.max(1, Number(pageSize) || 5);
  const totalPages = Math.max(1, Math.ceil(list.length / size));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (safePage - 1) * size;
  const pageItems = list.slice(startIdx, startIdx + size);
  return {
    pageItems,
    totalPages,
    range: { start: startIdx + 1, end: startIdx + pageItems.length },
  };
}
