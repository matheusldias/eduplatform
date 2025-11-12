import AdminDashboard from './pages/AdminDashboard';
import MyCourses from './pages/MyCourses';
import ManageCourse from './pages/ManageCourse';
import CourseDetail from './pages/CourseDetail';
import Player from './pages/Player';
import Certificates from './pages/Certificates';
import Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "MyCourses": MyCourses,
    "ManageCourse": ManageCourse,
    "CourseDetail": CourseDetail,
    "Player": Player,
    "Certificates": Certificates,
}

export const pagesConfig = {
    mainPage: "AdminDashboard",
    Pages: PAGES,
    Layout: Layout,
};