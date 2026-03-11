import './globals.css'
import Navbar from '@/components/Navbar'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-gray-50 pt-20"> {/* ใส่ pt-20 เพื่อไม่ให้เนื้อหาถูก Navbar บัง */}
        <Navbar />
        {children}
      </body>
    </html>
  )
}