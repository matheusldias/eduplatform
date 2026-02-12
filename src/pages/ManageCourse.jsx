import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Plus,
  Save,
  Upload,
  GripVertical,
  Edit,
  Trash2,
  Eye,
  FileVideo,
  FileText,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ManageCourse() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');

  const [courseData, setCourseData] = useState(null);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [newModule, setNewModule] = useState({ title: "", description: "", order: 1 });
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    order: 1,
    content_type: "video",
    content_url: "",
    video_url: "",
    duration_seconds: 0,
    requires_previous: true,
  });

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const courses = await base44.entities.Course.filter({ id: courseId });
      return courses[0];
    },
    enabled: !!courseId,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['modules', courseId],
    queryFn: () => base44.entities.Module.filter({ course_id: courseId }, 'order'),
    enabled: !!courseId,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => base44.entities.Lesson.filter({ course_id: courseId }, 'order'),
    enabled: !!courseId,
  });

  useEffect(() => {
    if (course) {
      setCourseData({
        title: course.title || "",
        description: course.description || "",
        category: course.category || "",
        level: course.level || "beginner",
        status: course.status || "draft",
        cover_url: course.cover_url || "",
      });
    }
  }, [course]);

  const updateCourseMutation = useMutation({
    mutationFn: (data) => base44.entities.Course.update(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: (data) => base44.entities.Module.create({
      ...data,
      course_id: courseId,
      order: modules.length + 1,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
      setShowModuleDialog(false);
      setNewModule({ title: "", description: "", order: 1 });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: (data) => {
      const moduleId = selectedModule.id;
      const moduleLessons = lessons.filter(l => l.module_id === moduleId);
      return base44.entities.Lesson.create({
        ...data,
        course_id: courseId,
        module_id: moduleId,
        order: moduleLessons.length + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      setShowLessonDialog(false);
      setNewLesson({
        title: "",
        description: "",
        order: 1,
        content_type: "video",
        content_url: "",
        video_url: "",
        duration_seconds: 0,
        requires_previous: true,
      });
      setSelectedModule(null);
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId) => base44.entities.Module.delete(moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (lessonId) => base44.entities.Lesson.delete(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
    },
  });

  const handleSaveCourse = () => {
    if (courseData) {
      updateCourseMutation.mutate(courseData);
    }
  };

  const handleUploadCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCourseData({ ...courseData, cover_url: file_url });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    }
  };

  const handleUploadContent = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewLesson({ ...newLesson, content_url: file_url, video_url: file_url });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    } finally {
      setUploadingVideo(false);
    }
  };

  const getLessonsForModule = (moduleId) => {
    return lessons.filter(l => l.module_id === moduleId).sort((a, b) => a.order - b.order);
  };

  if (isLoading || !courseData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('AdminDashboard'))}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Gerenciar Curso</h1>
            <p className="text-slate-400">Configure módulos, aulas e conteúdo</p>
          </div>
        </div>
        <Button
          onClick={handleSaveCourse}
          disabled={updateCourseMutation.isLoading}
          className="bg-gradient-to-r from-violet-600 to-purple-600"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateCourseMutation.isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="bg-slate-900/50 border-slate-800">
          <TabsTrigger value="info" className="data-[state=active]:bg-violet-600">
            Informações
          </TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-violet-600">
            Conteúdo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Título</Label>
                <Input
                  value={courseData.title}
                  onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Descrição</Label>
                <Textarea
                  value={courseData.description}
                  onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white min-h-32"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Categoria</Label>
                  <Input
                    value={courseData.category}
                    onChange={(e) => setCourseData({ ...courseData, category: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Nível</Label>
                  <Select
                    value={courseData.level}
                    onValueChange={(value) => setCourseData({ ...courseData, level: value })}
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
                <div className="space-y-2">
                  <Label className="text-slate-300">Status</Label>
                  <Select
                    value={courseData.status}
                    onValueChange={(value) => setCourseData({ ...courseData, status: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Imagem de Capa</Label>
                {courseData.cover_url && (
                  <img
                    src={courseData.cover_url}
                    alt="Capa"
                    className="w-full max-w-md h-48 object-cover rounded-lg mb-2"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadCover}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Módulos e Aulas</h2>
            <Button
              onClick={() => setShowModuleDialog(true)}
              className="bg-gradient-to-r from-violet-600 to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Módulo
            </Button>
          </div>

          {modules.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-12 text-center">
                <FileVideo className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum módulo criado ainda</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {modules.map((module, moduleIndex) => {
                const moduleLessons = getLessonsForModule(module.id);
                return (
                  <Card key={module.id} className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-5 h-5 text-slate-500" />
                          <div>
                            <CardTitle className="text-white">
                              Módulo {moduleIndex + 1}: {module.title}
                            </CardTitle>
                            {module.description && (
                              <p className="text-sm text-slate-400 mt-1">{module.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedModule(module);
                              setShowLessonDialog(true);
                            }}
                            className="bg-violet-600 hover:bg-violet-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Aula
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('Excluir este módulo?')) {
                                deleteModuleMutation.mutate(module.id);
                              }
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {moduleLessons.length === 0 ? (
                        <p className="text-slate-500 text-sm">Nenhuma aula neste módulo</p>
                      ) : (
                        <div className="space-y-2">
                          {moduleLessons.map((lesson, lessonIndex) => {
                           const ContentIcon = lesson.content_type === 'pdf' ? FileText : lesson.content_type === 'image' ? Image : FileVideo;
                           return (
                             <div
                               key={lesson.id}
                               className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                             >
                               <div className="flex items-center gap-3">
                                 <GripVertical className="w-4 h-4 text-slate-600" />
                                 <ContentIcon className="w-4 h-4 text-violet-400" />
                                 <div>
                                   <p className="text-white text-sm font-medium">
                                     Aula {lessonIndex + 1}: {lesson.title}
                                   </p>
                                   <p className="text-xs text-slate-400">
                                     {lesson.content_type === 'video' ? `${Math.floor(lesson.duration_seconds / 60)} min` : lesson.content_type === 'pdf' ? 'PDF' : 'Imagem'}
                                   </p>
                                 </div>
                               </div>
                               <Button
                                 size="sm"
                                 variant="ghost"
                                 onClick={() => {
                                   if (confirm('Excluir esta aula?')) {
                                     deleteLessonMutation.mutate(lesson.id);
                                   }
                                 }}
                                 className="text-red-400 hover:text-red-300"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </Button>
                             </div>
                           );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Novo Módulo</DialogTitle>
            <DialogDescription className="text-slate-400">
              Organize o conteúdo do curso em módulos temáticos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título do Módulo</Label>
              <Input
                value={newModule.title}
                onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Ex: Introdução"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (Opcional)</Label>
              <Textarea
                value={newModule.description}
                onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Descreva o que será ensinado..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModuleDialog(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => createModuleMutation.mutate(newModule)}
              disabled={!newModule.title.trim() || createModuleMutation.isLoading}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Criar Módulo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Aula</DialogTitle>
            <DialogDescription className="text-slate-400">
              Adicione uma aula ao módulo {selectedModule?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título da Aula</Label>
              <Input
                value={newLesson.title}
                onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={newLesson.description}
                onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Conteúdo</Label>
              <Select
                value={newLesson.content_type}
                onValueChange={(value) => setNewLesson({ ...newLesson, content_type: value, content_url: "", video_url: "" })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="image">Imagem</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newLesson.content_type === 'video' ? (
              <>
                <div className="space-y-2">
                  <Label>Upload de Vídeo</Label>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleUploadContent}
                    disabled={uploadingVideo}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  {uploadingVideo && <p className="text-sm text-slate-400">Fazendo upload...</p>}
                  {newLesson.content_url && (
                    <p className="text-sm text-green-400">✓ Arquivo carregado</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>ou URL do YouTube</Label>
                  <Input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={newLesson.video_url}
                    onChange={(e) => setNewLesson({ ...newLesson, video_url: e.target.value, content_url: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-500">Cole o link de um vídeo do YouTube</p>
                </div>
                <div className="space-y-2">
                  <Label>Duração (segundos)</Label>
                  <Input
                    type="number"
                    value={newLesson.duration_seconds}
                    onChange={(e) => setNewLesson({ ...newLesson, duration_seconds: parseInt(e.target.value) || 0 })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>Upload de {newLesson.content_type === 'pdf' ? 'PDF' : 'Imagem'}</Label>
                <Input
                  type="file"
                  accept={newLesson.content_type === 'pdf' ? '.pdf' : 'image/*'}
                  onChange={handleUploadContent}
                  disabled={uploadingVideo}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                {uploadingVideo && <p className="text-sm text-slate-400">Fazendo upload...</p>}
                {newLesson.content_url && (
                  <p className="text-sm text-green-400">✓ Arquivo carregado</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLessonDialog(false);
                setSelectedModule(null);
              }}
              className="border-slate-700 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => createLessonMutation.mutate(newLesson)}
              disabled={!newLesson.title.trim() || (!newLesson.content_url && !newLesson.video_url) || createLessonMutation.isLoading}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Criar Aula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}