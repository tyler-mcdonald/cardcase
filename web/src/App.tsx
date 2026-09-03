import { Route, Routes } from 'react-router-dom'
import { HomePage } from './routes/HomePage'
import { LoginPage } from './routes/LoginPage'
import { ProtectedRoute } from './lib/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
