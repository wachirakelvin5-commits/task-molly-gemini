/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, getDocFromServer, setDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from './types';

// Pages
import LandingPage from './pages/LandingPage';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProviderDashboard = lazy(() => import('./pages/ProviderDashboard'));
const ProviderServices = lazy(() => import('./pages/ProviderServices'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const ProviderListing = lazy(() => import('./pages/ProviderListing'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const ClientTasks = lazy(() => import('./pages/ClientTasks'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminComplaints = lazy(() => import('./pages/AdminComplaints'));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const RequestServicePage = lazy(() => import('./pages/RequestServicePage'));

// Components
import Navbar from './components/Navbar';
import { InstallPrompt } from './components/InstallPrompt';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useNotifications } from './hooks/useNotifications';

function NavbarWrapper({ user, hideNavbar }: { user: UserProfile | null; hideNavbar: boolean }) {
  const location = useLocation();
  // The header only remains on the first landing page
  if (location.pathname !== '/' || hideNavbar) {
    return null;
  }
  return <Navbar user={user} />;
}

const queryClient = new QueryClient();

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('taskmolly_mock_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const [hideNavbar, setHideNavbar] = useState(false);

  useNotifications(user);

  useEffect(() => {
    // Validate connection to Firestore
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'health-check', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration or network status.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        const queryRole = new URLSearchParams(window.location.search).get('role');
        const storedRole = localStorage.getItem('taskmolly_selected_role') as UserRole | null;
        const isExplicitProviderIntent = queryRole === 'tasker' || queryRole === 'provider' || storedRole === 'tasker';

        // Check if there is an active direct/mock session first
        const savedMockStr = localStorage.getItem('taskmolly_mock_user');
        if (savedMockStr) {
          try {
            const parsed = JSON.parse(savedMockStr);
            if (parsed?.uid?.startsWith('dev_') || parsed?.uid === 'admin_bypass') {
              console.log("[Auth] Active direct session active:", parsed.displayName, parsed.role);
              setUser(parsed);
              setLoading(false);
              return;
            }
          } catch {}
        }

        if (firebaseUser) {
          console.log("[Auth] Active Firebase user detected:", firebaseUser.uid, firebaseUser.email);
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          let userDoc = await getDoc(userDocRef).catch(() => null);

          const defaultRole: UserRole = isExplicitProviderIntent ? 'tasker' : (storedRole || 'client');

          if (!userDoc || !userDoc.exists()) {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              phone: firebaseUser.phoneNumber || '',
              role: defaultRole,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              photoURL: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/200`,
              isVerified: true,
              createdAt: new Date().toISOString(),
            };
            if (defaultRole === 'tasker') {
              newProfile.walletBalance = 4500;
              newProfile.services = [
                'Mama Fua / Laundry',
                'Electrical & Solar',
                'Plumbing & Drainage',
                'Fundi / Handyman',
                'Gardening & Landscaping',
                'Movers & Relocation',
                'House Painting',
                'Deep Cleaning'
              ];
            }
            try {
              await setDoc(userDocRef, newProfile);
            } catch (err) {
              console.warn("Could not save initial user document:", err);
            }
            setUser(newProfile);
            localStorage.setItem('taskmolly_mock_user', JSON.stringify(newProfile));
            localStorage.setItem('taskmolly_selected_role', defaultRole);
          } else {
            const profile = userDoc.data() as UserProfile;
            // If the user signed in on the provider path, upgrade/switch role to tasker
            if (isExplicitProviderIntent && profile.role !== 'tasker') {
              console.log("[Auth] Upgrading user role to tasker based on provider intent");
              const updatedProfile: UserProfile = {
                ...profile,
                role: 'tasker',
                walletBalance: profile.walletBalance ?? 4500,
                services: profile.services && profile.services.length > 0 ? profile.services : [
                  'Mama Fua / Laundry',
                  'Electrical & Solar',
                  'Plumbing & Drainage',
                  'Fundi / Handyman',
                  'Gardening & Landscaping',
                  'Movers & Relocation',
                  'House Painting',
                  'Deep Cleaning'
                ]
              };
              setDoc(userDocRef, updatedProfile, { merge: true }).catch(console.warn);
              setUser(updatedProfile);
              localStorage.setItem('taskmolly_mock_user', JSON.stringify(updatedProfile));
              localStorage.setItem('taskmolly_selected_role', 'tasker');
            } else {
              setUser(profile);
              localStorage.setItem('taskmolly_mock_user', JSON.stringify(profile));
              localStorage.setItem('taskmolly_selected_role', profile.role || 'client');
            }
          }
        } else {
          // If no Firebase auth user is logged in, check for dev bypass session
          const savedMock = localStorage.getItem('taskmolly_mock_user');
          if (savedMock) {
            try {
              const parsed = JSON.parse(savedMock);
              setUser(parsed);
              setLoading(false);
              return;
            } catch {}
          }
          setUser(null);
          localStorage.removeItem('taskmolly_mock_user');
        }
      } catch (err) {
        console.error("Auth state processing error:", err);
        const savedMock = localStorage.getItem('taskmolly_mock_user');
        if (savedMock) {
          try {
            setUser(JSON.parse(savedMock));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-primary-bg">
        <div className="w-12 h-12 border-4 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <InstallPrompt />
      <Router>
        <div className="min-h-[100dvh] bg-primary-bg no-scrollbar overflow-y-auto">
          <NavbarWrapper user={user} hideNavbar={hideNavbar} />
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="w-10 h-10 border-3 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<LandingPage setHideNavbar={setHideNavbar} />} />
              <Route path="/request" element={<RequestServicePage />} />
              <Route path="/add-request" element={<RequestServicePage />} />
              <Route path="/new-request" element={<RequestServicePage />} />
              <Route 
                path="/auth" 
                element={
                  user ? (
                    // If user is currently a client, but navigating to /auth?role=tasker, allow provider auth page
                    window.location.search.includes('role=tasker') && user.role !== 'tasker' ? (
                      <AuthPage />
                    ) : (
                      <Navigate to={user.role === 'tasker' ? '/provider-dashboard' : '/dashboard'} replace />
                    )
                  ) : (
                    <AuthPage />
                  )
                } 
              />
              <Route 
                path="/dashboard" 
                element={user ? <Dashboard user={user} /> : <Navigate to="/auth" />} 
              />
              <Route 
                path="/tasks" 
                element={user ? (user.role === 'tasker' ? <ProviderServices user={user} /> : <ClientTasks user={user} />) : <Navigate to="/auth" />} 
              />
              <Route 
                path="/provider-dashboard" 
                element={user ? <ProviderDashboard user={user} /> : <Navigate to="/auth" />} 
              />
              <Route 
                path="/provider-services" 
                element={user ? <ProviderServices user={user} /> : <Navigate to="/auth" />} 
              />
              <Route 
                path="/providers" 
                element={<ProviderListing />} 
              />
              <Route 
                path="/chat/:jobId" 
                element={user ? <ChatPage user={user} /> : <Navigate to="/auth" />} 
              />
              <Route 
                path="/blog" 
                element={<BlogPage />} 
              />
              <Route 
                path="/admin-dashboard" 
                element={user?.role === 'admin' || user?.email === 'wachirakelvin5@gmail.com' ? <AdminDashboard /> : <Navigate to="/auth" />} 
              />
              <Route 
                path="/admin-complaints" 
                element={user?.role === 'admin' || user?.email === 'wachirakelvin5@gmail.com' ? <AdminComplaints /> : <Navigate to="/auth" />} 
              />
              <Route 
                path="/admin-analytics" 
                element={user?.role === 'admin' || user?.email === 'wachirakelvin5@gmail.com' ? <AdminAnalytics /> : <Navigate to="/auth" />} 
              />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </QueryClientProvider>
  );
}
