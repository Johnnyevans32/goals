"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useAsync } from "@/hooks/useAsync";
import apiClient from "@/lib/api";
import {
  Goal,
  Action,
  ActionStatus,
  EffortLevel,
  CreateActionRequest,
  AIActionSuggestion,
} from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Target,
  Zap,
  Search,
  Filter,
  Sparkles,
  Trash2,
} from "lucide-react";

export default function ActionsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const goalId = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<ActionStatus | "all">("all");
  const [dueSoonFilter, setDueSoonFilter] = useState(false);
  const [newAction, setNewAction] = useState<CreateActionRequest>({
    title: "",
    description: "",
    effort: EffortLevel.MEDIUM,
    due_date: "",
  });
  const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>(
    undefined
  );
  const [aiSuggestions, setAISuggestions] = useState<AIActionSuggestion[]>([]);
  const [isAISuggestionsOpen, setIsAISuggestionsOpen] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const {
    data: goalData,
    isLoading: goalLoading,
    error: goalError,
    execute: fetchGoal,
  } = useAsync(() => apiClient.goals.getById(Number(goalId)), {
    immediate: false,
    onSuccess: (response) => {
      if (response.data) {
        setGoal(response.data);
      }
    },
    onError: (error) => {
      toast.error("Failed to load goal details");
      console.error("Goal fetch error:", error);
    },
  });

  const {
    data: actionsData,
    isLoading: actionsLoading,
    error: actionsError,
    execute: fetchActions,
  } = useAsync(() => apiClient.actions.getByGoalId(Number(goalId)), {
    immediate: false,
    onSuccess: (response) => {
      if (response.data) {
        setActions(response.data);
      }
    },
    onError: (error) => {
      toast.error("Failed to load actions");
      console.error("Actions fetch error:", error);
    },
  });

  useEffect(() => {
    if (user && !authLoading && goalId) {
      fetchGoal();
      fetchActions();
    }
  }, [user, authLoading, goalId]);

  useEffect(() => {
    const title = searchParams.get("title");
    const description = searchParams.get("description");
    const effort = searchParams.get("effort");

    if (title || description || effort) {
      setNewAction({
        title: title || "",
        description: description || "",
        effort: (effort as EffortLevel) || EffortLevel.MEDIUM,
        due_date: "",
      });
      setIsCreateDialogOpen(true);
    }
  }, [searchParams]);

  const filteredActions = useMemo(() => {
    let filtered = actions;

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (action) =>
          action.title.toLowerCase().includes(searchLower) ||
          (action.description &&
            action.description.toLowerCase().includes(searchLower))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((action) => action.status === statusFilter);
    }

    if (dueSoonFilter) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      filtered = filtered.filter((action) => {
        if (!action.due_date) return false;
        const dueDate = new Date(action.due_date);
        return dueDate <= sevenDaysFromNow && dueDate >= new Date();
      });
    }

    return filtered;
  }, [actions, searchText, statusFilter, dueSoonFilter]);

  const handleCreateAction = async () => {
    if (!newAction.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsCreating(true);
    try {
      const actionData = {
        ...newAction,
        title: newAction.title.trim(),
        description: newAction.description?.trim() || undefined,
        due_date: newAction.due_date || undefined,
        goal_id: Number(goalId),
      };

      const response = await apiClient.actions.create(
        Number(goalId),
        actionData
      );

      if (response.data) {
        toast.success("Action created successfully!");
        setIsCreateDialogOpen(false);
        setNewAction({
          title: "",
          description: "",
          effort: EffortLevel.MEDIUM,
          due_date: "",
        });
        setSelectedDueDate(undefined);
        fetchActions();
      } else {
        toast.error("Failed to create action");
      }
    } catch (error) {
      toast.error("Failed to create action");
      console.error("Create action error:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleGetAISuggestions = async () => {
    if (!goal) return;

    setIsLoadingAI(true);
    try {
      const response = await apiClient.ai.suggestActions(goal.id);
      if (response.data) {
        setAISuggestions(response.data);
        setIsAISuggestionsOpen(true);
        toast.success("AI suggestions generated!");
      } else {
        toast.error("Failed to get AI suggestions");
      }
    } catch (error) {
      toast.error("Failed to get AI suggestions");
      console.error("AI suggestions error:", error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleCreateActionFromAISuggestion = (
    suggestion: AIActionSuggestion
  ) => {
    setNewAction({
      title: suggestion.title,
      description: suggestion.rationale,
      effort: suggestion.effort as EffortLevel,
      due_date: "",
    });
    setSelectedDueDate(undefined);
    setIsAISuggestionsOpen(false);
    setIsCreateDialogOpen(true);
  };

  const handleUpdateActionStatus = async (
    actionId: number,
    status: ActionStatus
  ) => {
    try {
      const response = await apiClient.actions.update(
        Number(goalId),
        actionId,
        { status }
      );

      if (response.data) {
        toast.success("Action status updated!");
        fetchActions();
      } else {
        toast.error("Failed to update action status");
      }
    } catch (error) {
      toast.error("Failed to update action status");
      console.error("Update action error:", error);
    }
  };

  const handleDeleteAction = async (actionId: number) => {
    if (
      confirm(
        "Are you sure you want to delete this action? This action cannot be undone."
      )
    ) {
      try {
        const response = await apiClient.actions.delete(
          Number(goalId),
          actionId
        );

        if (response.message) {
          toast.success("Action deleted successfully!");
          fetchActions();
        } else {
          toast.error("Failed to delete action");
        }
      } catch (error) {
        toast.error("Failed to delete action");
        console.error("Delete action error:", error);
      }
    }
  };

  const getStatusIcon = (status: ActionStatus) => {
    switch (status) {
      case ActionStatus.DONE:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case ActionStatus.IN_PROGRESS:
        return <Clock className="h-4 w-4 text-blue-600" />;
      case ActionStatus.TODO:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: ActionStatus) => {
    switch (status) {
      case ActionStatus.DONE:
        return "bg-green-100 text-green-800";
      case ActionStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800";
      case ActionStatus.TODO:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEffortLevelColor = (level: EffortLevel) => {
    switch (level) {
      case EffortLevel.SMALL:
        return "bg-green-100 text-green-800";
      case EffortLevel.MEDIUM:
        return "bg-yellow-100 text-yellow-800";
      case EffortLevel.LARGE:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (authLoading || goalLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (goalError || !goal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Could not retrieve goal
          </h1>
          <p className="text-gray-600 mb-4">
            An error occurred while retrieving the goal. Please try again.
          </p>
          <Button onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/goals/${goalId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Goal
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Actions</h1>
            <p className="text-gray-600">{goal.title}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleGetAISuggestions}
            disabled={isLoadingAI}
          >
            {isLoadingAI ? (
              <>
                <LoadingSpinner className="h-4 w-4 mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                AI Suggestions
              </>
            )}
          </Button>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Action
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Action</DialogTitle>
                <DialogDescription>
                  Add a new action to help achieve your goal.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="action-title">Title *</Label>
                  <Input
                    id="action-title"
                    value={newAction.title}
                    onChange={(e) =>
                      setNewAction((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Enter action title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action-description">Description</Label>
                  <Textarea
                    id="action-description"
                    value={newAction.description}
                    onChange={(e) =>
                      setNewAction((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe the action (optional)"
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="effort-level">Effort Level</Label>
                  <Select
                    value={newAction.effort}
                    onValueChange={(value: EffortLevel) =>
                      setNewAction((prev) => ({ ...prev, effort: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select effort level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EffortLevel.SMALL}>Small</SelectItem>
                      <SelectItem value={EffortLevel.MEDIUM}>Medium</SelectItem>
                      <SelectItem value={EffortLevel.LARGE}>Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action-due-date">Due Date</Label>
                  <DatePicker
                    date={selectedDueDate}
                    onSelect={(date) => {
                      setSelectedDueDate(date);
                      setNewAction((prev) => ({
                        ...prev,
                        due_date: date ? date.toISOString().split("T")[0] : "",
                      }));
                    }}
                    placeholder="Select due date"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateAction} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Action"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search actions by title or description..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onValueChange={(value: ActionStatus | "all") =>
                setStatusFilter(value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={ActionStatus.TODO}>To Do</SelectItem>
                <SelectItem value={ActionStatus.IN_PROGRESS}>
                  In Progress
                </SelectItem>
                <SelectItem value={ActionStatus.DONE}>Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Soon Filter */}
          <div className="flex items-center space-x-2">
            <Button
              variant={dueSoonFilter ? "default" : "outline"}
              size="sm"
              onClick={() => setDueSoonFilter(!dueSoonFilter)}
              className="whitespace-nowrap"
            >
              <Filter className="h-4 w-4 mr-2" />
              Due Soon
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchText || statusFilter !== "all" || dueSoonFilter) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Active filters:</span>
            {searchText && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Search: "{searchText}"
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Status: {statusFilter.replace("_", " ")}
              </span>
            )}
            {dueSoonFilter && (
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                Due Soon
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchText("");
                setStatusFilter("all");
                setDueSoonFilter(false);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Actions List */}
      <div className="space-y-4">
        {actionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : filteredActions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {actions.length === 0 ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Actions Yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start by creating your first action to work towards your
                    goal.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Action
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Actions Found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    No actions match your current search and filter criteria.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchText("");
                      setStatusFilter("all");
                      setDueSoonFilter(false);
                    }}
                  >
                    Clear Filters
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredActions.map((action) => (
            <Card key={action.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    {action.description && (
                      <CardDescription className="mt-1">
                        {action.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {getStatusIcon(action.status)}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        action.status
                      )}`}
                    >
                      {action.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Zap className="h-4 w-4" />
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getEffortLevelColor(
                          action.effort || EffortLevel.MEDIUM
                        )}`}
                      >
                        {(action.effort || EffortLevel.MEDIUM).toUpperCase()}
                      </span>
                    </div>
                    {action.due_date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Due: {new Date(action.due_date).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {action.status !== ActionStatus.DONE && (
                      <>
                        {action.status === ActionStatus.TODO && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUpdateActionStatus(
                                action.id,
                                ActionStatus.IN_PROGRESS
                              )
                            }
                          >
                            Start
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() =>
                            handleUpdateActionStatus(
                              action.id,
                              ActionStatus.DONE
                            )
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      </>
                    )}
                    {action.status === ActionStatus.DONE && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleUpdateActionStatus(
                            action.id,
                            ActionStatus.IN_PROGRESS
                          )
                        }
                      >
                        Reopen
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteAction(action.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {actions.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">To Do</p>
                  <p className="text-2xl font-bold">
                    {
                      actions.filter((a) => a.status === ActionStatus.TODO)
                        .length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold">
                    {
                      actions.filter(
                        (a) => a.status === ActionStatus.IN_PROGRESS
                      ).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">
                    {
                      actions.filter((a) => a.status === ActionStatus.DONE)
                        .length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Suggestions Dialog */}
      <Dialog open={isAISuggestionsOpen} onOpenChange={setIsAISuggestionsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>AI Action Suggestions</DialogTitle>
            <DialogDescription>
              Here are some AI-generated action suggestions based on your goal.
              Click "Use This Action" to prefill the create form with a
              suggestion.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[400px] overflow-y-auto">
            {aiSuggestions.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No AI suggestions available.</p>
              </div>
            ) : (
              aiSuggestions.map((suggestion, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {suggestion.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {suggestion.rationale}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getEffortLevelColor(
                            suggestion.effort as EffortLevel
                          )}`}
                        >
                          {suggestion.effort?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleCreateActionFromAISuggestion(suggestion)
                      }
                      className="ml-4"
                    >
                      Use This Action
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAISuggestionsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
