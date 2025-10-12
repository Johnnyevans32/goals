"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Target,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreVertical,
  LogOut,
} from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import apiClient from "@/lib/api";
import {
  Goal,
  DashboardStats,
  GoalStatus,
  CreateGoalRequest,
} from "@/lib/types";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalGoals: 0,
    onTrackGoals: 0,
    offTrackGoals: 0,
    atRiskGoals: 0,
    activeActions: 0,
    completedActions: 0,
    inProgressActions: 0,
    totalActions: 0,
  });

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<CreateGoalRequest>({
    title: "",
    description: "",
    target_value: 0,
    current_value: 0,
    unit: "",
    due_date: "",
  });
  const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);

  const {
    data: statsResponse,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useAsync(() => apiClient.goals.getDashboardStats(), {
    immediate: false,
    onSuccess: (response) => {
      if (response.data) {
        setStats(response.data);
      }
    },
    onError: (error: any) => {
      toast.error("Failed to load dashboard statistics. Please try again.");
    },
  });

  const {
    data: goalsResponse,
    isLoading: goalsLoading,
    error: goalsError,
    refetch: refetchGoals,
  } = useAsync(() => apiClient.goals.getAll(), {
    immediate: false,
    onSuccess: (response) => {
      if (response.data) {
        setGoals(response.data);

        if (response.data.length > 0) {
          toast.success(
            `Dashboard loaded with ${response.data.length} goal${
              response.data.length === 1 ? "" : "s"
            }`
          );
        }
      }
    },
    onError: (error: any) => {
      toast.error("Failed to load goals. Please try again.");
    },
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    refetchStats();
    refetchGoals();
  }, [user, authLoading, router]);

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.AT_RISK:
        return "bg-red-500";
      case GoalStatus.ON_TRACK:
        return "bg-green-500";
      case GoalStatus.OFF_TRACK:
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.AT_RISK:
        return "At Risk";
      case GoalStatus.ON_TRACK:
        return "On Track";
      case GoalStatus.OFF_TRACK:
        return "Off Track";
      default:
        return "Unknown";
    }
  };

  if (authLoading || statsLoading || goalsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (statsError || goalsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Failed to Load Dashboard
            </CardTitle>
            <CardDescription>
              {statsError?.message ||
                goalsError?.message ||
                "An error occurred while loading your dashboard."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                toast.loading("Refreshing dashboard...");
                refetchStats();
                refetchGoals();
              }}
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Target className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Goals & Actions
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <Dialog
                  open={isCreateDialogOpen}
                  onOpenChange={setIsCreateDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>New Goal</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New Goal</DialogTitle>
                      <DialogDescription>
                        Set up a new goal to track your progress.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                          Title
                        </Label>
                        <Input
                          id="title"
                          value={newGoal.title}
                          onChange={(e) =>
                            setNewGoal({ ...newGoal, title: e.target.value })
                          }
                          className="col-span-3"
                          placeholder="Enter goal title"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          value={newGoal.description}
                          onChange={(e) =>
                            setNewGoal({
                              ...newGoal,
                              description: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Describe your goal"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="target" className="text-right">
                          Target
                        </Label>
                        <Input
                          id="target"
                          type="number"
                          value={newGoal.target_value}
                          onChange={(e) =>
                            setNewGoal({
                              ...newGoal,
                              target_value: Number(e.target.value),
                            })
                          }
                          className="col-span-3"
                          placeholder="Target value"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="unit" className="text-right">
                          Unit
                        </Label>
                        <Input
                          id="unit"
                          value={newGoal.unit}
                          onChange={(e) =>
                            setNewGoal({ ...newGoal, unit: e.target.value })
                          }
                          className="col-span-3"
                          placeholder="e.g., kg, hours, pages, etc."
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="due_date" className="text-right">
                          Due Date
                        </Label>
                        <DatePicker
                          date={selectedDueDate}
                          onSelect={(date) => {
                            setSelectedDueDate(date);
                            setNewGoal({ 
                              ...newGoal, 
                              due_date: date ? date.toISOString().split('T')[0] : '' 
                            });
                          }}
                          placeholder="Select due date"
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCreateDialogOpen(false);
                          setNewGoal({
                            title: "",
                            description: "",
                            target_value: 0,
                            current_value: 0,
                            unit: "",
                            due_date: "",
                          });
                          setSelectedDueDate(undefined);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          isCreating ||
                          !newGoal.title ||
                          !newGoal.target_value ||
                          !newGoal.unit
                        }
                        onClick={async () => {
                          if (
                            !newGoal.title ||
                            !newGoal.target_value ||
                            !newGoal.unit
                          ) {
                            toast.error("Please fill in all required fields");
                            return;
                          }

                          setIsCreating(true);
                          try {
                            const response = await apiClient.goals.create(
                              newGoal
                            );
                            if (response.data) {
                              toast.success("Goal created successfully!");
                              setIsCreateDialogOpen(false);
                              setNewGoal({
                                title: "",
                                description: "",
                                target_value: 0,
                                current_value: 0,
                                unit: "",
                                due_date: "",
                              });
                              setSelectedDueDate(undefined);
                              refetchStats();
                              refetchGoals();
                            } else {
                              toast.error("Failed to create goal");
                            }
                          } catch (error) {
                            toast.error("Failed to create goal");
                          } finally {
                            setIsCreating(false);
                          }
                        }}
                      >
                        {isCreating ? "Creating..." : "Create Goal"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center space-x-2"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block">{user?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => logout()}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Goals
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalGoals}</div>
                <p className="text-xs text-muted-foreground">All your goals</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">On Track</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.onTrackGoals}
                </div>
                <p className="text-xs text-muted-foreground">
                  Making good progress
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.atRiskGoals}
                </div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Off Track</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.offTrackGoals}
                </div>
                <p className="text-xs text-muted-foreground">Behind schedule</p>
              </CardContent>
            </Card>
          </div>

          {/* Action Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Actions
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalActions}</div>
                <p className="text-xs text-muted-foreground">
                  All action items
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Actions
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.activeActions}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready to work on
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  In Progress
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.inProgressActions}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently working
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.completedActions}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successfully finished
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Rate Card */}
          <div className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Overall Progress Rate
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {goals.length > 0
                    ? Math.round(
                        goals.reduce(
                          (acc, g) =>
                            acc + (g.current_value / g.target_value) * 100,
                          0
                        ) / goals.length
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  Average completion rate across all goals
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Goals</CardTitle>
                <CardDescription>
                  Track progress and manage your goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!goals || goals.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No goals yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Get started by creating your first goal
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals.map((goal) => (
                      <div
                        key={goal.id}
                        className="border rounded-lg p-6 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="font-semibold text-xl">
                                {goal.title}
                              </h3>
                              <Badge
                                variant="secondary"
                                className={`text-white font-medium ${getStatusColor(
                                  goal.status
                                )}`}
                              >
                                {getStatusLabel(goal.status)}
                              </Badge>
                            </div>

                            {goal.description && (
                              <p className="text-gray-600 mb-4">
                                {goal.description}
                              </p>
                            )}

                            {/* Progress Section */}
                            <div className="mb-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                  Progress
                                </span>
                                <div className="text-sm text-gray-600">
                                  <span className="font-semibold">
                                    {goal.current_value}
                                  </span>
                                  {goal.unit && (
                                    <span className="text-gray-500">
                                      {" "}
                                      {goal.unit}
                                    </span>
                                  )}
                                  <span className="text-gray-500"> / </span>
                                  <span className="font-semibold">
                                    {goal.target_value}
                                  </span>
                                  {goal.unit && (
                                    <span className="text-gray-500">
                                      {" "}
                                      {goal.unit}
                                    </span>
                                  )}
                                  <span className="ml-2 font-medium text-blue-600">
                                    (
                                    {Math.round(
                                      (goal.current_value / goal.target_value) *
                                        100
                                    )}
                                    %)
                                  </span>
                                </div>
                              </div>
                              <Progress
                                value={Math.round(
                                  (goal.current_value / goal.target_value) * 100
                                )}
                                className="h-2"
                              />
                            </div>

                            {/* Info Row */}
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-4">
                                {goal.due_date && (
                                  <div className="flex items-center space-x-1 text-gray-600">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                      Due:{" "}
                                      {new Date(
                                        goal.due_date
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}

                                {/* Action counts */}
                                {goal.actions && goal.actions.length > 0 && (
                                  <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-1 text-green-600">
                                      <CheckCircle className="h-4 w-4" />
                                      <span>
                                        {
                                          goal.actions.filter(
                                            (a) => a.status === "done"
                                          ).length
                                        }{" "}
                                        completed
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-1 text-blue-600">
                                      <Target className="h-4 w-4" />
                                      <span>
                                        {
                                          goal.actions.filter(
                                            (a) => a.status !== "done"
                                          ).length
                                        }{" "}
                                        open
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  toast.info(
                                    `Opening details for "${goal.title}"`
                                  );
                                  router.push(`/goals/${goal.id}`);
                                }}
                              >
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  toast.info(
                                    `Updating progress for "${goal.title}"`
                                  );
                                  router.push(`/goals/${goal.id}/update`);
                                }}
                              >
                                Update Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  toast.info(
                                    `Managing actions for "${goal.title}"`
                                  );
                                  router.push(`/goals/${goal.id}/actions`);
                                }}
                              >
                                Manage Actions
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  toast.info(
                                    `Viewing history for "${goal.title}"`
                                  );
                                  router.push(`/goals/${goal.id}/history`);
                                }}
                              >
                                View History
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
