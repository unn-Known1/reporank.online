import Link from "next/link";
import { getRepoByOwnerName } from "@/lib/db/repos";
import { getLatestScore } from "@/lib/db/scores";

interface RepoReferenceCardProps {
  owner: string;
  name: string;
}

function getGrade(score: number): string {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  if (score >= 30) return "D";
  return "F";
}

export default async function RepoReferenceCard({ owner, name }: RepoReferenceCardProps) {
  const repoPath = `/github/${owner}/${name}`;
  const repo = await getRepoByOwnerName(owner, name).catch(() => null);
  const scoreRow = repo ? await getLatestScore(repo.id).catch(() => null) : null;
  const score = scoreRow?.total_score != null ? Math.round(scoreRow.total_score) : null;
  const grade = score != null ? getGrade(score) : null;

  return (
    <Link href={repoPath} className="repo-card no-underline">
      <div className="repo-card-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="repo-card-name">{owner}/{name}</div>
        <div className="repo-card-action">
          {score != null ? `Score: ${score}/100 (${grade})` : "View repository score →"}
        </div>
      </div>
    </Link>
  );
}
