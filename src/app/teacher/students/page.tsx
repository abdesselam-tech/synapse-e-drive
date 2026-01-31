/**
 * Teacher Students Page
 * View students who have booked lessons with this teacher
 * Only shows students who still exist and have the student role
 */

import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { redirect } from 'next/navigation';
import { COLLECTIONS } from '@/lib/utils/constants/collections';
import { Card, CardContent } from '@/components/ui/card';

type Student = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  totalBookings: number;
  upcomingBookings: number;
};

async function getTeacherStudents(teacherId: string): Promise<Student[]> {
  try {
    // Get all bookings for this teacher
    const bookingsSnapshot = await adminDb
      .collection(COLLECTIONS.BOOKINGS)
      .where('teacherId', '==', teacherId)
      .where('status', 'in', ['confirmed', 'completed'])
      .get();

    // Group by student - first pass to collect student IDs
    const studentBookings = new Map<string, {
      name: string;
      email: string;
      bookings: { startTime: Date; status: string }[];
    }>();

    const now = new Date();

    for (const doc of bookingsSnapshot.docs) {
      const booking = doc.data();
      const studentId = booking.studentId;

      if (!studentBookings.has(studentId)) {
        studentBookings.set(studentId, {
          name: booking.studentName,
          email: booking.studentEmail,
          bookings: [],
        });
      }

      // Parse booking date
      let bookingDate: Date;
      if (booking.startTime && typeof booking.startTime.toDate === 'function') {
        bookingDate = booking.startTime.toDate();
      } else if (booking.startTime) {
        bookingDate = new Date(booking.startTime);
      } else {
        continue;
      }

      studentBookings.get(studentId)!.bookings.push({
        startTime: bookingDate,
        status: booking.status,
      });
    }

    // Second pass - verify users still exist and are students
    const students: Student[] = [];
    
    for (const [studentId, data] of studentBookings.entries()) {
      // VERIFY USER STILL EXISTS AND IS A STUDENT
      const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(studentId).get();
      
      // Skip if user doesn't exist or is no longer a student
      if (!userDoc.exists) {
        console.log(`Skipping student ${studentId}: user no longer exists`);
        continue;
      }
      
      const userData = userDoc.data();
      if (userData?.role !== 'student') {
        console.log(`Skipping student ${studentId}: role is now ${userData?.role}`);
        continue;
      }

      // Count bookings
      let totalBookings = 0;
      let upcomingBookings = 0;

      for (const booking of data.bookings) {
        totalBookings++;
        if (booking.startTime > now && booking.status === 'confirmed') {
          upcomingBookings++;
        }
      }

      students.push({
        id: studentId,
        name: userData.displayName || data.name,
        email: userData.email || data.email,
        phoneNumber: userData.phoneNumber,
        totalBookings,
        upcomingBookings,
      });
    }

    return students.sort((a, b) => b.upcomingBookings - a.upcomingBookings);
  } catch (error) {
    console.error('Error getting teacher students:', error);
    return [];
  }
}

export default async function TeacherStudentsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/auth/login');
  }

  let teacherId: string;
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    teacherId = decodedToken.uid;
  } catch {
    redirect('/auth/login');
  }

  const students = await getTeacherStudents(teacherId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Students</h1>
        <p className="text-gray-600">View students who have booked your lessons</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{students.length}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {students.filter(s => s.upcomingBookings > 0).length}
            </div>
            <div className="text-sm text-gray-600">With Upcoming Lessons</div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Upcoming Lessons
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Lessons
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No students have booked your lessons yet
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{student.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.phoneNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      student.upcomingBookings > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {student.upcomingBookings}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.totalBookings}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
