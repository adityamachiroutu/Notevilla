import { useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router"
import toast from "react-hot-toast"
import { useAuth } from "../contexts/AuthContext.jsx"

const LoginPage = () => {
    const { login, user } = useAuth()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from?.pathname || "/"

    if (user) {
        return <Navigate to={from} replace />
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (!username.trim() || !password) {
            toast.error("Username and password are required")
            return
        }
        setLoading(true)
        const result = await login(username.trim(), password)
        setLoading(false)
        if (result.ok) {
            toast.success("Welcome back!")
            navigate(from, { replace: true })
        } else {
            toast.error(result.message)
        }
    }

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
            <div className="card w-full max-w-md bg-base-100 shadow-lg">
                <div className="card-body gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold">Log in</h2>
                        <p className="text-sm text-base-content/60">
                            Access your notes by signing in.
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Username</span>
                            </label>
                            <input
                                type="text"
                                className="input input-bordered"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                placeholder="yourname"
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Password</span>
                            </label>
                            <input
                                type="password"
                                className="input input-bordered"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="••••••••"
                            />
                        </div>

                        <button className="btn btn-primary w-full" type="submit" disabled={loading}>
                            {loading ? "Signing in..." : "Log in"}
                        </button>
                    </form>

                    <p className="text-sm text-base-content/70">
                        New here?{" "}
                        <Link to="/signup" className="link link-primary">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
