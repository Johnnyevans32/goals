"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import apiClient from "@/lib/api";
import { Goal, GoalUpdate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, TrendingUp, FileText } from "lucide-react";
import { toast } from "sonner";

export default function GoalHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const goalId = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [updates, setUpdates] = useState<GoalUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoalAndUpdates = async () => {
    if (!goalId) return;

    setLoading(true);
    setError(null);

    try {
      const goalResponse = await apiClient.goals.getById(Number(goalId));
      if (goalResponse.data) {
        setGoal(goalResponse.data);
      }

      const updatesResponse = await apiClient.goals.getUpdates(goalId);
      if (updatesResponse.data) {
        const sortedUpdates = updatesResponse.data.sort(
          (a: GoalUpdate, b: GoalUpdate) =>
            new Date(b.created_at!).getTime() -
            new Date(a.created_at!).getTime()
        );
        setUpdates(sortedUpdates);
      }
    } catch (error) {
      console.error("Error fetching goal history:", error);
      setError("Failed to load goal history");
      toast.error("Failed to load goal history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading && goalId) {
      fetchGoalAndUpdates();
    }
  }, [user, authLoading, goalId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error || "Could not retrieve goal history"}
          </p>
          <Button onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/goals/${goalId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Goal
          </Button>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Update History
            </h1>
            <h2 className="text-lg text-gray-700 mb-4">{goal.title}</h2>

            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>
                Current: {goal.current_value} {goal.unit || "units"}
              </span>
              <span>•</span>
              <span>
                Target: {goal.target_value} {goal.unit || "units"}
              </span>
              <span>•</span>
              <span>
                Progress:{" "}
                {((goal.current_value / goal.target_value) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Updates List */}
        <div className="space-y-4">
          {updates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Updates Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  This goal hasn't been updated yet. Start tracking progress to
                  see history here.
                </p>
                <Button onClick={() => router.push(`/goals/${goalId}`)}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Update Progress
                </Button>
              </CardContent>
            </Card>
          ) : (
            updates.map((update, index) => (
              <Card
                key={update.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(update.created_at || "")}
                      </span>
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Latest
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Previous Value
                      </h4>
                      <p className="text-lg font-semibold text-gray-900">
                        {update.previous_value}{" "}
                        {goal.unit && (
                          <span className="text-sm text-gray-600">
                            {goal.unit}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        New Value
                      </h4>
                      <p className="text-lg font-semibold text-blue-600">
                        {update.new_value}{" "}
                        {goal.unit && (
                          <span className="text-sm text-gray-600">
                            {goal.unit}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Change
                      </h4>
                      <p
                        className={`text-lg font-semibold ${
                          update.new_value > update.previous_value
                            ? "text-green-600"
                            : update.new_value < update.previous_value
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {update.new_value > update.previous_value ? "+" : ""}
                        {(update.new_value - update.previous_value).toFixed(
                          2
                        )}{" "}
                        {goal.unit && (
                          <span className="text-sm text-gray-600">
                            {goal.unit}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {update.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {update.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
