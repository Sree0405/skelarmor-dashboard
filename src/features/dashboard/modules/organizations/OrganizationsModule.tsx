import { Outlet } from "react-router-dom";

/** Super-admin organizations area: nested list + `:organizationId` detail. */
export function OrganizationsModule() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <Outlet />
    </div>
  );
}
