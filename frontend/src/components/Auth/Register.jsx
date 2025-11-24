import React, { useState } from 'react'
import { api } from '../../services/api'


export default function Register(){
const [username,setUsername] = useState('')
const [password,setPassword] = useState('')
const [msg,setMsg] = useState(null)


async function handleSubmit(e){
e.preventDefault(); setMsg(null)
try{
const data = await api.register(username, password)
setMsg('Registered! Now login')
}catch(err){ setMsg(err?.body?.error || 'Register failed') }
}


return (
<div className="card">
<h3>Register</h3>
<form onSubmit={handleSubmit}>
<div className="form-row"><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="username" /></div>
<div className="form-row"><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" /></div>
<div className="form-row"><button type="submit">Register</button></div>
{msg && <div><small className="muted">{msg}</small></div>}
</form>
</div>
)
}