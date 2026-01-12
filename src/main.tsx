import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/clear-session"; // Make clearAuthSession available globally

createRoot(document.getElementById("root")!).render(<App />);
