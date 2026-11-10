import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dialogs } from './components/Dialogs';
import { ChatPage } from './pages/ChatPage';
import { SearchDemoPage } from './pages/SearchDemoPage';
import { TemplatesPage, TemplateRoute } from './pages/TemplatesPage';
import { AccountPage } from './pages/AccountPage';
import { AuthPage } from './pages/AuthPage';
import { DataPage, ReviewRoute } from './pages/AdminPages';
import { AdminConversationsPage, AdminConversationDetail } from './pages/AdminConversationsPage';

export default function App() {
  return <><Routes>
    <Route element={<Layout />}>
      <Route path="chat" element={<ChatPage />} />
      <Route path="chat/:id" element={<ChatPage />} />
      <Route path="search-demo" element={<SearchDemoPage />} />
      <Route path="templates" element={<TemplatesPage />} />
      <Route path="templates/:type" element={<TemplateRoute />} />
      <Route path="account" element={<AccountPage />} />
      <Route path="admin/data" element={<DataPage />} />
      <Route path="admin/data/:id" element={<ReviewRoute />} />
      <Route path="admin/conversations" element={<AdminConversationsPage />} />
      <Route path="admin/conversations/:id" element={<AdminConversationDetail />} />
    </Route>
    <Route path="login" element={<AuthPage key="login" mode="login" />} />
    <Route path="register" element={<AuthPage key="register" mode="register" />} />
    <Route path="forgot" element={<AuthPage key="forgot" mode="forgot" />} />
    <Route path="admin/*" element={<Navigate to="/admin/data" replace />} />
    <Route path="*" element={<Navigate to="/chat" replace />} />
  </Routes><Dialogs /></>;
}
