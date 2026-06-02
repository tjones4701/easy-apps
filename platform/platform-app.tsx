import AdminPage from "./admin-page";

export default function App() {
    const appId = window.location.pathname.split('/')[2];
    return <AdminPage appId={appId} />
}
