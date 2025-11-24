import React, { useState, useContext } from 'react'
import { api } from '../../services/api'
import { AuthContext } from '../../contexts/AuthContext'


export default function Login(){
const { login } = useContext(AuthContext)
const [username,setUsername] = useState('')
const [password,setPassword] = useState('')
const [msg,setMsg] = useState(null)


async function handleSubmit(e){
e.preventDefault(); setMsg(null)
try{
const data = await api.login(username, password)
if (data.token){ login(data.token); setMsg('Logged in') }
else setMsg('No token received')
}catch(err){ setMsg(err?.body?.error || 'Login failed') }
}


return (
<div className="card">
<h3>Login</h3>
<form onSubmit={handleSubmit}>
<div className="form-row"><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="username" /></div>
<div className="form-row"><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" /></div>
<div className="form-row"><button type="submit">Login</button></div>
{msg && <div><small className="muted">{msg}</small></div>}
</form>
</div>
)
}