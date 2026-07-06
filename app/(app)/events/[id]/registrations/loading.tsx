import type { CSSProperties } from 'react';
function Skel({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E0D4]/60 ${className ?? ''}`} style={style} />;
}
export default function RegistrationsLoading() {
  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1200px] mx-auto">
      <Skel className="h-3 w-48 mb-6" />
      <div className="bg-white rounded-2xl border border-[#E5E0D4] overflow-hidden">
        <div className="p-5 border-b border-[#E5E0D4] flex items-center justify-between">
          <Skel className="h-6 w-40" />
          <div className="flex gap-2"><Skel className="h-9 w-32 rounded-xl" /><Skel className="h-9 w-24 rounded-xl" /></div>
        </div>
        <div className="p-4"><Skel className="h-9 w-64 rounded-xl mb-4" /></div>
        <table className="w-full"><tbody>
          {Array.from({length:6}).map((_,i)=>(
            <tr key={i} className="border-t border-[#E5E0D4]">
              {Array.from({length:6}).map((_,j)=>(
                <td key={j} className="px-5 py-4"><Skel className="h-4" style={{width:`${[80,140,160,100,70,80][j]}px`}} /></td>
              ))}
            </tr>
          ))}
        </tbody></table>
      </div>
    </div>
  );
}
