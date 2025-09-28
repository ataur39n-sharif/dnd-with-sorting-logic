'use client';

import { useLocalDB } from '@/hooks/useLocalDB';
import { DraggableListsPanel } from './DraggableListsPanel';
import { DraggableItemsPanel } from './DraggableItemsPanel';
import { useState, useCallback } from 'react';
import type { ActionItem } from '@/lib/types';

export function DashboardLayout() {
  const { db, isLoading, error, updateLocalData, loadData } = useLocalDB();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // Get selected list
  const selectedList = selectedListId 
    ? db.lists.find(list => list.id === selectedListId) 
    : null;

  // Get items for selected list
  const selectedItems = selectedListId 
    ? db.items.filter(item => item.listId === selectedListId)
        .sort((a, b) => a.orderRank - b.orderRank)
    : [];

  // Handle list selection
  const handleListSelect = useCallback((listId: string) => {
    setSelectedListId(listId);
  }, []);

  // Handle item updates
  const handleItemUpdate = useCallback((updatedItem: ActionItem) => {
    const updatedItems = db.items.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    
    const updatedDB = {
      ...db,
      items: updatedItems
    };
    
    updateLocalData(updatedDB);
  }, [db, updateLocalData]);

  // Add data refresh callback
  const handleDataRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  // Show error state if there's an error
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Lists Panel - Always visible (this is the right panel with action lists) */}
      <div className="w-1/3 border-r border-gray-200 bg-white">
        <div className="h-full">
          <DraggableListsPanel 
            lists={db.lists.sort((a, b) => a.orderRank - b.orderRank)}
            onListSelect={handleListSelect}
            selectedListId={selectedListId}
            onDataRefresh={handleDataRefresh}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Items Panel - Only show when a list is selected (this is the left panel with items) */}
      {selectedListId ? (
        <div className="flex-1 bg-white">
          <div className="h-full">
            <DraggableItemsPanel 
              items={selectedItems.sort((a, b) => a.orderRank - b.orderRank)}
              listId={selectedListId}
              onItemUpdate={handleItemUpdate}
              onDataRefresh={handleDataRefresh}
              isLoading={isLoading}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl text-gray-400 mb-4">📋</div>
            <div className="text-xl text-gray-600 mb-2">Select an Action List</div>
            <div className="text-gray-500">
              Choose a list from the left panel to view and manage its items
            </div>
          </div>
        </div>
      )}
    </div>
  );
}