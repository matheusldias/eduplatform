import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Plus, 
  BookOpen, 
  Users, 
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Store,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    category: "",
    level: "beginner",
    status: "draft"
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Redirecionar não-admins
  React.useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate(createPageUrl('MyCourses'));
    }
  }, [user, navigate]);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list('-created_date'),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => base44.entities.Enrollment.list(),
  });

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

  const { data: progress = [] } = useQuery({
    queryKey: ['allProgress'],
    queryFn: () => base44.entities.Progress.list(),
  });

  const createCourseMutation = useMutation({
    mutationFn: (courseData) => base44.entities.Course.create({
      ...courseData,
      instructor_id: user?.id,
      instructor_name: user?.full_name || user?.email,
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setShowCreateDialog(false);
      setNewCourse({ title: "", description: "", category: "", level: "beginner", status: "draft" });
      navigate(createPageUrl('ManageCourse') + '?id=' + data.id);
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (courseId) => base44.entities.Course.delete(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const handleCreateCourse = () => {
    if (!newCourse.title.trim()) return;
    createCourseMutation.mutate(newCourse);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || course.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    {
      title: "Total de Cursos",
      value: courses.length,
      icon: BookOpen,
      color: "from-violet-600 to-purple-600",
      bgColor: "bg-violet-500/10",
    },
    {
      title: "Alunos Matriculados",
      value: new Set(enrollments.map(e => e.user_id)).size,
      icon: Users,
      color: "from-blue-600 to-cyan-600",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Cursos Publicados",
      value: courses.filter(c => c.status === 'published').length,
      icon: Eye,
      color: "from-green-600 to-emerald-600",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Taxa de Conclusão",
      value: enrollments.length > 0 
        ? Math.round((enrollments.filter(e => e.status === 'completed').length / enrollments.length) * 100) + '%'
        : '0%',
      icon: TrendingUp,
      color: "from-orange-600 to-amber-600",
      bgColor: "bg-orange-500/10",
    },
  ];

  // Calcular progresso por loja
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Dashboard Admin
          </h1>
          <p className="text-slate-400">Gerencie seus cursos e acompanhe o desempenho</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Curso
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm hover:bg-slate-900/70 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="bg-slate-900/50 border-slate-800">
          <TabsTrigger value="courses" className="data-[state=active]:bg-violet-600">
            <BookOpen className="w-4 h-4 mr-2" />
            Cursos
          </TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-violet-600">
            <BarChart3 className="w-4 h-4 mr-2" />
            Progresso por Loja
          </TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses">
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-white">Todos os Cursos</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar cursos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-slate-800/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Nenhum curso encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-all duration-200 border border-slate-800/50 group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {course.cover_url ? (
                      <img
                        src={course.cover_url}
                        alt={course.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold mb-1 truncate">{course.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span>{course.total_lessons || 0} aulas</span>
                        <span>•</span>
                        <span>{course.total_duration_minutes || 0} min</span>
                        <span>•</span>
                        <Badge
                          variant="secondary"
                          className={
                            course.status === 'published'
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : course.status === 'draft'
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }
                        >
                          {course.status === 'published' ? 'Publicado' : course.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                      <DropdownMenuItem
                        onClick={() => navigate(createPageUrl('ManageCourse') + '?id=' + course.id)}
                        className="text-slate-300 focus:bg-slate-800 focus:text-white cursor-pointer"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate(createPageUrl('CourseDetail') + '?id=' + course.id)}
                        className="text-slate-300 focus:bg-slate-800 focus:text-white cursor-pointer"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir este curso?')) {
                            deleteCourseMutation.mutate(course.id);
                          }
                        }}
                        className="text-red-400 focus:bg-slate-800 focus:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Progress by Store Tab */}
        <TabsContent value="progress">
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Progresso por Loja</CardTitle>
            </CardHeader>
            <CardContent>
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

                  {/* Summary Card */}
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
        </TabsContent>
      </Tabs>

      {/* Create Course Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Criar Novo Curso</DialogTitle>
            <DialogDescription className="text-slate-400">
              Preencha as informações básicas do curso. Você poderá adicionar módulos e aulas depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Curso</Label>
              <Input
                id="title"
                placeholder="Ex: Introdução ao React"
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o conteúdo do curso..."
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white min-h-24"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  placeholder="Ex: Programação"
                  value={newCourse.category}
                  onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Nível</Label>
                <Select
                  value={newCourse.level}
                  onValueChange={(value) => setNewCourse({ ...newCourse, level: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="beginner">Iniciante</SelectItem>
                    <SelectItem value="intermediate">Intermediário</SelectItem>
                    <SelectItem value="advanced">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCourse}
              disabled={!newCourse.title.trim() || createCourseMutation.isPending}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            >
              {createCourseMutation.isPending ? 'Criando...' : 'Criar Curso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}