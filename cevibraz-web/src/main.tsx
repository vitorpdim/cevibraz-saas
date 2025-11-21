import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App.tsx";
import { OrcamentoPage } from "./pages/OrcamentoPage.tsx";
import { BacklogPage } from "./pages/BacklogPage.tsx";
import { MaintenancePage } from "./pages/MaintenancePage.tsx";
// 1. IMPORTAÇÃO NOVA
import { MoldurasPage } from "./pages/MoldurasPage.tsx";
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
        path: "orcamento/:pedidoId",
        element: <OrcamentoPage />,
      },
      {
        path: "backlog",
        element: <BacklogPage />,
      },
      {
        path: "molduras",
        // 2. SUBSTITUIÇÃO AQUI: A página real entra em ação
        element: <MoldurasPage />,
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
