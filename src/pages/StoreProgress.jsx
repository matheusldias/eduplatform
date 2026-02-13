import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Store, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function StoreProgress() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.custom_role === 'admin';
  const isGestor = user?.custom_role === 'gestor';

  React.useEffect(() => {
    if (user && !isAdmin && !isGestor) {
      navigate(createPageUrl('MyCourses'));
    }
  }, [user, isAdmin, isGestor, navigate]);

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => base44.entities.Store.list(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const allUsers = await base44.entities.User.list();
      return allUsers.filter(u => u.role === 'user');
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => base44.entities.Enrollment.list(),
  });

  const storeStats = stores.map(store => {
    const storeStudents = students.filter(s => s.store_id === store.id);
    const storeEnrollments = enrollments.filter(e => 
      storeStudents.some(s => s.id === e.user_id)
    );
    const completedEnrollments = storeEnrollments.filter(e => e.status === 'completed');
    const avgProgress = storeEnrollments.length > 0
      ? Math.round(storeEnrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / storeEnrollments.length)
      : 0;

    return {
      store,
      studentCount: storeStudents.length,
      enrollmentCount: storeEnrollments.length,
      completedCount: completedEnrollments.length,
      avgProgress,
      completionRate: storeEnrollments.length > 0 
        ? Math.round((completedEnrollments.length / storeEnrollments.length) * 100)
        : 0,
    };
  });

  if (!user || (!isAdmin && !isGestor)) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Progresso por Loja
        </h1>
        <p className="text-slate-400">Acompanhe o desempenho de cada loja</p>
      </div>

      <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
        <CardContent className="p-6">
          {stores.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Nenhuma loja cadastrada</p>
            </div>
          ) : (
            <div className="space-y-6">
              {storeStats.map(({ store, studentCount, enrollmentCount, completedCount, avgProgress, completionRate }) => (
                <div
                  key={store.id}
                  className="p-6 rounded-lg bg-slate-800/30 border border-slate-800/50 hover:bg-slate-800/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                        <Store className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">{store.name}</h3>
                        <p className="text-sm text-slate-400">Código: {store.code}</p>
                      </div>
                    </div>
                    <Badge
                      className={
                        store.status === 'active'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }
                    >
                      {store.status === 'active' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-slate-900/50">
                      <p className="text-xs text-slate-400 mb-1">Alunos</p>
                      <p className="text-2xl font-bold text-white">{studentCount}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/50">
                      <p className="text-xs text-slate-400 mb-1">Matrículas</p>
                      <p className="text-2xl font-bold text-white">{enrollmentCount}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/50">
                      <p className="text-xs text-slate-400 mb-1">Concluídos</p>
                      <p className="text-2xl font-bold text-green-400">{completedCount}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/50">
                      <p className="text-xs text-slate-400 mb-1">Taxa Conclusão</p>
                      <p className="text-2xl font-bold text-violet-400">{completionRate}%</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Progresso Médio</span>
                      <span className="text-white font-semibold">{avgProgress}%</span>
                    </div>
                    <Progress value={avgProgress} className="h-2" />
                  </div>
                </div>
              ))}

              <div className="p-6 rounded-lg bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/30">
                <h3 className="text-white font-semibold mb-4">Resumo Geral</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-300 mb-1">Total Lojas</p>
                    <p className="text-2xl font-bold text-white">{stores.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-300 mb-1">Total Alunos</p>
                    <p className="text-2xl font-bold text-white">
                      {storeStats.reduce((sum, s) => sum + s.studentCount, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-300 mb-1">Total Matrículas</p>
                    <p className="text-2xl font-bold text-white">
                      {storeStats.reduce((sum, s) => sum + s.enrollmentCount, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-300 mb-1">Taxa Média</p>
                    <p className="text-2xl font-bold text-white">
                      {storeStats.length > 0
                        ? Math.round(storeStats.reduce((sum, s) => sum + s.completionRate, 0) / storeStats.length)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}