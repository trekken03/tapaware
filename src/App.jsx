import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Households = lazy(() => import('./pages/Households/Households'));
const AddHousehold = lazy(() => import('./pages/Households/AddHousehold'));
const TdsReadings = lazy(() => import('./pages/TdsReadings/TdsReadings'));
const AddTdsReading = lazy(() => import('./pages/TdsReadings/AddTdsReading'));
const Reports = lazy(() => import('./pages/Reports'));
const SubmitReport = lazy(() => import('./pages/SubmitReport'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const AddUser = lazy(() => import('./pages/AddUser'));
const AuditTrail = lazy(() => import('./pages/AuditTrail'));
const Profile = lazy(() => import('./pages/Profile'));
const RoleBasedRoute = lazy(() => import('./components/RoleBasedRoute'));
const HouseholdDetail = lazy(() => import('./pages/Households/HouseholdDetail'));
const TdsDetail = lazy(() => import('./pages/TdsReadings/TdsDetail'));
const ReportDetail = lazy(() => import('./pages/ReportDetail'));
const EditUser = lazy(() => import('./pages/EditUser'));
const ForgotPass = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Homepage = lazy(() => import('./pages/Homepage'));
const ConcernDetail = lazy(() => import('./pages/ConcernDetail'));
const UserDetail = lazy(() => import('./pages/UserDetail'));
const AuditDetail = lazy(() => import('./pages/AuditDetail'));


const App = () => {
    return (
        <>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                <Routes>
                    <Route path="/" element={<Homepage />} />
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
                    <Route path="/audit-trail/:id" element={<RoleBasedRoute allowedRoles={['admin']}><AuditDetail /></RoleBasedRoute>} />

                </Routes>
                <Toaster position="bottom-right" richColors />
            </Suspense>
        </>
    )
}

export default App;
