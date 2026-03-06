import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import axiosInstance from "../lib/axios.js"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [checking, setChecking] = useState(true)

    const refreshUser = useCallback(async () => {
        setChecking(true)
        try {
            const res = await axiosInstance.get("/auth/me")
            setUser(res.data.user)
        } catch (error) {
            setUser(null)
        } finally {
            setChecking(false)
        }
    }, [])

    useEffect(() => {
        refreshUser()
    }, [refreshUser])

    const login = useCallback(async (username, password) => {
        try {
            const res = await axiosInstance.post("/auth/login", { username, password })
            setUser(res.data.user)
            return { ok: true }
        } catch (error) {
            const message =
                error?.response?.data?.message || "Invalid username or password"
            return { ok: false, message }
        }
    }, [])

    const register = useCallback(async (username, password) => {
        try {
            const res = await axiosInstance.post("/auth/register", { username, password })
            setUser(res.data.user)
            return { ok: true }
        } catch (error) {
            const message =
                error?.response?.data?.message || "Unable to create account"
            return { ok: false, message }
        }
    }, [])

    const logout = useCallback(async () => {
        try {
            await axiosInstance.post("/auth/logout")
            setUser(null)
            return { ok: true }
        } catch (error) {
            return { ok: false, message: "Unable to log out" }
        }
    }, [])

    const value = useMemo(
        () => ({
            user,
            checking,
            login,
            register,
            logout,
            refreshUser,
        }),
        [user, checking, login, register, logout, refreshUser]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
