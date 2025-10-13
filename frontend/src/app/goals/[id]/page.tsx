"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useAsync } from "@/hooks/useAsync";
import apiClient from "@/lib/api";
import {
  Goal,
  Action,
  GoalUpdate,
  GoalStatus,
  ActionStatus,
  EffortLevel,
  AIActionSuggestion,
  AICheckInSummary,
} from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  MoreHorizontal,
  Calendar,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  History,
  Sparkles,
  MessageSquare,
} from "lucide-react";

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const goalId = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateData, setUpdateData] = useState({
    value: 0,
    notes: "",
  });
  const [isAISuggestionsOpen, setIsAISuggestionsOpen] = useState(false);
  const [isAICheckInOpen, setIsAICheckInOpen] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<AIActionSuggestion[]>([]);
  const [aiCheckIn, setAICheckIn] = useState<AICheckInSummary | null>(null);
  const [isEditingAICheckIn, setIsEditingAICheckIn] = useState(false);
  const [editedAICheckIn, setEditedAICheckIn] =
    useState<AICheckInSummary | null>(null);
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

  useEffect(() => {
    if (user && !authLoading && goalId) {
      fetchGoal();
    }
  }, [user, authLoading, goalId]);
  useEffect(() => {
    if (goal) {
      setUpdateData({
        value: goal.current_value,
        notes: "",
      });
    }
  }, [goal]);

  const handleUpdateProgress = async () => {
    if (!goal) return;

    if (updateData.value < 0) {
      toast.error("Progress value cannot be negative");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await apiClient.goals.createUpdate(goal.id, {
        value: updateData.value,
        notes: updateData.notes.trim() || undefined,
      });
      console.log("response data", response.data);

      if (response.data) {
        toast.success("Progress updated successfully!");
        setIsUpdateDialogOpen(false);
        setUpdateData({
          value: updateData.value,
          notes: "",
        });
        fetchGoal();
      } else {
        toast.error("Failed to update progress");
      }
    } catch (error) {
      toast.error("Failed to update progress");
      console.error("Update progress error:", error);
    } finally {
      setIsUpdating(false);
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

  const handleGetAICheckIn = async () => {
    if (!goal) return;

    setIsLoadingAI(true);
    try {
      const response = await apiClient.ai.summarizeCheckin(goal.id);
      if (response.data) {
        setAICheckIn(response.data);
        setEditedAICheckIn(response.data);
        setIsEditingAICheckIn(false);
        setIsAICheckInOpen(true);
        toast.success("AI check-in summary generated!");
      } else {
        toast.error("Failed to get AI check-in summary");
      }
    } catch (error) {
      toast.error("Failed to get AI check-in summary");
      console.error("AI check-in error:", error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleCreateActionFromAISuggestion = (
    suggestion: AIActionSuggestion
  ) => {
    const queryParams = new URLSearchParams({
      title: suggestion.title,
      description: suggestion.rationale,
      effort: suggestion.effort || "",
    });

    router.push(`/goals/${goal?.id}/actions?${queryParams.toString()}`);
    setIsAISuggestionsOpen(false);
  };

  const handleEditAICheckIn = () => {
    setIsEditingAICheckIn(true);
  };

  const handleSaveAICheckIn = () => {
    if (editedAICheckIn) {
      setAICheckIn(editedAICheckIn);
      setIsEditingAICheckIn(false);
      toast.success("Check-in summary updated!");
    }
  };

  const handleCancelEditAICheckIn = () => {
    setEditedAICheckIn(aiCheckIn);
    setIsEditingAICheckIn(false);
  };

  const handleUpdateAICheckInField = (
    field: keyof AICheckInSummary,
    value: any
  ) => {
    if (editedAICheckIn) {
      setEditedAICheckIn({
        ...editedAICheckIn,
        [field]: value,
      });
    }
  };

  const handleDeleteGoal = async () => {
    if (!goal) return;

    if (
      confirm(
        "Are you sure you want to delete this goal? This action cannot be undone."
      )
    ) {
      try {
        await apiClient.goals.delete(goal.id);
        toast.success("Goal deleted successfully");
        router.push("/dashboard");
      } catch (error) {
        toast.error("Failed to delete goal");
      }
    }
  };

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.ON_TRACK:
        return "bg-green-100 text-green-800";
      case GoalStatus.OFF_TRACK:
        return "bg-yellow-100 text-yellow-800";
      case GoalStatus.AT_RISK:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionStatusColor = (status: ActionStatus) => {
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

  const getEffortBadge = (effort: EffortLevel) => {
    const colors = {
      [EffortLevel.SMALL]: "bg-green-100 text-green-800",
      [EffortLevel.MEDIUM]: "bg-yellow-100 text-yellow-800",
      [EffortLevel.LARGE]: "bg-red-100 text-red-800",
    };
    return colors[effort] || "bg-gray-100 text-gray-800";
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

  const progressPercentage =
    goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{goal.title}</h1>
          <Badge className={getStatusColor(goal.status)}>
            {goal.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Dialog
            open={isUpdateDialogOpen}
            onOpenChange={setIsUpdateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <TrendingUp className="h-4 w-4 mr-2" />
                Update Progress
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Update Progress</DialogTitle>
                <DialogDescription>
                  Update your current progress for "{goal.title}". Current
                  value: {goal.current_value} {goal.unit || "units"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="progress-value">New Progress Value *</Label>
                  <Input
                    id="progress-value"
                    type="number"
                    min="0"
                    value={updateData.value}
                    onChange={(e) =>
                      setUpdateData((prev) => ({
                        ...prev,
                        value: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder={`Enter progress (${goal.unit || "units"})`}
                  />
                  <p className="text-xs text-gray-500">
                    Target: {goal.target_value} {goal.unit || "units"}
                  </p>
                </div>

                {/* Progress Preview */}
                {goal.target_value > 0 && (
                  <div className="space-y-2">
                    <Label>Progress Preview</Label>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">
                          {updateData.value} / {goal.target_value}
                        </span>
                        <span className="text-sm font-medium">
                          {(
                            (updateData.value / goal.target_value) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              100,
                              (updateData.value / goal.target_value) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="progress-notes">Notes (Optional)</Label>
                  <Textarea
                    id="progress-notes"
                    value={updateData.notes}
                    onChange={(e) =>
                      setUpdateData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Add any notes about this progress update..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsUpdateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateProgress} disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Update Progress"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={() => router.push(`/goals/${goal.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/goals/${goal.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Goal
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/goals/${goal.id}/history`)}
              >
                <History className="mr-2 h-4 w-4" />
                View History
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleGetAISuggestions}
                disabled={isLoadingAI}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isLoadingAI
                  ? "Getting AI Suggestions..."
                  : "Get AI Action Suggestions"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleGetAICheckIn}
                disabled={isLoadingAI}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {isLoadingAI ? "Generating Summary..." : "AI Check-in Summary"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteGoal}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Goal Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Goal Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Goal Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {goal.description && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Description
                  </h4>
                  <p className="text-gray-600">{goal.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Current Progress
                  </h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {goal.current_value}{" "}
                    {goal.unit && (
                      <span className="text-lg text-gray-600">{goal.unit}</span>
                    )}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Target</h4>
                  <p className="text-2xl font-bold text-gray-900">
                    {goal.target_value}{" "}
                    {goal.unit && (
                      <span className="text-lg text-gray-600">{goal.unit}</span>
                    )}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900">Progress</h4>
                  <span className="text-sm text-gray-600">
                    {progressPercentage.toFixed(1)}% complete
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                {goal.unit && (
                  <p className="text-xs text-gray-500 mt-1">
                    {goal.current_value} / {goal.target_value} {goal.unit}
                  </p>
                )}
              </div>

              {goal.due_date && (
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Due: {new Date(goal.due_date).toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Actions</CardTitle>
                <Button
                  size="sm"
                  onClick={() => router.push(`/goals/${goal.id}/actions`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {goal.actions && goal.actions.length > 0 ? (
                <div className="space-y-3">
                  {goal.actions.map((action: Action) => (
                    <div
                      key={action.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{action.title}</h4>
                          <Badge
                            className={getActionStatusColor(action.status)}
                          >
                            {action.status.replace("_", " ")}
                          </Badge>
                          {action.effort && (
                            <Badge
                              variant="outline"
                              className={getEffortBadge(action.effort)}
                            >
                              {action.effort}
                            </Badge>
                          )}
                        </div>
                        {action.description && (
                          <p className="text-sm text-gray-600">
                            {action.description}
                          </p>
                        )}
                        {action.due_date && (
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(action.due_date).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No actions yet. Add your first action to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Created</span>
                <span className="text-sm font-medium">
                  {new Date(goal.created_at).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="text-sm font-medium">
                  {new Date(goal.updated_at).toLocaleString()}
                </span>
              </div>
              {goal.actions && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Actions</span>
                    <span className="text-sm font-medium">
                      {goal.actions.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Completed Actions
                    </span>
                    <span className="text-sm font-medium">
                      {
                        goal.actions.filter(
                          (a) => a.status === ActionStatus.DONE
                        ).length
                      }
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Updates */}
          {goal.goal_updates && goal.goal_updates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {goal.goal_updates.slice(0, 5).map((update: GoalUpdate) => (
                    <div
                      key={update.id}
                      className="border-l-2 border-blue-200 pl-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {update.previous_value} → {update.new_value}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(update.created_at || "").toLocaleString()}
                        </span>
                      </div>
                      {update.notes && (
                        <p className="text-xs text-gray-600 mt-1">
                          {update.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* AI Action Suggestions Dialog */}
      <Dialog open={isAISuggestionsOpen} onOpenChange={setIsAISuggestionsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Action Suggestions
            </DialogTitle>
            <DialogDescription>
              Here are some AI-generated action suggestions to help you achieve
              your goal. Click "Use This Action" to create an action from any
              suggestion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {aiSuggestions.map((suggestion, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">{suggestion.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {suggestion.rationale}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {suggestion.effort && (
                          <span className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {suggestion.effort}
                            </Badge>
                            Effort Level
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleCreateActionFromAISuggestion(suggestion)
                      }
                      className="ml-4"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Use This Action
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsAISuggestionsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Check-in Summary Dialog */}
      <Dialog open={isAICheckInOpen} onOpenChange={setIsAICheckInOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI Check-in Summary
            </DialogTitle>
            <DialogDescription>
              {isEditingAICheckIn
                ? "Edit the AI-generated insights about your goal progress and recommendations."
                : "AI-generated insights about your goal progress and recommendations."}
            </DialogDescription>
          </DialogHeader>
          {editedAICheckIn && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Confidence</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditingAICheckIn ? (
                    <Textarea
                      value={editedAICheckIn.confidence}
                      onChange={(e) =>
                        handleUpdateAICheckInField("confidence", e.target.value)
                      }
                      className="min-h-[80px]"
                      placeholder="Enter confidence level..."
                    />
                  ) : (
                    <p className="text-sm">{editedAICheckIn.confidence}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Points</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditingAICheckIn ? (
                    <div className="space-y-2">
                      {editedAICheckIn.bullets.map((bullet, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <Textarea
                            value={bullet}
                            onChange={(e) => {
                              const newBullets = [...editedAICheckIn.bullets];
                              newBullets[index] = e.target.value;
                              handleUpdateAICheckInField("bullets", newBullets);
                            }}
                            className="flex-1 min-h-[60px]"
                            placeholder={`Key point ${index + 1}...`}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {editedAICheckIn.bullets.map((bullet, index) => (
                        <li
                          key={index}
                          className="text-sm flex items-start gap-2"
                        >
                          <span className="text-blue-500 mt-1">•</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditingAICheckIn ? (
                    <Select
                      value={editedAICheckIn.risk_tag}
                      onValueChange={(value) =>
                        handleUpdateAICheckInField("risk_tag", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on_track">On Track</SelectItem>
                        <SelectItem value="at_risk">At Risk</SelectItem>
                        <SelectItem value="behind">Behind</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getStatusColor(editedAICheckIn.risk_tag)}>
                      {editedAICheckIn.risk_tag.replace("_", " ").toUpperCase()}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            {isEditingAICheckIn ? (
              <>
                <Button variant="outline" onClick={handleCancelEditAICheckIn}>
                  Cancel
                </Button>
                <Button onClick={handleSaveAICheckIn}>Save Changes</Button>
              </>
            ) : (
              <>
                {/* <Button variant="outline" onClick={handleEditAICheckIn}>
                  Edit
                </Button> */}
                <Button onClick={() => setIsAICheckInOpen(false)}>Close</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
