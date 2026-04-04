export { GymSetupModule } from "./GymSetupModule";
export { ProjectListPage } from "./pages/ProjectListPage";
export { ProjectCreatePage } from "./pages/ProjectCreatePage";
export { ProjectDetailPage } from "./pages/ProjectDetailPage";
export {
  useProjectsList,
  useProject,
  useProjectPayments,
  useProjectsByClient,
  useCreateProject,
  useUpdateProject,
  useAddProjectPayment,
  useAllProjectContextPayments,
  useFranchiseUsers,
  projectKeys,
} from "./hooks/useProjectQueries";
export { gymProjectService } from "./services/projectService";
export { normalizeProject, normalizeProjectPayment } from "./services/projectService";
