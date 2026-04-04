import { Outlet } from "react-router-dom";

/** Admin gym setup area: nested routes (list, new, :projectId). */
export const GymSetupModule = () => (
  <div className="max-w-7xl mx-auto w-full">
    <Outlet />
  </div>
);
