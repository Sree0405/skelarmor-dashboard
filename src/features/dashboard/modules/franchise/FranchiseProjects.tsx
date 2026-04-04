import { useNavigate } from "react-router-dom";
import { SectionHeader } from "@/features/dashboard/components/SectionHeader";
import { useAuth } from "@/features/Login/useAuth";
import { FranchiseProjectCard } from "./components/FranchiseProjectCard";
import { useFranchiseProjectsList } from "./hooks/useFranchiseQueries";

export function FranchiseProjects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: projects = [], isLoading, isError, error, refetch } = useFranchiseProjectsList(user?.id);

  return (
    <div className="space-y-8 max-w-7xl">
      <SectionHeader
        title="Projects"
        description={
          isLoading ? "Loading your projects…" : `${projects.length} project${projects.length !== 1 ? "s" : ""} linked to your account`
        }
      />

      {isError && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load projects."}{" "}
          <button type="button" className="underline" onClick={() => void refetch()}>
            Retry
          </button>
        </p>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-52 rounded-2xl border border-border/50 bg-secondary/20 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-secondary/10 px-6 py-16 text-center text-sm text-muted-foreground">
          No projects yet. Your administrator will link projects to your account.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p, i) => (
            <FranchiseProjectCard
              key={p.id}
              project={p}
              index={i}
              onOpen={() => navigate(`/dashboard/franchise/projects/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
