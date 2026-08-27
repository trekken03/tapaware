import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, LayoutDashboard, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import LoadingScreen from '@/components/ui/LoadingScreen';

const NotFoundCard = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                    <FileQuestion size={28} className="text-blue-600" />
                </div>

                <h1 className="mt-5 text-xl font-semibold text-gray-800">Page Not Found</h1>
                <p className="mt-2 text-sm text-gray-600">
                    The page you're looking for doesn't exist or may have been moved.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} />
                        Go Back
                    </Button>
                    {isAuthenticated ? (
                        <Button onClick={() => navigate('/dashboard')}>
                            <LayoutDashboard size={16} />
                            Go to Dashboard
                        </Button>
                    ) : (
                        <Button onClick={() => navigate('/')}>
                            <Home size={16} />
                            Go to Homepage
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Catch-all for unknown URLs. Signed-in users keep their sidebar/navbar so they
 * can navigate away; guests get a standalone card.
 */
const NotFound = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <NotFoundCard />
            </div>
        );
    }

    return (
        <Layout>
            <NotFoundCard />
        </Layout>
    );
};

export default NotFound;