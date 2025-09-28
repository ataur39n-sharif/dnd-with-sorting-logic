'use client';

import { useState } from 'react';
import { ActionItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MoreVertical, Edit, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DraggableItemsPanelProps {
  items: ActionItem[];
  listId: string;
  onItemUpdate: (item: ActionItem) => void;
  onDataRefresh?: () => void;
  isLoading?: boolean;
}

interface SortableItemProps {
  item: ActionItem;
  onEdit: (item: ActionItem) => void;
  onDelete: (item: ActionItem) => void;
  isDeleting?: boolean;
}

function SortableItem({ item, onEdit, onDelete, isDeleting }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div className="relative">
      <Card
        ref={setNodeRef}
        style={style}
        className={`p-3 cursor-pointer hover:shadow-md transition-all duration-200 ${
          isDragging ? 'opacity-60 z-50 shadow-2xl scale-105 rotate-1 bg-white border-2 border-green-300' : ''
        } ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded flex-shrink-0"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(item)} disabled={isDeleting}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(item)}
                className="text-red-600"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    </div>
  );
}

export function DraggableItemsPanel({ 
  items, 
  listId, 
  onDataRefresh
}: DraggableItemsPanelProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [editItemTitle, setEditItemTitle] = useState('');
  const [editItemDescription, setEditItemDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleCreateItem = async () => {
    if (!newItemTitle.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newItemTitle.trim(),
          description: newItemDescription.trim() || undefined,
          listId: listId,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create item');
      }

      await response.json();
      toast.success('Item created successfully');
      
      setNewItemTitle('');
      setNewItemDescription('');
      setIsCreateDialogOpen(false);
      
      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error('Failed to create item');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditItem = async () => {
    if (!editingItem || !editItemTitle.trim()) return;

    setIsEditing(true);
    try {
      const response = await fetch(`/api/items/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editItemTitle.trim(),
          description: editItemDescription.trim() || undefined,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      toast.success('Item updated successfully');
      
      setIsEditDialogOpen(false);
      setEditingItem(null);
      setEditItemTitle('');
      setEditItemDescription('');
      
      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteItem = async (item: ActionItem) => {
    setDeletingItemId(item.id);
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      toast.success('Item deleted successfully');
      
      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    } finally {
      setDeletingItemId(null);
    }
  };

  const openEditDialog = (item: ActionItem) => {
    setEditingItem(item);
    setEditItemTitle(item.title);
    setEditItemDescription(item.description || '');
    setIsEditDialogOpen(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      console.log('🔄 Item drag operation:', { 
        activeId: active.id, 
        overId: over.id, 
        oldIndex, 
        newIndex,
        listId 
      });
      
      try {
        // Use arrayMove to get the correct final order
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        
        // Calculate beforeId and afterId from the final position
        let beforeId: string | undefined;
        let afterId: string | undefined;
        
        // Find the new position of the moved item
        const finalIndex = reorderedItems.findIndex((item) => item.id === active.id);
        
        // Get neighbors from the final order
        if (finalIndex > 0) {
          beforeId = reorderedItems[finalIndex - 1].id;
        }
        if (finalIndex < reorderedItems.length - 1) {
          afterId = reorderedItems[finalIndex + 1].id;
        }

        console.log('📍 Calculated positions:', { 
          finalIndex, 
          beforeId, 
          afterId,
          reorderedIds: reorderedItems.map(i => i.id)
        });

        const response = await fetch(`/api/items/${active.id}/move`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            targetListId: listId,
            beforeId, 
            afterId 
          })
        });

        if (!response.ok) {
          throw new Error('Failed to reorder item');
        }

        console.log('✅ Item reorder API call successful');
        toast.success('Item reordered successfully');
        
        // Refresh data to get the updated order from server
        if (onDataRefresh) {
          onDataRefresh();
        }
      } catch (error) {
        console.error('❌ Error reordering item:', error);
        toast.error('Failed to reorder item');
        
        // Refresh data in case of error
        if (onDataRefresh) {
          onDataRefresh();
        }
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Items</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <Input
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="Enter item title"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateItem();
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Description (optional)</label>
                  <Input
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    placeholder="Enter item description"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateItem} disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Item'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2 min-h-0">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items yet. Create your first item to get started!
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {items.map((item) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      onEdit={openEditDialog}
                      onDelete={handleDeleteItem}
                      isDeleting={deletingItemId === item.id}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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
            <div>
              <label className="text-sm font-medium text-gray-700">Title</label>
              <Input
                value={editItemTitle}
                onChange={(e) => setEditItemTitle(e.target.value)}
                placeholder="Enter item title"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleEditItem();
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Description (optional)</label>
              <Input
                value={editItemDescription}
                onChange={(e) => setEditItemDescription(e.target.value)}
                placeholder="Enter item description"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditItem} disabled={isEditing}>
                {isEditing ? 'Updating...' : 'Update Item'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}