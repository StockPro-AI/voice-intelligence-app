import React from 'react';
import { APIManager as APIManagerComponent } from '@/components/APIManager';
import { useAuth } from '@/_core/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function APIManagerPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please log in to access the API Manager</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <APIManagerComponent />
      </div>
    </div>
  );
}
