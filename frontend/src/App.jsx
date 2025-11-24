import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, AuthContext } from './contexts/AuthContext'
import {Navbar} from './components/Navbar'
import {Home} from './pages/Home'
import {Login} from './pages/Login'
import {Register} from './pages/Register'
import {Dashboard} from './pages/Dashboard'
import {RoomView} from './pages/RoomView'


function PrivateRoute({ children }){
const { token } = useContext(AuthContext)
if (!token) return <Navigate to="/login" replace />
return children
}


export default function App(){
return (
<AuthProvider>
<Navbar />
<Routes>
<Route path="/" element={<Home />} />
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
<Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
<Route path="*" element={<Navigate to="/" replace />} />
</Routes>
</AuthProvider>
)
}