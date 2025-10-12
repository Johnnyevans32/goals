"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useAsync } from "@/hooks/useAsync";
import apiClient from "@/lib/api";
import { Goal, GoalStatus } from "@/lib/types";
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
import { toast } from "sonner";
import { ArrowLeft, Save, X } from "lucide-react";

export default function EditGoalPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const goalId = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_value: 0,
    due_date: "",
  });
  const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const {
    data: goalData,
    isLoading: goalLoading,
    error: goalError,
    execute: fetchGoal,
  } = useAsync(() => apiClient.goals.getById(Number(goalId)), {
    immediate: false,
    onSuccess: (response) => {
      if (response.data) {
        const goalData = response.data;
        setGoal(goalData);
        setFormData({
          title: goalData.title,
          description: goalData.description || "",
          target_value: goalData.target_value,
          due_date: goalData.due_date ? goalData.due_date.split("T")[0] : "",
        });
        if (goalData.due_date) {
          setSelectedDueDate(new Date(goalData.due_date));
        }
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

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!goal) return;

    setFormData((prev) => ({
      ...prev,
      target_value: Number(prev.target_value),
    }));

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (formData.target_value <= 0) {
      toast.error("Target value must be greater than 0");
      return;
    }

    setIsSaving(true);
    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        target_value: formData.target_value,
        due_date: formData.due_date || undefined,
      };

      const response = await apiClient.goals.update(goal.id, updateData);

      if (response.data) {
        toast.success("Goal updated successfully!");
        router.push(`/goals/${goal.id}`);
      } else {
        toast.error("Failed to update goal");
      }
    } catch (error) {
      toast.error("Failed to update goal");
      console.error("Update error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/goals/${goalId}`);
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
            Goal Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The goal you're trying to edit doesn't exist or you don't have
            permission to edit it.
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
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Goal</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Goal Details</CardTitle>
            <CardDescription>
              Update your goal information and progress.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter goal title"
                className="w-full"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your goal (optional)"
                className="w-full min-h-[100px]"
              />
            </div>

            {/* Progress Values */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_value">Target Value *</Label>
                <Input
                  id="target_value"
                  type="number"
                  min="0.01"
                  value={formData.target_value}
                  onChange={(e) =>
                    handleInputChange("target_value", Number(e.target.value))
                  }
                  placeholder="Target to achieve"
                  className="w-full"
                />
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <DatePicker
                date={selectedDueDate}
                onSelect={(date) => {
                  setSelectedDueDate(date);
                  setFormData({ 
                    ...formData, 
                    due_date: date ? date.toISOString().split('T')[0] : '' 
                  });
                }}
                placeholder="Select due date"
                className="w-full"
              />
            </div>

            {/* Current Status Display */}
            <div className="space-y-2">
              <Label>Current Status</Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      goal.status === GoalStatus.ON_TRACK
                        ? "bg-green-100 text-green-800"
                        : goal.status === GoalStatus.AT_RISK
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {goal.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Status is automatically calculated based on your progress
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
