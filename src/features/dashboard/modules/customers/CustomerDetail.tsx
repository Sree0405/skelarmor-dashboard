import { useParams } from "react-router-dom";
import { CustomerDetailView } from "./CustomerDetailView";

export const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="max-w-7xl">
        <p className="text-sm text-muted-foreground">Missing customer id.</p>
      </div>
    );
  }

  return <CustomerDetailView customerId={id} mode="admin" />;
};
