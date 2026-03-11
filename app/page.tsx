'use client'
import Link from 'next/link'

export default function Dashboard() {
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      {/* 1. ส่วน Banner (แทนภาพตัวละคร) */}
      <div className="bg-gradient-to-r from-blue-400 to-indigo-600 rounded-3xl p-10 text-white shadow-xl">
        <h1 className="text-4xl font-bold">Welcome Back, Admin</h1>
        <p className="mt-2 text-blue-100">จัดการงาน ตารางสอบ และเนื้อหาเรียนของคุณได้ที่นี่</p>
        <button className="mt-6 bg-white text-indigo-600 px-6 py-2 rounded-full font-bold">ดูรายละเอียด</button>
      </div>

      {/* 2. ส่วนเมนู (จัดแบบ Grid ให้เหมือนเรฟ) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/tasks" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <h3 className="text-lg font-bold text-gray-700">งานค้าง 📝</h3>
          <p className="text-xs text-gray-400 mt-2">จัดการงานที่ได้รับมอบหมาย</p>
        </Link>
        <Link href="/exams" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <h3 className="text-lg font-bold text-gray-700">ตารางสอบ 📅</h3>
          <p className="text-xs text-gray-400 mt-2">ตรวจสอบวันที่และแนวสอบ</p>
        </Link>
        <Link href="/study" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <h3 className="text-lg font-bold text-gray-700">คลังความรู้ 📚</h3>
          <p className="text-xs text-gray-400 mt-2">รวมเนื้อหาและสรุปบทเรียน</p>
        </Link>
      </div>

      {/* 3. ส่วนรายการล่าสุด (จำลอง Card) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="font-bold text-xl mb-4">กิจกรรมล่าสุด</h2>
        <div className="text-gray-400 text-sm">ยังไม่มีกิจกรรมใหม่ๆ ในขณะนี้</div>
      </div>
    </main>
  )
}