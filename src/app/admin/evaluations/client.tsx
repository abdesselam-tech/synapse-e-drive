/**
 * Admin Evaluations Client Component
 * Handles filtering, student evaluation display, and review actions
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RankBadge } from '@/components/ui/RankBadge';
import { reviewExamRequest, setExamResult, getStudentEvaluationData } from '@/lib/server/actions/examForms';
import type { ExamRequest } from '@/lib/types/examRequest';

interface EvaluationsClientProps {
  initialRequests: ExamRequest[];
  groups: Array<{ id: string; name: string; teacherName: string }>;
  teachers: Array<{ id: string; name: string }>;
}

interface StudentEvaluation {
  student: {
    id: string;
    name: string;
    email: string;
    groupId?: string;
    groupName?: string;
    rank?: number;
    rankLabel?: string;
  };
  quizScores: Array<{
    quizId: string;
    quizTitle: string;
    score: number;
    totalPoints: number;
    percentage: number;
    completedAt: number;
  }>;
  teacherNotes: string[];
  groupProgress: {
    studentProgress: number;
    groupAverage: number;
  };
}

export default function EvaluationsClient({
  initialRequests,
  groups,
  teachers,
}: EvaluationsClientProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [filterGroup, setFilterGroup] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ExamRequest | null>(null);
  const [studentEval, setStudentEval] = useState<StudentEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Filter requests
  const filteredRequests = requests.filter(req => {
    if (filterGroup && req.groupId !== filterGroup) return false;
    if (filterTeacher && req.teacherId !== filterTeacher) return false;
    return true;
  });

  // Load student evaluation when a request is selected
  useEffect(() => {
    async function loadEvaluation() {
      if (!selectedRequest) {
        setStudentEval(null);
        return;
      }

      setLoading(true);
      try {
        const data = await getStudentEvaluationData(selectedRequest.studentId);
        setStudentEval(data);
      } catch (error) {
        console.error('Error loading evaluation:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEvaluation();
  }, [selectedRequest]);

  async function handleApprove() {
    if (!selectedRequest) return;
    
    setLoading(true);
    setMessage(null);

    const result = await reviewExamRequest({
      requestId: selectedRequest.id,
      action: 'approve',
      adminNotes: adminNotes || undefined,
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Demande approuvée avec succès' });
      setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
      setSelectedRequest(null);
      setAdminNotes('');
    } else {
      setMessage({ type: 'error', text: result.error || 'Erreur lors de l\'approbation' });
    }

    setLoading(false);
  }

  async function handleReject() {
    if (!selectedRequest || !rejectionReason) return;
    
    setLoading(true);
    setMessage(null);

    const result = await reviewExamRequest({
      requestId: selectedRequest.id,
      action: 'reject',
      adminNotes: adminNotes || undefined,
      rejectionReason,
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Demande refusée' });
      setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
      setSelectedRequest(null);
      setAdminNotes('');
      setRejectionReason('');
    } else {
      setMessage({ type: 'error', text: result.error || 'Erreur lors du refus' });
    }

    setLoading(false);
  }

  function formatDate(value: string | number): string {
    const date = typeof value === 'number' ? new Date(value) : new Date(value);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hub d'Évaluations</h1>
        <p className="text-gray-600">Examinez les demandes d'examen et évaluez les étudiants</p>
      </div>

      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-48">
              <Label>Filtrer par Groupe</Label>
              <Select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="mt-1"
              >
                <option value="">Tous les groupes</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex-1 min-w-48">
              <Label>Filtrer par Enseignant</Label>
              <Select
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                className="mt-1"
              >
                <option value="">Tous les enseignants</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Demandes en attente ({filteredRequests.length})
          </h2>
          
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">Aucune demande en attente</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map(request => (
                <Card 
                  key={request.id}
                  className={`cursor-pointer transition-colors ${
                    selectedRequest?.id === request.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedRequest(request)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{request.studentName}</p>
                        <p className="text-sm text-gray-600">{request.teacherName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-blue-600">
                          {formatDate(request.examDate)}
                        </p>
                        <p className="text-xs text-gray-500">{request.examTime}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Student Evaluation Panel */}
        <div>
          {selectedRequest ? (
            <Card>
              <CardHeader>
                <CardTitle>Évaluation de {selectedRequest.studentName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="py-8 text-center text-gray-500">Chargement...</div>
                ) : studentEval ? (
                  <>
                    {/* Student Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{studentEval.student.name}</span>
                        {studentEval.student.rank && studentEval.student.rankLabel && (
                          <RankBadge 
                            rank={studentEval.student.rank} 
                            label={studentEval.student.rankLabel}
                            size="sm"
                          />
                        )}
                      </div>
                      {studentEval.student.groupName && (
                        <p className="text-sm text-gray-600">
                          Groupe: {studentEval.student.groupName}
                        </p>
                      )}
                    </div>

                    {/* Quiz Scores */}
                    <div>
                      <h4 className="font-medium mb-2">Scores Quiz (5 derniers)</h4>
                      {studentEval.quizScores.length === 0 ? (
                        <p className="text-sm text-gray-500">Aucun quiz complété</p>
                      ) : (
                        <div className="space-y-2">
                          {studentEval.quizScores.map((quiz, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    quiz.percentage >= 80 ? 'bg-green-500' : 
                                    quiz.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${quiz.percentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-12">{quiz.percentage}%</span>
                            </div>
                          ))}
                          <p className="text-xs text-gray-500 mt-1">
                            Tendance: {studentEval.quizScores[0]?.percentage > studentEval.quizScores[studentEval.quizScores.length - 1]?.percentage ? '↗ En amélioration' : '↘ En baisse'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Progress Comparison */}
                    <div>
                      <h4 className="font-medium mb-2">Progression vs Groupe</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Étudiant</p>
                          <div className="bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-blue-500 h-3 rounded-full"
                              style={{ width: `${studentEval.groupProgress.studentProgress}%` }}
                            />
                          </div>
                          <p className="text-xs text-right">{studentEval.groupProgress.studentProgress}%</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Moyenne groupe</p>
                          <div className="bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-gray-400 h-3 rounded-full"
                              style={{ width: `${studentEval.groupProgress.groupAverage}%` }}
                            />
                          </div>
                          <p className="text-xs text-right">{studentEval.groupProgress.groupAverage}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Teacher Notes */}
                    {studentEval.teacherNotes.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Notes de l'enseignant</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          {studentEval.teacherNotes.map((note, idx) => (
                            <p key={idx} className="text-sm text-blue-800">{note}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin Notes */}
                    <div>
                      <Label>Notes admin (optionnel)</Label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md text-sm"
                        rows={2}
                        placeholder="Ajouter des notes..."
                      />
                    </div>

                    {/* Rejection Reason */}
                    <div>
                      <Label>Raison du refus (requis si refus)</Label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md text-sm"
                        rows={2}
                        placeholder="Expliquez pourquoi la demande est refusée..."
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleApprove}
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        ✅ Approuver
                      </Button>
                      <Button
                        onClick={handleReject}
                        disabled={loading || !rejectionReason}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        ❌ Refuser
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    Impossible de charger les données d'évaluation
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">
                  Sélectionnez une demande pour voir l'évaluation de l'étudiant
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
