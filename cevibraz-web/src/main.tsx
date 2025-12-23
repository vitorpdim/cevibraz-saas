import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App.tsx";
import { OrcamentoPage } from "./pages/OrcamentoPage.tsx";
import { BacklogPage } from "./pages/BacklogPage.tsx";
import { MaintenancePage } from "./pages/MaintenancePage.tsx";
import { MoldurasPage } from "./pages/MoldurasPage.tsx";
import { MateriaisPage } from "./pages/MateriaisPage.tsx";
import { EstoquePage } from "./pages/EstoquePage.tsx";
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
        element: <MoldurasPage />,
      },
      {
        path: "materiais",
        element: <MateriaisPage />,
      },
      {
        path: "estoque",
        element: <EstoquePage />,
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
