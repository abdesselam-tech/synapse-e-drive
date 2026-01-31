/**
 * Teacher Group Card Component
 * Displays a group card for teachers
 */

'use client';

import type { Group } from '@/lib/types/group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TeacherGroupCardProps {
  group: Group;
}

export default function TeacherGroupCard({ group }: TeacherGroupCardProps) {
  const capacityPercent = Math.round((group.currentStudents / group.maxStudents) * 100);
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{group.name}</CardTitle>
          <span className={`text-xs px-2 py-1 rounded-full ${
            group.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : group.status === 'inactive'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {group.status}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 line-clamp-2">{group.description}</p>
          
          {/* Capacity Bar */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Capacity</span>
              <span className="font-medium">{group.currentStudents}/{group.maxStudents}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  capacityPercent >= 90 ? 'bg-red-500' : 
                  capacityPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            {group.schedule && (
              <div className="flex items-center gap-2">
                <span>📅</span>
                <span>{group.schedule}</span>
              </div>
            )}
          </div>

          <a href={`/teacher/groups/${group.id}`}>
            <Button className="w-full">
              Manage Group
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
