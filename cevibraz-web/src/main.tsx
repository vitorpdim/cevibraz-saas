import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App.tsx";
import { OrcamentoPage } from "./pages/OrcamentoPage.tsx";
import { BacklogPage } from "./pages/BacklogPage.tsx";
import { MaintenancePage } from "./pages/MaintenancePage.tsx";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <OrcamentoPage />,
      },
      {
        path: "orcamento/:pedidoId", // <-- nova rota dinâmica
        element: <OrcamentoPage />,
      },
      {
        path: "backlog",
        element: <BacklogPage />,
      },
      {
        path: "molduras",
        element: <MaintenancePage />,
      },
      {
        path: "estoque",
        element: <MaintenancePage />,
      },
      {
        path: "dashboard",
        element: <MaintenancePage />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
);
