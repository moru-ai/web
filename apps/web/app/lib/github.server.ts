/**
 * GitHub API Server-Side Utilities
 *
 * This module provides server-side utilities for interacting with GitHub API
 * using the GitHub App authentication method via Octokit.
 *
 * IMPORTANT: This file should only be imported in server-side code (API routes, loaders, actions)
 * as it uses environment variables and server-only dependencies.
 */

import { App } from "octokit";
import type { ConvexClient } from "convex/browser";
import { api } from "@moru/convex/_generated/api";

/**
 * Get required environment variable or throw error
 */
function requiredEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env: ${name}`);
  return val;
}

/**
 * Initialize GitHub App instance with credentials from environment
 */
function initializeGitHubApp(): App {
  const appId = requiredEnv("GITHUB_APP_ID");
  const privateKey = requiredEnv("GITHUB_APP_PRIVATE_KEY").replace(/\\n/g, "\n");
  return new App({ appId, privateKey });
}

/**
 * Branch information from GitHub API
 */
export interface GitHubBranch {
  name: string;
  protected: boolean;
}

/**
 * Options for fetching branches
 */
export interface FetchBranchesOptions {
  /** Convex client instance for querying installation data */
  convexClient: ConvexClient;
  /** Repository full name in "owner/repo" format */
  repoFullName: string;
  /** Number of branches per page (default: 100) */
  perPage?: number;
}

/**
 * Fetch all branches for a repository using GitHub App authentication
 *
 * This function:
 * 1. Looks up the GitHub installation for the repository in Convex
 * 2. Authenticates with GitHub using the installation
 * 3. Fetches all branches using pagination
 * 4. Returns a simplified branch list with name and protected status
 *
 * @throws Error if repository not found, installation not connected, or GitHub API fails
 */
export async function fetchRepositoryBranches(
  options: FetchBranchesOptions
): Promise<GitHubBranch[]> {
  const { convexClient, repoFullName, perPage = 100 } = options;

  // Parse owner/repo from repo_full_name
  const parts = repoFullName.split("/");
  if (parts.length !== 2) {
    throw new Error("Invalid repo_full_name format. Expected owner/repo");
  }

  const [owner, repo] = parts;

  // Get installation by repoFullName
  const installation = await convexClient.query(api.git.getInstallationByRepoFullName, {
    repoFullName,
  });

  if (!installation) {
    throw new Error(`Repository ${repoFullName} not found or not accessible`);
  }

  if (!installation.connected) {
    throw new Error(`GitHub installation for repository ${repoFullName} is not connected`);
  }

  // Initialize GitHub App and get installation Octokit instance
  const app = initializeGitHubApp();
  const instOctokit = await app.getInstallationOctokit(Number(installation.installationId));

  // Fetch all branches using pagination
  const branches = await instOctokit.paginate(instOctokit.rest.repos.listBranches, {
    owner,
    repo,
    per_page: perPage,
  });

  // Map to simplified branch format
  return branches.map((branch) => ({
    name: branch.name,
    protected: branch.protected ?? false,
  }));
}
