import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router"
import toast from "react-hot-toast"
import { useAuth } from "../contexts/AuthContext.jsx"

const SignupPage = () => {
    const { register, user } = useAuth()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    if (user) {
        return <Navigate to="/" replace />
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (!username.trim() || !password) {
            toast.error("Username and password are required")
            return
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }
        setLoading(true)
        const result = await register(username.trim(), password)
        setLoading(false)
        if (result.ok) {
            toast.success("Account created")
            navigate("/", { replace: true })
        } else {
            toast.error(result.message)
        }
    }

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
            <div className="card w-full max-w-md bg-base-100 shadow-lg">
                <div className="card-body gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold">Create account</h2>
                        <p className="text-sm text-base-content/60">
                            Sign up to keep your notes private.
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
                            {loading ? "Creating..." : "Sign up"}
                        </button>
                    </form>

                    <p className="text-sm text-base-content/70">
                        Already have an account?{" "}
                        <Link to="/login" className="link link-primary">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default SignupPage
