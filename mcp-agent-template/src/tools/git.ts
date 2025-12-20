import { executeCommand, getRepoRoot } from "./utils.js";

interface GitDiffResult {
  files: GitFileChange[];
  summary: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
}

interface GitFileChange {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed";
  insertions: number;
  deletions: number;
  diff?: string;
}

interface GitBlameResult {
  file: string;
  lines: GitBlameLine[];
}

interface GitBlameLine {
  lineNumber: number;
  commit: string;
  author: string;
  date: string;
  content: string;
}

interface GitCommitInfo {
  hash: string;
  author: string;
  date: string;
  message: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
}

/**
 * Get git diff for a specific target (commit, branch, or file)
 */
export async function gitDiff(target: string = "HEAD"): Promise<GitDiffResult> {
  const repoRoot = await getRepoRoot();
  
  // Get diff stats
  const statsOutput = await executeCommand(`git diff --stat ${target}`, repoRoot);
  
  // Get detailed diff
  const diffOutput = await executeCommand(`git diff ${target}`, repoRoot);
  
  // Get list of changed files with numstat
  const numstatOutput = await executeCommand(`git diff --numstat ${target}`, repoRoot);
  
  const files: GitFileChange[] = [];
  let totalInsertions = 0;
  let totalDeletions = 0;
  
  // Parse numstat output
  const lines = numstatOutput.split("\n").filter(line => line.trim());
  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length >= 3) {
      const insertions = parseInt(parts[0]) || 0;
      const deletions = parseInt(parts[1]) || 0;
      const filePath = parts.slice(2).join(" ");
      
      totalInsertions += insertions;
      totalDeletions += deletions;
      
      // Determine status
      let status: GitFileChange["status"] = "modified";
      if (insertions > 0 && deletions === 0) status = "added";
      else if (insertions === 0 && deletions > 0) status = "deleted";
      
      files.push({
        path: filePath,
        status,
        insertions,
        deletions,
      });
    }
  }
  
  return {
    files,
    summary: {
      filesChanged: files.length,
      insertions: totalInsertions,
      deletions: totalDeletions,
    },
  };
}

/**
 * Get git blame for a specific file
 */
export async function gitBlame(file: string, startLine?: number, endLine?: number): Promise<GitBlameResult> {
  const repoRoot = await getRepoRoot();
  
  let command = `git blame --line-porcelain "${file}"`;
  if (startLine && endLine) {
    command += ` -L ${startLine},${endLine}`;
  }
  
  const output = await executeCommand(command, repoRoot);
  const lines: GitBlameLine[] = [];
  
  // Parse porcelain format
  const blameLines = output.split("\n");
  let currentCommit = "";
  let currentAuthor = "";
  let currentDate = "";
  let lineNumber = 0;
  
  for (let i = 0; i < blameLines.length; i++) {
    const line = blameLines[i];
    
    if (line.match(/^[0-9a-f]{40}/)) {
      // New commit line
      const parts = line.split(" ");
      currentCommit = parts[0].substring(0, 8);
      lineNumber = parseInt(parts[2]);
    } else if (line.startsWith("author ")) {
      currentAuthor = line.substring(7);
    } else if (line.startsWith("author-time ")) {
      const timestamp = parseInt(line.substring(12));
      currentDate = new Date(timestamp * 1000).toISOString().split("T")[0];
    } else if (line.startsWith("\t")) {
      // Content line
      lines.push({
        lineNumber,
        commit: currentCommit,
        author: currentAuthor,
        date: currentDate,
        content: line.substring(1),
      });
    }
  }
  
  return {
    file,
    lines,
  };
}

/**
 * Get git log for the repository or a specific file
 */
export async function gitLog(file?: string, limit: number = 10): Promise<GitCommitInfo[]> {
  const repoRoot = await getRepoRoot();
  
  let command = `git log --pretty=format:"%H|%an|%ad|%s" --date=short --shortstat -n ${limit}`;
  if (file) {
    command += ` -- "${file}"`;
  }
  
  const output = await executeCommand(command, repoRoot);
  const commits: GitCommitInfo[] = [];
  
  const lines = output.split("\n");
  let i = 0;
  
  while (i < lines.length) {
    const commitLine = lines[i];
    if (!commitLine) {
      i++;
      continue;
    }
    
    const parts = commitLine.split("|");
    if (parts.length < 4) {
      i++;
      continue;
    }
    
    const hash = parts[0];
    const author = parts[1];
    const date = parts[2];
    const message = parts[3];
    
    // Next line should be stats (if exists)
    i++;
    let filesChanged = 0;
    let insertions = 0;
    let deletions = 0;
    
    if (i < lines.length && lines[i].includes("changed")) {
      const statsLine = lines[i];
      const filesMatch = statsLine.match(/(\d+)\s+files?\s+changed/);
      const insertMatch = statsLine.match(/(\d+)\s+insertions?\(\+\)/);
      const deleteMatch = statsLine.match(/(\d+)\s+deletions?\(-\)/);
      
      if (filesMatch) filesChanged = parseInt(filesMatch[1]);
      if (insertMatch) insertions = parseInt(insertMatch[1]);
      if (deleteMatch) deletions = parseInt(deleteMatch[1]);
      i++;
    }
    
    commits.push({
      hash: hash.substring(0, 8),
      author,
      date,
      message,
      filesChanged,
      insertions,
      deletions,
    });
    
    // Skip empty line
    if (i < lines.length && !lines[i]) {
      i++;
    }
  }
  
  return commits;
}

/**
 * Get changed files in current working directory
 */
export async function gitStatus(): Promise<any> {
  const repoRoot = await getRepoRoot();
  
  const output = await executeCommand("git status --porcelain", repoRoot);
  const files: any[] = [];
  
  const lines = output.split("\n").filter(line => line.trim());
  for (const line of lines) {
    if (line.length < 4) continue;
    
    const status = line.substring(0, 2).trim();
    const filePath = line.substring(3);
    
    let statusText = "modified";
    if (status === "A" || status === "??") statusText = "added";
    else if (status === "D") statusText = "deleted";
    else if (status === "R") statusText = "renamed";
    else if (status === "M") statusText = "modified";
    
    files.push({
      path: filePath,
      status: statusText,
      staged: status[0] !== "?" && status[0] !== " ",
    });
  }
  
  return {
    files,
    clean: files.length === 0,
    totalFiles: files.length,
    staged: files.filter(f => f.staged).length,
    unstaged: files.filter(f => !f.staged).length,
  };
}

/**
 * Get recent commits that modified a specific package
 */
export async function getPackageHistory(packageName: string, limit: number = 10): Promise<GitCommitInfo[]> {
  const repoRoot = await getRepoRoot();
  const packagePath = `packages/${packageName}`;
  
  return await gitLog(packagePath, limit);
}

/**
 * Get contributors for a package
 */
export async function getPackageContributors(packageName: string): Promise<any[]> {
  const repoRoot = await getRepoRoot();
  const packagePath = `packages/${packageName}`;
  
  const output = await executeCommand(
    `git log --pretty=format:"%an|%ae" -- "${packagePath}" | sort | uniq`,
    repoRoot
  );
  
  const contributors: any[] = [];
  const lines = output.split("\n").filter(line => line.trim());
  
  for (const line of lines) {
    const parts = line.split("|");
    if (parts.length >= 2) {
      contributors.push({
        name: parts[0],
        email: parts[1],
      });
    }
  }
  
  return contributors;
}
