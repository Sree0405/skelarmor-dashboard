import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { bootstrapAuthFromStorage } from "@/features/Login/store";

void bootstrapAuthFromStorage().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
