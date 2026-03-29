import { Plus } from 'lucide-react'
import React from 'react'

interface ButtonCreateProps {
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
}

function ButtonCreate({ isFormOpen, setIsFormOpen }: ButtonCreateProps) {
  return (
    <div className="">
      <button
        onClick={() => setIsFormOpen(!isFormOpen)}
        className="w-10 h-10 bg-[#444446] rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-105 transition-transform border-2 border-blue-400/30"
      >
        <Plus size={25} strokeWidth={3} />
      </button>
    </div>
  )
}

export default ButtonCreate
