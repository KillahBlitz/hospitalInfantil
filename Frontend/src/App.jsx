import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/login/login'
import Registry from './pages/registry/registry'
import PasswordRecouperation from './pages/passwordRecuperation/passwordRecouperation'
import NotFound from './pages/notFound/notFound'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registrar" element={<Registry />} />
        <Route path="/recuperar" element={<PasswordRecouperation />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
