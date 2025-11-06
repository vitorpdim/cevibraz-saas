import React from "react";
import { Link } from "react-router-dom";

export const Header: React.FC = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        {/* 2. link p home */}
        <Link className="navbar-brand" to="/">
          Cevibraz SaaS v2.0
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              {/* 3. link p orçamento */}
              <Link className="nav-link" to="/">
                Orçamento
              </Link>
            </li>
            <li className="nav-item">
              {/* 4. link p backlog */}
              <Link className="nav-link" to="/backlog">
                Backlog
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
