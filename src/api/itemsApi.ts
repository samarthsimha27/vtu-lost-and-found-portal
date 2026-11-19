import { ItemStatus, LostItemRecord, RecordKind } from '../types';

export interface ItemFilterParams {
  location?: string;
  category?: string;
  keyword?: string;
  q?: string;
  status?: ItemStatus;
  kind?: RecordKind;
}

const API_BASE = '/api/items';

export async function fetchItems(params?: ItemFilterParams): Promise<LostItemRecord[]> {
  const query = new URLSearchParams();
  if (params) {
    if (params.location && params.location !== 'All Locations') {
      query.append('location', params.location);
    }
    if (params.category && params.category !== 'All Categories') {
      query.append('category', params.category);
    }
    if (params.keyword || params.q) {
      query.append('q', (params.keyword || params.q || '').trim());
    }
    if (params.status) {
      query.append('status', params.status);
    }
    if (params.kind) {
      query.append('kind', params.kind);
    }
  }

  const queryString = query.toString();
  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;

  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch items (${res.status})`);
  }
  return res.json();
}

export async function fetchItemById(id: string): Promise<LostItemRecord> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch item (${res.status})`);
  }
  return res.json();
}

export async function createItem(
  item: Omit<LostItemRecord, 'id' | 'createdAt' | 'status'> & { id?: string; status?: ItemStatus }
): Promise<LostItemRecord> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create item (${res.status})`);
  }
  return res.json();
}

export async function updateItemStatus(
  id: string,
  status: ItemStatus
): Promise<LostItemRecord> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update item status (${res.status})`);
  }
  return res.json();
}

export async function deleteItem(id: string): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete item (${res.status})`);
  }
  return res.json();
}
