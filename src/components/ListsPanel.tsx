'use client';

import { useState } from 'react';
import { ActionList } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ListsPanelProps {
  lists: ActionList[];
  selectedList: ActionList | null;
  onSelectList: (list: ActionList | null) => void;
  onDataRefresh?: () => void;
}

export function ListsPanel({ lists, selectedList, onSelectList, onDataRefresh }: ListsPanelProps) {
  const [newListTitle, setNewListTitle] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<ActionList | null>(null);
  const [editListTitle, setEditListTitle] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleCreateList = async () => {
    if (!newListTitle.trim()) {
      toast.error('Please enter a list title');
      return;
    }

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
      onDataRefresh?.();
    } catch (error) {
      console.error('Error creating list:', error);
      toast.error('Failed to create list');
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
      onDataRefresh?.();
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
      if (selectedList?.id === list.id) {
        onSelectList(null);
      }
      onDataRefresh?.();
    } catch (error) {
      console.error('Error deleting list:', error);
      toast.error('Failed to delete list');
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
                  <Button onClick={handleCreateList}>
                    Create List
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {lists.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No lists yet. Create your first list to get started!
            </div>
          ) : (
            lists.map((list) => (
              <Card
                key={list.id}
                className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedList?.id === list.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => onSelectList(list)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {list.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Updated {new Date(list.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(list)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteList(list)}
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