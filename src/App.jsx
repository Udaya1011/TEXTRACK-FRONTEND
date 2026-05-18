import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoryPage from './pages/CategoryPage';
import AddProductPage from './pages/AddProductPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>
          } />
          <Route path="/category" element={
            <ProtectedRoute><Layout><CategoryPage /></Layout></ProtectedRoute>
          } />
          <Route path="/add-product" element={
            <ProtectedRoute><Layout><AddProductPage /></Layout></ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute><Layout><ProductsPage /></Layout></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute><Layout><UsersPage /></Layout></AdminRoute>
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
