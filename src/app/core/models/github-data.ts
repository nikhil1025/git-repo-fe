export interface Organization {
  _id: string;
  integrationId: string;
  githubId: number;
  login: string;
  name: string;
  description: string;
  html_url: string;
  avatar_url: string;
  public_repos: number;
}

export interface Repository {
  _id: string;
  integrationId: string;
  organizationId: string;
  githubId: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  private: boolean;
  stargazers_count: number;
  language: string;
  default_branch: string;
}

export interface Commit {
  _id: string;
  integrationId: string;
  repositoryId: string;
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: Date;
  };
  html_url: string;
}

export interface PullRequest {
  _id: string;
  integrationId: string;
  repositoryId: string;
  githubId: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: Date;
  user: {
    login: string;
    id: number;
  };
  merged: boolean;
}

export interface Issue {
  _id: string;
  integrationId: string;
  repositoryId: string;
  githubId: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: Date;
  user: {
    login: string;
    id: number;
  };
}

export interface IssueChangelog {
  _id: string;
  integrationId: string;
  repositoryId: string;
  issueId: string;
  event: string;
  created_at: Date;
  actor: {
    login: string;
    id: number;
  };
}

export interface User {
  _id: string;
  integrationId: string;
  organizationId: string;
  githubId: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  html_url: string;
}

export type GithubDataType =
  | Organization
  | Repository
  | Commit
  | PullRequest
  | Issue
  | IssueChangelog
  | User;
