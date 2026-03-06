import { Navigate, useLocation } from "react-router"
import { useAuth } from "../contexts/AuthContext.jsx"

const ProtectedRoute = ({ children }) => {
    const { user, checking } = useAuth()
    const location = useLocation()

    if (checking) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="text-base-content/70">Checking session...</div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />
    }

    return children
}

export default ProtectedRoute
