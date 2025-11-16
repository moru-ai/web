/**
 * GitHub API Client Functions
 *
 * Client-side utilities for fetching GitHub data through our API routes.
 * These functions are used with TanStack Query for caching and state management.
 */

export interface Branch {
  name: string;
  protected: boolean;
}

export interface FetchBranchesResponse {
  branches: Branch[];
}

export interface FetchBranchesErrorResponse {
  error: string;
}

/**
 * Fetch branches for a repository through our API route
 *
 * @param repoFullName - Repository full name in "owner/repo" format
 * @returns Promise with branches data
 * @throws Error if the request fails
 */
export async function fetchBranches(repoFullName: string): Promise<FetchBranchesResponse> {
  const response = await fetch(
    `/api/github/branches?repo_full_name=${encodeURIComponent(repoFullName)}`,
  );

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as FetchBranchesErrorResponse;
    throw new Error(errorData.error || "Failed to fetch branches");
  }

  return await response.json();
}
