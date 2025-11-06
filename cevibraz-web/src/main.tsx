import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App.tsx";
import { OrcamentoPage } from "./pages/OrcamentoPage.tsx";
import { BacklogPage } from "./pages/BacklogPage.tsx";

import "./bootstrap.min.css";
import "./style.css";

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
        path: "backlog",
        element: <BacklogPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
