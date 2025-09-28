'use client';

import { useState } from 'react';
import { ActionList } from '@/lib/types';
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

interface DraggableListsPanelProps {
  lists: ActionList[];
  selectedListId: string | null;
  onListSelect: (listId: string) => void;
  onDataRefresh?: () => void;
  isLoading?: boolean;
}

interface SortableListItemProps {
  list: ActionList;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (list: ActionList) => void;
  onDelete: (list: ActionList) => void;
}

function SortableListItem({ list, isSelected, onSelect, onEdit, onDelete }: SortableListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div className="relative">
      <Card
        ref={setNodeRef}
        style={style}
        className={`p-3 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        } ${isDragging ? 'opacity-60 z-50 shadow-2xl scale-105 rotate-2 bg-white border-2 border-blue-300' : ''}`}
        onClick={onSelect}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {list.title}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                Updated {new Date(list.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(list)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(list)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    </div>
  );
}

export function DraggableListsPanel({ 
  lists, 
  selectedListId, 
  onListSelect, 
  onDataRefresh
}: DraggableListsPanelProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<ActionList | null>(null);
  const [newListTitle, setNewListTitle] = useState('');
  const [editListTitle, setEditListTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreateList = async () => {
    if (!newListTitle.trim()) {
      toast.error('Please enter a list title');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newListTitle.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to create list');
      }

      toast.success('List created successfully');
      setNewListTitle('');
      setIsCreateDialogOpen(false);
      
      // Refresh data to show new list immediately
      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (error) {
      console.error('Error creating list:', error);
      toast.error('Failed to create list');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditList = async () => {
    if (!editingList || !editListTitle.trim()) {
      toast.error('Please enter a list title');
      return;
    }

    try {
      const response = await fetch(`/api/lists/${editingList.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editListTitle.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to update list');
      }

      toast.success('List updated successfully');
      setEditingList(null);
      setEditListTitle('');
      setIsEditDialogOpen(false);
      
      // Refresh data to show updated list immediately
      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (error) {
      console.error('Error updating list:', error);
      toast.error('Failed to update list');
    }
  };

  const handleDeleteList = async (list: ActionList) => {
    try {
      const response = await fetch(`/api/lists/${list.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete list');
      }

      toast.success('List deleted successfully');
      
      // If this was the selected list, clear selection
      if (selectedListId === list.id) {
        // Note: We don't have a way to clear selection with current interface
        // This might need to be handled in the parent component
      }
      
      // Refresh data to remove deleted list immediately
      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      toast.error('Failed to delete list');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = lists.findIndex((list) => list.id === active.id);
      const newIndex = lists.findIndex((list) => list.id === over.id);
      
      console.log('🔄 List drag operation:', { 
        activeId: active.id, 
        overId: over.id, 
        oldIndex, 
        newIndex 
      });
      
      try {
        // Use arrayMove to get the correct final order
        const reorderedLists = arrayMove(lists, oldIndex, newIndex);
        
        // Calculate beforeId and afterId from the final position
        let beforeId: string | undefined;
        let afterId: string | undefined;
        
        // Find the new position of the moved item
        const finalIndex = reorderedLists.findIndex((list) => list.id === active.id);
        
        // Get neighbors from the final order
        if (finalIndex > 0) {
          beforeId = reorderedLists[finalIndex - 1].id;
        }
        if (finalIndex < reorderedLists.length - 1) {
          afterId = reorderedLists[finalIndex + 1].id;
        }

        console.log('📍 Calculated positions:', { 
          finalIndex, 
          beforeId, 
          afterId,
          reorderedIds: reorderedLists.map(l => l.id)
        });

        const response = await fetch(`/api/lists/${active.id}/move`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ beforeId, afterId })
        });

        if (!response.ok) {
          throw new Error('Failed to reorder list');
        }

        console.log('✅ List reorder API call successful');
        toast.success('List reordered successfully');
        
        // Refresh data to get the updated order from server
        if (onDataRefresh) {
          onDataRefresh();
        }
      } catch (error) {
        console.error('❌ Error reordering list:', error);
        toast.error('Failed to reorder list');
        
        // Refresh data in case of error
        if (onDataRefresh) {
          onDataRefresh();
        }
      }
    }
  };

  const openEditDialog = (list: ActionList) => {
    setEditingList(list);
    setEditListTitle(list.title);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Action Lists</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add List
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New List</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter list title..."
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateList();
                    }
                  }}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateList} disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create List'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2 min-h-0">
          {lists.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No lists yet. Create your first list to get started!
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={lists.map(list => list.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {lists.map((list) => (
                    <SortableListItem
                      key={list.id}
                      list={list}
                      isSelected={selectedListId === list.id}
                      onSelect={() => onListSelect(list.id)}
                      onEdit={openEditDialog}
                      onDelete={handleDeleteList}
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
            <DialogTitle>Edit List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter list title..."
              value={editListTitle}
              onChange={(e) => setEditListTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleEditList();
                }
              }}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditList}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}