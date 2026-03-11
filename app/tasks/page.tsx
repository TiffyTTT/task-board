'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const ADMIN_NAME = "Admin"

export default function Home() {
  const [tasks, setTasks] = useState<any[]>([])
  const [username, setUsername] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all')
  const [activeView, setActiveView] = useState<'list' | 'calendar'>('list')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filterSubject, setFilterSubject] = useState('all')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [subject, setSubject] = useState('')
  const [deadline, setDeadline] = useState('')
  const [darkMode, setDarkMode] = useState(false)

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()

  const checkDeadlines = (taskList: any[]) => {
    if (typeof window === 'undefined' || !("Notification" in window)) return;
    const urgentTask = taskList.find(t => {
      if (!t.deadline) return false;
      const diffDays = Math.ceil((new Date(t.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 1 && t.status !== 'done';
    });
    if (urgentTask && Notification.permission === "granted") {
      new Notification("⚠️ งานใกล้ครบกำหนด!", { body: `อย่าลืมทำ: ${urgentTask.title}` });
    }
  }

  useEffect(() => {
    let id = localStorage.getItem('device_id') || crypto.randomUUID()
    localStorage.setItem('device_id', id)
    setDeviceId(id)
    let savedName = localStorage.getItem('my_username')
    if (!savedName || savedName === 'ไม่ระบุชื่อ' || savedName === 'ผู้ใช้ทั่วไป') {
        const name = prompt('ยินดีต้อนรับ! กรุณาตั้งชื่อของคุณ:')
        savedName = name || 'ผู้ใช้ทั่วไป'
        localStorage.setItem('my_username', savedName)
    }
    setUsername(savedName)
    supabase.from('users').upsert([{ id: id, username: savedName }]).then(() => {
        fetchTasks().then(data => data && checkDeadlines(data))
    })
    const channel = supabase.channel('tasks').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
      fetchTasks()
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchTasks() {
    const { data } = await supabase.from('tasks').select('*').order('id', { ascending: false })
    if (data) setTasks(data)
    return data
  }

  async function changeName() {
    const newName = prompt('เปลี่ยนชื่อเป็น:', username)
    if (newName && newName !== username) {
      localStorage.setItem('my_username', newName)
      setUsername(newName)
      await supabase.from('users').upsert([{ id: deviceId, username: newName }])
      await supabase.from('tasks').update({ username: newName }).eq('user_id', deviceId)
      fetchTasks()
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id)
    fetchTasks()
  }

  async function addTask() {
    if (!title) return
    const { error } = await supabase.from('tasks').insert([{ title, Description: desc, subject, deadline, user_id: deviceId, username: username, status: 'pending' }])
    if (!error) {
      supabase.functions.invoke('notify-task', { body: { title, user: username } }).catch(console.error)
    }
    setTitle(''); setDesc(''); setSubject(''); setDeadline('')
  }

  async function deleteTask(task: any) {
    if (task.user_id !== deviceId && username !== ADMIN_NAME) { alert("คุณไม่มีสิทธิ์ลบงานของผู้อื่น!"); return }
    if (!confirm("ยืนยันการลบงานนี้?")) return
    await supabase.from('tasks').delete().eq('id', task.id)
  }

  async function broadcastTask() {
    const { data: users } = await supabase.from('users').select('id, username')
    if (users) {
      const broadcastData = users.map(u => ({ title, Description: desc, subject, deadline, user_id: u.id, username: u.username, status: 'pending' }))
      await supabase.from('tasks').insert(broadcastData)
      alert(`สั่งงานให้สมาชิก ${users.length} คนแล้ว!`)
    }
  }

  const goBackHome = () => { setActiveTab('all'); setActiveView('list'); setFilterSubject('all'); }
  return (
    <main className={`min-h-screen transition-colors duration-500 p-4 md:p-10 w-full ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Header */}
      <div className={`p-8 rounded-[2.5rem] shadow-xl mb-10 flex flex-wrap justify-between items-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center gap-5">
            {(activeView !== 'list' || activeTab !== 'all' || filterSubject !== 'all') && (
                <button onClick={goBackHome} className={`flex items-center justify-center w-12 h-12 rounded-full transition-all hover:scale-110 active:scale-95 ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm'}`}>
                    <span className="text-xl">⬅️</span>
                </button>
            )}
            <div>
                <h1 className="text-4xl font-black tracking-tight">Task Board 🚀</h1>
                <p className="text-sm opacity-60 mt-1 uppercase tracking-widest">ยินดีต้อนรับ, <span className="font-bold text-blue-500">{username}</span></p>
            </div>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
            <button onClick={() => setDarkMode(!darkMode)} className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
                {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button onClick={changeName} className={`px-6 py-3 rounded-full font-bold text-xs ${darkMode ? 'bg-gray-700' : 'bg-gray-100 shadow-sm'}`}>แก้ไขชื่อ</button>
        </div>
      </div>
      
      <div className="flex flex-col xl:flex-row gap-8">
        {/* ส่วน Input */}
        <div className={`xl:w-[400px] w-full p-8 rounded-[2.5rem] shadow-lg h-fit space-y-5 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span>➕</span> เพิ่มงานใหม่</h2>
            <div className="flex flex-wrap gap-2 mb-4">
                {[...new Set(tasks.map(t => t.subject))].filter(Boolean).slice(0, 5).map(sub => (
                    <button key={sub} onClick={() => setSubject(sub as string)} className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-blue-50'} px-3 py-1 rounded-full text-[10px] font-bold transition-all`}>
                        {sub}
                    </button>
                ))}
            </div>
            <input className={`w-full text-lg border-b-2 pb-2 outline-none bg-transparent ${darkMode ? 'border-gray-700 focus:border-blue-500' : 'border-gray-100 focus:border-blue-500'}`} placeholder="ชื่องาน..." value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className={`w-full border-b-2 pb-2 outline-none bg-transparent resize-none ${darkMode ? 'border-gray-700 focus:border-blue-500' : 'border-gray-100 focus:border-blue-500'}`} placeholder="รายละเอียด..." value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
            <div className="grid grid-cols-1 gap-4">
                <input className={`border-b-2 pb-2 outline-none bg-transparent ${darkMode ? 'border-gray-700 focus:border-blue-500' : 'border-gray-100 focus:border-blue-500'}`} placeholder="วิชา..." value={subject} onChange={(e) => setSubject(e.target.value)} />
                <input className={`border-b-2 pb-2 outline-none bg-transparent ${darkMode ? 'border-gray-700 focus:border-blue-500' : 'border-gray-100 focus:border-blue-500'}`} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2 pt-4">
                <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95" onClick={addTask}>บันทึกงาน</button>
                {username === ADMIN_NAME && (
                    <button className="w-full bg-red-500/10 text-red-500 py-3 rounded-2xl font-bold border border-red-500/20 hover:bg-red-500 hover:text-white transition-all" onClick={broadcastTask}>สั่งงานทุกคน</button>
                )}
            </div>
        </div>

        {/* ส่วนเนื้อหาหลัก */}
        <div className="flex-1 space-y-6">
            <div className="flex flex-col lg:flex-row gap-4">
                <div className={`flex flex-1 p-1.5 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <button className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'all' ? (darkMode ? 'bg-gray-700 text-white' : 'bg-white shadow-md') : 'opacity-40'}`} onClick={() => setActiveTab('all')}>งานทั้งหมด</button>
                    <button className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'mine' ? (darkMode ? 'bg-gray-700 text-white' : 'bg-white shadow-md') : 'opacity-40'}`} onClick={() => setActiveTab('mine')}>งานของฉัน</button>
                </div>
                <div className={`flex p-1.5 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <button className={`px-8 py-3 rounded-xl font-bold transition-all ${activeView === 'list' ? (darkMode ? 'bg-gray-700 text-white' : 'bg-white shadow-md') : 'opacity-40'}`} onClick={() => setActiveView('list')}>รายการ</button>
                    <button className={`px-8 py-3 rounded-xl font-bold transition-all ${activeView === 'calendar' ? (darkMode ? 'bg-gray-700 text-white' : 'bg-white shadow-md') : 'opacity-40'}`} onClick={() => setActiveView('calendar')}>ปฏิทิน</button>
                </div>
                <select className={`p-4 rounded-2xl font-bold outline-none min-w-[200px] ${darkMode ? 'bg-gray-800 border-none' : 'bg-white border'}`} value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
                    <option value="all">ทุกวิชา</option>
                    {[...new Set(tasks.map(t => t.subject))].filter(Boolean).map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
            </div>

            {activeView === 'calendar' ? (
                <div className={`p-8 rounded-[2.5rem] shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex justify-between items-center mb-8">
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-4 hover:bg-gray-500/10 rounded-full transition-colors text-2xl">◀</button>
                        <h2 className="font-black text-3xl">{currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</h2>
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-4 hover:bg-gray-500/10 rounded-full transition-colors text-2xl">▶</button>
                    </div>
                    <div className="grid grid-cols-7 gap-4 text-center text-xs font-black opacity-40 mb-4 tracking-widest uppercase">
                        {['อา','จ','อ','พ','พฤ','ศ','ส'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-3">
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dayTasks = tasks.filter(t => t.deadline && t.deadline.startsWith(dateStr)).filter(t => activeTab === 'all' || t.user_id === deviceId).filter(t => filterSubject === 'all' || t.subject === filterSubject);
                            return (
                                <div key={day} className={`min-h-[120px] border-2 rounded-2xl p-2 transition-all hover:border-blue-500/50 ${darkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-50 bg-gray-50/50'}`}>
                                    <span className="text-sm font-bold opacity-30">{day}</span>
                                    <div className="mt-2 space-y-1.5">
                                        {dayTasks.map(t => (
                                            <div key={t.id} className={`text-[9px] leading-tight p-1.5 rounded-lg font-bold shadow-sm ${t.status === 'done' ? 'bg-green-500/20 text-green-500 line-through' : 'bg-blue-600 text-white'}`}>
                                                {t.title}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {tasks.filter(t => activeTab === 'all' || t.user_id === deviceId).filter(t => filterSubject === 'all' || t.subject === filterSubject).map(task => {
                        const isDone = task.status === 'done';
                        return (
                            <div key={task.id} className={`group p-7 rounded-[2.5rem] shadow-md border-l-[10px] transition-all hover:-translate-y-1 hover:shadow-xl ${isDone ? 'border-green-500 opacity-70' : 'border-red-500'} ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="flex justify-between items-start h-full flex-col">
                                    <div className="w-full">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className={`font-black text-xl leading-tight ${isDone ? 'line-through opacity-40' : ''}`}>{task.title}</h3>
                                            <button onClick={() => updateStatus(task.id, isDone ? 'pending' : 'done')} className={`text-2xl p-2 rounded-xl transition-all ${isDone ? 'bg-green-500/20' : 'bg-gray-500/10 hover:bg-blue-500/20'}`}>
                                                {isDone ? '✅' : '✔️'}
                                            </button>
                                        </div>
                                        <p className="text-sm opacity-60 line-clamp-3">{task.Description}</p>
                                    </div>
                                    <div className="w-full mt-6 pt-4 border-t border-gray-500/10">
                                        <div className="flex justify-between items-center">
                                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-[10px] font-bold">#{task.subject}</span>
                                            <span className="text-[10px] font-bold opacity-40">📅 {task.deadline || 'ไม่มีกำหนด'}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-3">
                                            <span className="text-[9px] opacity-30 italic font-medium">โดย: {task.username}</span>
                                            {(task.user_id === deviceId || username === ADMIN_NAME) && (
                                                <button onClick={() => deleteTask(task)} className="text-[10px] font-bold text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">ลบงาน</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
      </div>
    </main>
  )
}