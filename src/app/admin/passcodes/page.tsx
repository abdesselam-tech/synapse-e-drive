'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPasscodes, createPasscode, deletePasscode, type Passcode } from '@/lib/server/actions/passcodes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';

export default function AdminPasscodesPage() {
  const [passcodes, setPasscodes] = useState<Passcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [newRole, setNewRole] = useState<'student' | 'teacher'>('student');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadPasscodes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPasscodes();
      setPasscodes(data);
      setError(null);
    } catch (err) {
      setError('Failed to load passcodes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPasscodes();
  }, [loadPasscodes]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createPasscode({ role: newRole });
      
      if (result.success) {
        setSuccess(`Passcode created: ${result.code}`);
        setShowForm(false);
        setNewRole('student');
        await loadPasscodes();
      } else {
        setError(result.error || 'Failed to create passcode');
      }
    } catch (err) {
      setError('Failed to create passcode');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (passcodeId: string) => {
    if (!confirm('Are you sure you want to delete this passcode?')) {
      return;
    }

    setDeleting(passcodeId);
    setError(null);
    setSuccess(null);

    try {
      const result = await deletePasscode({ passcodeId });
      
      if (result.success) {
        setSuccess('Passcode deleted successfully');
        await loadPasscodes();
      } else {
        setError(result.error || 'Failed to delete passcode');
      }
    } catch (err) {
      setError('Failed to delete passcode');
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate stats
  const totalPasscodes = passcodes.length;
  const availablePasscodes = passcodes.filter(p => !p.isUsed).length;
  const usedPasscodes = passcodes.filter(p => p.isUsed).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Passcodes</h1>
          <p className="text-gray-600">Manage registration passcodes for students and teachers</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Generate Passcode'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{totalPasscodes}</div>
            <div className="text-sm text-gray-600">Total Passcodes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{availablePasscodes}</div>
            <div className="text-sm text-gray-600">Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{usedPasscodes}</div>
            <div className="text-sm text-gray-600">Used</div>
          </CardContent>
        </Card>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="error">{error}</Alert>
      )}
      {success && (
        <Alert variant="success">{success}</Alert>
      )}

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Generate New Passcode</h2>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="role">Role</Label>
                <Select
                  id="role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'student' | 'teacher')}
                  disabled={creating}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? 'Generating...' : 'Generate'}
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              The passcode will be a random 8-character code that can be used once during registration.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Passcodes Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading passcodes...</div>
          ) : passcodes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No passcodes yet. Generate one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Used By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {passcodes.map((passcode) => (
                    <tr key={passcode.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                          {passcode.code}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            passcode.role === 'teacher'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {passcode.role.charAt(0).toUpperCase() + passcode.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            passcode.isUsed
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {passcode.isUsed ? 'Used' : 'Available'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {passcode.isUsed ? (
                          <span>{passcode.usedByName || '—'}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(passcode.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(passcode.code, passcode.id)}
                          >
                            {copiedId === passcode.id ? '✓ Copied' : 'Copy'}
                          </Button>
                          {!passcode.isUsed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(passcode.id)}
                              disabled={deleting === passcode.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {deleting === passcode.id ? 'Deleting...' : 'Delete'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
