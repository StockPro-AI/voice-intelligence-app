import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Trash2, Edit2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function Tasks() {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority');
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');

  // Fetch tasks
  const { data: tasksData, isLoading, refetch } = trpc.tasks.getTasks.useQuery({
    status: filterStatus === 'all' ? undefined : (filterStatus as any),
    limit: 100,
  });

  // Fetch sorted tasks
  const { data: sortedData } = trpc.tasks.getTasksSorted.useQuery(
    { includeCompleted: filterStatus === 'all' },
    { enabled: sortBy === 'priority' }
  );

  // Mutations
  const updateTaskMutation = trpc.tasks.updateTask.useMutation({
    onSuccess: () => {
      toast.success(t('common.success'));
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteTaskMutation = trpc.tasks.deleteTask.useMutation({
    onSuccess: () => {
      toast.success(t('common.deleted'));
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const tasks = sortBy === 'priority' ? sortedData?.tasks : tasksData?.tasks;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'done') {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    return <Circle className="w-5 h-5 text-gray-400" />;
  };

  const handleToggleStatus = (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    updateTaskMutation.mutate({
      taskId,
      status: newStatus as any,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('tasks.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {t('tasks.description')}
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          {t('tasks.new')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('all')}
        >
          {t('common.all')}
        </Button>
        <Button
          variant={filterStatus === 'todo' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('todo')}
        >
          {t('tasks.status.todo')}
        </Button>
        <Button
          variant={filterStatus === 'in_progress' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('in_progress')}
        >
          {t('tasks.status.inProgress')}
        </Button>
        <Button
          variant={filterStatus === 'done' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('done')}
        >
          {t('tasks.status.done')}
        </Button>
      </div>

      {/* Sort Options */}
      <div className="flex gap-2">
        <Button
          variant={sortBy === 'priority' ? 'default' : 'outline'}
          onClick={() => setSortBy('priority')}
          size="sm"
        >
          {t('tasks.sortByPriority')}
        </Button>
        <Button
          variant={sortBy === 'date' ? 'default' : 'outline'}
          onClick={() => setSortBy('date')}
          size="sm"
        >
          {t('tasks.sortByDate')}
        </Button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            {t('common.loading')}...
          </div>
        ) : tasks && tasks.length > 0 ? (
          tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleToggleStatus(task.id, task.status)}
                    className="mt-1 flex-shrink-0"
                  >
                    {getStatusIcon(task.status)}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-lg ${
                      task.status === 'done' ? 'line-through text-gray-500' : ''
                    }`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        {task.description}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Badge className={getPriorityColor(task.priority)}>
                        {t(`tasks.priority.${task.priority}`)}
                      </Badge>
                      {task.dueDate && (
                        <Badge variant="outline">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={updateTaskMutation.isPending}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTaskMutation.mutate({ taskId: task.id })}
                      disabled={deleteTaskMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">{t('tasks.empty')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
