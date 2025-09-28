'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useOptimisticUpdates() {
  const [isLoading, setIsLoading] = useState(false);

  const executeWithOptimism = useCallback(async <T>(
    optimisticUpdate: () => void,
    serverUpdate: () => Promise<T>,
    revertUpdate: () => void,
    options: OptimisticUpdateOptions<T> = {}
  ) => {
    const {
      onSuccess,
      onError,
      successMessage,
      errorMessage = 'Operation failed'
    } = options;

    try {
      setIsLoading(true);
      
      // Apply optimistic update immediately
      optimisticUpdate();
      
      // Execute server update
      const result = await serverUpdate();
      
      // Show success message if provided
      if (successMessage) {
        toast.success(successMessage);
      }
      
      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      // Revert optimistic update on error
      revertUpdate();
      
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      // Show error message
      toast.error(errorMessage);
      
      // Call error callback
      if (onError) {
        onError(errorObj);
      }
      
      throw errorObj;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createList = useCallback(async (
    title: string,
    optimisticUpdate: () => void,
    revertUpdate: () => void
  ) => {
    return executeWithOptimism(
      optimisticUpdate,
      async () => {
        const response = await fetch('/api/lists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title })
        });
        
        if (!response.ok) {
          throw new Error('Failed to create list');
        }
        
        return response.json();
      },
      revertUpdate,
      {
        successMessage: 'List created successfully',
        errorMessage: 'Failed to create list'
      }
    );
  }, [executeWithOptimism]);

  const updateList = useCallback(async (
    id: string,
    title: string,
    optimisticUpdate: () => void,
    revertUpdate: () => void
  ) => {
    return executeWithOptimism(
      optimisticUpdate,
      async () => {
        const response = await fetch(`/api/lists/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title })
        });
        
        if (!response.ok) {
          throw new Error('Failed to update list');
        }
        
        return response.json();
      },
      revertUpdate,
      {
        successMessage: 'List updated successfully',
        errorMessage: 'Failed to update list'
      }
    );
  }, [executeWithOptimism]);

  const deleteList = useCallback(async (
    id: string,
    optimisticUpdate: () => void,
    revertUpdate: () => void
  ) => {
    return executeWithOptimism(
      optimisticUpdate,
      async () => {
        const response = await fetch(`/api/lists/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete list');
        }
        
        return response.json();
      },
      revertUpdate,
      {
        successMessage: 'List deleted successfully',
        errorMessage: 'Failed to delete list'
      }
    );
  }, [executeWithOptimism]);

  const moveList = useCallback(async (
    id: string,
    beforeId: string | null,
    afterId: string | null,
    optimisticUpdate: () => void,
    revertUpdate: () => void
  ) => {
    return executeWithOptimism(
      optimisticUpdate,
      async () => {
        const response = await fetch(`/api/lists/${id}/move`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ beforeId, afterId })
        });
        
        if (!response.ok) {
          throw new Error('Failed to move list');
        }
        
        return response.json();
      },
      revertUpdate,
      {
        successMessage: 'List moved successfully',
        errorMessage: 'Failed to move list'
      }
    );
  }, [executeWithOptimism]);

  const createItem = useCallback(async (
    title: string,
    listId: string,
    optimisticUpdate: () => void,
    revertUpdate: () => void
  ) => {
    return executeWithOptimism(
      optimisticUpdate,
      async () => {
        const response = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, listId })
        });
        
        if (!response.ok) {
          throw new Error('Failed to create item');
        }
        
        return response.json();
      },
      revertUpdate,
      {
        successMessage: 'Item created successfully',
        errorMessage: 'Failed to create item'
      }
    );
  }, [executeWithOptimism]);

  const updateItem = useCallback(async (
    id: string,
    title: string,
    optimisticUpdate: () => void,
    revertUpdate: () => void
  ) => {
    return executeWithOptimism(
      optimisticUpdate,
      async () => {
        const response = await fetch(`/api/items/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title })
        });
        
        if (!response.ok) {
          throw new Error('Failed to update item');
        }
        
        return response.json();
      },
      revertUpdate,
      {
        successMessage: 'Item updated successfully',
        errorMessage: 'Failed to update item'
      }
    );
  }, [executeWithOptimism]);

  const deleteItem = useCallback(async (
    id: string,
    optimisticUpdate: () => void,
    revertUpdate: () => void
  ) => {
    return executeWithOptimism(
      optimisticUpdate,
      async () => {
        const response = await fetch(`/api/items/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete item');
        }
        
        return response.json();
      },
      revertUpdate,
      {
        successMessage: 'Item deleted successfully',
        errorMessage: 'Failed to delete item'
      }
    );
  }, [executeWithOptimism]);

  const moveItem = useCallback(async (
    id: string,
    listId: string,
    beforeId: string | null,
    afterId: string | null,
    optimisticUpdate: () => void,
    revertUpdate: () => void
  ) => {
    return executeWithOptimism(
      optimisticUpdate,
      async () => {
        const response = await fetch(`/api/items/${id}/move`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listId, beforeId, afterId })
        });
        
        if (!response.ok) {
          throw new Error('Failed to move item');
        }
        
        return response.json();
      },
      revertUpdate,
      {
        successMessage: 'Item moved successfully',
        errorMessage: 'Failed to move item'
      }
    );
  }, [executeWithOptimism]);

  return {
    isLoading,
    executeWithOptimism,
    createList,
    updateList,
    deleteList,
    moveList,
    createItem,
    updateItem,
    deleteItem,
    moveItem
  };
}