'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { CreateBranchModal } from '@/components/modals/create-branch-modal';
import { Edit2, Trash2, MapPin, Phone, Mail, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Branch {
  _id: string;
  name: string;
  location: string;
  phone: string;
  email: string;
  capacity: number;
  amenities: string[];
  isActive: boolean;
  createdAt: string;
}

export default function BranchesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/branches');
      if (response.ok) {
        const data = await response.json();
        setBranches(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Failed to load branches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) return;

    try {
      const response = await fetch(`/api/branches/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Branch deleted successfully');
        fetchBranches();
      } else {
        toast.error('Failed to delete branch');
      }
    } catch (error) {
      toast.error('Error deleting branch');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Branches</h1>
          <p className="text-muted-foreground mt-1">Manage all branches here</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Add Branch</Button>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading branches...</p>
        </Card>
      ) : branches.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Branches Yet</h2>
          <p className="text-muted-foreground mb-6">
            Create a new branch to get started.
          </p>
          <Button onClick={() => setIsModalOpen(true)}>Create First Branch</Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <motion.div
              key={branch._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold">{branch.name}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{branch.location}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{branch.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{branch.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>Capacity: {branch.capacity}</span>
                    </div>
                  </div>

                  {branch.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {branch.amenities.map((amenity, idx) => (
                        <span key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(branch._id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <CreateBranchModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchBranches}
      />
    </motion.div>
  );
}
