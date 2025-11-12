import AdminDashboard from './pages/AdminDashboard';
import MyCourses from './pages/MyCourses';
import Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "MyCourses": MyCourses,
}

export const pagesConfig = {
    mainPage: "AdminDashboard",
    Pages: PAGES,
    Layout: Layout,
};