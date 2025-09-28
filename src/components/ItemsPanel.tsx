'use client';

import { useState } from 'react';
import { ActionList, ActionItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ItemsPanelProps {
  selectedList: ActionList | null;
  items: ActionItem[];
  onDataRefresh?: () => void;
}

export function ItemsPanel({ selectedList, items, onDataRefresh }: ItemsPanelProps) {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [editItemTitle, setEditItemTitle] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleCreateItem = async () => {
    if (!selectedList || !newItemTitle.trim()) {
      toast.error('Please enter an item title');
      return;
    }

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newItemTitle.trim(),
          listId: selectedList.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create item');
      }

      toast.success('Item created successfully');
      setNewItemTitle('');
      setIsCreateDialogOpen(false);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error('Failed to create item');
    }
  };

  const handleEditItem = async () => {
    if (!editingItem || !editItemTitle.trim()) {
      toast.error('Please enter an item title');
      return;
    }

    try {
      const response = await fetch(`/api/items/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editItemTitle.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      toast.success('Item updated successfully');
      setEditingItem(null);
      setEditItemTitle('');
      setIsEditDialogOpen(false);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (item: ActionItem) => {
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      toast.success('Item deleted successfully');
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const openEditDialog = (item: ActionItem) => {
    setEditingItem(item);
    setEditItemTitle(item.title);
    setIsEditDialogOpen(true);
  };

  if (!selectedList) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-lg mb-2">No list selected</div>
          <div className="text-sm">Select a list from the left panel to view its items</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedList.title}
            </h2>
            <p className="text-sm text-gray-500">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter item title..."
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateItem();
                    }
                  }}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateItem}>
                    Create Item
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items in this list yet. Add your first item to get started!
            </div>
          ) : (
            items.map((item) => (
              <Card
                key={item.id}
                className="p-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Updated {new Date(item.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(item)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteItem(item)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter item title..."
              value={editItemTitle}
              onChange={(e) => setEditItemTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleEditItem();
                }
              }}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditItem}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}