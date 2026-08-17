"use client";

import { useAuth } from "@/context/AuthContext";

/**
 * AuthLoadingGuard
 *
 * Wraps the app shell children and shows a skeleton pulse while the
 * AuthContext is performing its initial session check. This prevents a
 * flash where the TopBar briefly renders "Sign In" before realising the
 * user is already logged in.
 */
export default function AuthLoadingGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 gap-4 p-6 animate-pulse">
        {/* TopBar skeleton */}
        <div className="h-10 w-full rounded-xl skeleton-shimmer" />

        {/* Hero cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl skeleton-shimmer" />
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="h-72 rounded-2xl skeleton-shimmer mt-2" />
      </div>
    );
  }

  return <>{children}</>;
}
