'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname() // ตรวจสอบหน้าปัจจุบันเพื่อเปลี่ยนสีปุ่ม

  const navLinks = [
    { name: 'หน้าหลัก', path: '/' },
    { name: 'งานของฉัน', path: '/tasks' },
    { name: 'ตารางสอบ', path: '/exams' },
    { name: 'เนื้อหาเรียน', path: '/study' },
  ]

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md shadow-sm z-50 px-6 py-4">
      <div className="max-w-2xl mx-auto flex justify-between items-center">
        <h2 className="font-black text-blue-600 text-xl">STUDY APP</h2>
        <div className="flex gap-2">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              href={link.path}
              className={`px-4 py-2 rounded-full text-sm font-bold transition ${
                pathname === link.path 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}