import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, CheckSquare, Lightbulb, Plus, Search, Filter } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";

export function Orchestration() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("notes");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Fetch data from tRPC
  const notesQuery = trpc.orchestration.getNotes.useQuery({
    limit: 100,
    offset: 0,
  });

  const tasksQuery = trpc.tasks.getTasks.useQuery({
    limit: 100,
    offset: 0,
  });

  const projectsQuery = trpc.orchestration.getProjects.useQuery({
    limit: 100,
    offset: 0,
  });

  const filteredNotes = notesQuery.data?.notes?.filter((note) =>
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (note.title && note.title.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const filteredTasks = tasksQuery.data?.tasks?.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  const filteredProjects = projectsQuery.data?.projects?.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      raw: "bg-gray-500",
      task: "bg-blue-500",
      project: "bg-purple-500",
      idea: "bg-yellow-500",
    };
    return colors[category] || "bg-gray-500";
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      unprocessed: "bg-gray-500",
      processing: "bg-blue-500",
      processed: "bg-green-500",
      review: "bg-yellow-500",
      todo: "bg-blue-500",
      in_progress: "bg-yellow-500",
      done: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getPriorityBadgeColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-green-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      critical: "bg-red-500",
    };
    return colors[priority] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {t("orchestration.title", "Orchestrierung")}
          </h1>
          <p className="text-muted-foreground">
            {t("orchestration.description", "Verwalte deine Notizen, Aufgaben und Projekte an einem Ort")}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("common.search", "Suchen...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{t("orchestration.notes", "Notizen")}</span>
              <Badge variant="outline" className="ml-2">
                {filteredNotes.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{t("orchestration.tasks", "Aufgaben")}</span>
              <Badge variant="outline" className="ml-2">
                {filteredTasks.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">{t("orchestration.projects", "Projekte")}</span>
              <Badge variant="outline" className="ml-2">
                {filteredProjects.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">{t("orchestration.notes", "Notizen")}</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("orchestration.addNote", "Notiz hinzufügen")}
              </Button>
            </div>

            {notesQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : filteredNotes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {t("orchestration.noNotes", "Keine Notizen vorhanden")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {filteredNotes.map((note) => (
                    <Card key={note.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            {note.title && (
                              <h3 className="font-semibold text-foreground mb-1">{note.title}</h3>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {note.content}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={`${getCategoryBadgeColor(note.category)} text-white`}>
                            {note.category}
                          </Badge>
                          <Badge className={`${getStatusBadgeColor(note.status)} text-white`}>
                            {note.status}
                          </Badge>
                          {note.recordingId && (
                            <Badge variant="outline">
                              {t("orchestration.recording", "Aufnahme")} #{note.recordingId}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">{t("orchestration.tasks", "Aufgaben")}</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {t("common.filter", "Filter")}
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("orchestration.addTask", "Aufgabe hinzufügen")}
                </Button>
              </div>
            </div>

            {tasksQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {t("orchestration.noTasks", "Keine Aufgaben vorhanden")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {filteredTasks.map((task) => (
                    <Card key={task.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-1">{task.title}</h3>
                            {task.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={`${getPriorityBadgeColor(task.priority)} text-white`}>
                            {task.priority}
                          </Badge>
                          <Badge className={`${getStatusBadgeColor(task.status)} text-white`}>
                            {task.status}
                          </Badge>
                          {task.dueDate && (
                            <Badge variant="outline">
                              {new Date(task.dueDate).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">{t("orchestration.projects", "Projekte")}</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("orchestration.addProject", "Projekt hinzufügen")}
              </Button>
            </div>

            {projectsQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : filteredProjects.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {t("orchestration.noProjects", "Keine Projekte vorhanden")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {filteredProjects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-1">{project.title}</h3>
                            {project.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {project.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap items-center">
                          <Badge className={`${getStatusBadgeColor(project.status)} text-white`}>
                            {project.status}
                          </Badge>
                          {project.effortLevel && (
                            <Badge variant="outline">
                              {t("orchestration.effort", "Aufwand")}: {project.effortLevel}
                            </Badge>
                          )}
                          {project.potentialImpact && (
                            <Badge variant="outline">
                              {t("orchestration.impact", "Impact")}: {project.potentialImpact}%
                            </Badge>
                          )}

                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
