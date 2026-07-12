import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Households from './pages/Households/Households';
import AddHousehold from './pages/Households/AddHousehold';
import TdsReadings from './pages/TdsReadings/TdsReadings';
import AddTdsReading from './pages/TdsReadings/AddTdsReading';
import Reports from './pages/Reports';
import SubmitReport from './pages/SubmitReport';
import Analytics from './pages/Analytics';
import AdminPanel from './pages/AdminPanel';
import AddUser from './pages/AddUser';
import AuditTrail from './pages/AuditTrail';
import Profile from './pages/Profile';
import RoleBasedRoute from './components/RoleBasedRoute';
import HouseholdDetail from './pages/Households/HouseholdDetail';
import TdsDetail from './pages/TdsReadings/TdsDetail';
import ReportDetail from './pages/ReportDetail';
import EditUser from './pages/EditUser';
import ForgotPass from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { Toaster } from '@/components/ui/sonner';
import Landing from './pages/Landing';
import ConcernDetail from './pages/ConcernDetail';
import UserDetail from './pages/UserDetail';


const App = () => {
    return (
        <>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />

                {/* Dashboard - All roles */}
                <Route path="/dashboard" element={<RoleBasedRoute><Dashboard /></RoleBasedRoute>} />

                {/* Households - Admin and Staff */}
                <Route path="/households" element={<RoleBasedRoute allowedRoles={['admin', 'staff']}><Households /></RoleBasedRoute>} />
                <Route path="/households/add" element={<RoleBasedRoute allowedRoles={['admin', 'staff']}><AddHousehold /></RoleBasedRoute>} />

                {/* TDS Readings - Admin and Staff */}
                <Route path="/tds" element={<RoleBasedRoute allowedRoles={['admin', 'staff']}><TdsReadings /></RoleBasedRoute>} />
                <Route path="/tds/add" element={<RoleBasedRoute allowedRoles={['admin', 'staff']}><AddTdsReading /></RoleBasedRoute>} />

                {/* Reports - All roles (but with different views based on role) */}
                <Route path="/reports" element={<RoleBasedRoute><Reports /></RoleBasedRoute>} />
                <Route path="/reports/add" element={<RoleBasedRoute allowedRoles={['resident']}><SubmitReport /></RoleBasedRoute>} />

                {/* Analytics - Admin and Staff */}
                <Route path="/analytics" element={<RoleBasedRoute allowedRoles={['admin', 'staff']}><Analytics /></RoleBasedRoute>} />

                {/* Admin Panel - Admin only */}
                <Route path="/admin" element={<RoleBasedRoute allowedRoles={['admin']}><AdminPanel /></RoleBasedRoute>} />
                <Route path="/admin/add-user" element={<RoleBasedRoute allowedRoles={['admin']}><AddUser /></RoleBasedRoute>} />

                {/* Audit Trail - Admin only */}
                <Route path="/audit-trail" element={<RoleBasedRoute allowedRoles={['admin']}><AuditTrail /></RoleBasedRoute>} />
                <Route path="/audit-trail" element={<RoleBasedRoute allowedRoles={['admin']}><AuditTrail /></RoleBasedRoute>} />
                <Route path="/admin/users/:id" element={<RoleBasedRoute allowedRoles={['admin']}><UserDetail /></RoleBasedRoute>} />
                <Route path="/profile" element={<RoleBasedRoute><Profile /></RoleBasedRoute>} />


                <Route path="/households/:id" element={<RoleBasedRoute allowedRoles={['admin', 'staff']}><HouseholdDetail /></RoleBasedRoute>} />
                <Route path="/reports/:id" element={<RoleBasedRoute><ReportDetail /></RoleBasedRoute>} />
                <Route path="/tds/:id" element={<RoleBasedRoute allowedRoles={['admin', 'staff']}><TdsDetail /></RoleBasedRoute>} />
                <Route path="/admin/edit-user/:id" element={<RoleBasedRoute allowedRoles={['admin']}><EditUser /></RoleBasedRoute>} />
                <Route path="/admin/concerns/:id" element={<RoleBasedRoute allowedRoles={['admin', 'staff']}><ConcernDetail /></RoleBasedRoute>} />
                <Route path="/forgot-password" element={<ForgotPass />} />
                <Route path="/reset-password" element={<ResetPassword />} />

            </Routes>
            <Toaster position="top-right" richColors />
        </>
    )
}

export default App;
