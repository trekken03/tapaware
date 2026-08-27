import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import Layout from './Layout';

const roleLabel = (role) => {
    if (!role) return 'your account';
    return role.charAt(0).toUpperCase() + role.slice(1);
};

/**
 * Shown whenever a signed-in user lands on a page their role can't open.
 * Rendered inside Layout so the sidebar/navbar stays available and the page
 * never looks like a blank screen.
 */
const AccessDenied = ({ allowedRoles = [] }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <Layout>
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                        <ShieldAlert size={28} className="text-red-600" />
                    </div>

                    <h1 className="mt-5 text-xl font-semibold text-red-600">Access Denied</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        You don't have permission to access this page.
                    </p>

                    <p className="mt-4 text-xs text-gray-500">
                        Signed in as <span className="font-medium text-gray-700">{roleLabel(user?.role)}</span>
                        {allowedRoles.length > 0 && (
                            <>
                                {' '}&middot; this page is for{' '}
                                <span className="font-medium text-gray-700">
                                    {allowedRoles.map(roleLabel).join(' and ')}
                                </span>
                            </>
                        )}
                        .
                    </p>

                    <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
                        <Button variant="outline" onClick={() => navigate(-1)}>
                            <ArrowLeft size={16} />
                            Go Back
                        </Button>
                        <Button onClick={() => navigate('/dashboard')}>
                            <LayoutDashboard size={16} />
                            Go to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AccessDenied;