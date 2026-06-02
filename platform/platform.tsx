import "./index.scss";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./platform-app";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
