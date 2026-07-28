import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/login/login'
import Registry from './pages/registry/registry'
import PasswordRecouperation from './pages/passwordRecuperation/passwordRecouperation'
import NotFound from './pages/notFound/notFound'
import PrincipalPage from './pages/principalPage/principalPage'
import { PublicRoute, PrivateRoute } from './components/RouteGuards'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/registrar" element={<PublicRoute><Registry /></PublicRoute>} />
        <Route path="/recuperar" element={<PublicRoute><PasswordRecouperation /></PublicRoute>} />
        <Route path="/menu" element={<PrivateRoute><PrincipalPage /></PrivateRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
