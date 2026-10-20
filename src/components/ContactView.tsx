import { Mail, MessageCircle, ExternalLink } from 'lucide-react';

export default function ContactView() {
  const handleEmailClick = () => {
    window.location.href = 'mailto:support.taskmolly254@gmail.com';
  };

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/254706220959', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="h-full flex flex-col justify-center items-center px-4 md:px-8 py-6 max-w-xl mx-auto w-full space-y-5 overflow-y-auto no-scrollbar">
      {/* Email Card */}
      <div className="w-full bg-white rounded-[2rem] md:rounded-[2.4rem] p-6 md:p-7 border border-warm-gray/60 shadow-xs hover:border-accent-gold/40 transition-all flex items-start gap-4 sm:gap-5">
        {/* Soft rounded icon box */}
        <div className="w-13 h-13 sm:w-15 sm:h-15 md:w-16 md:h-16 rounded-2xl md:rounded-[1.4rem] bg-[#F7F4EE] flex items-center justify-center shrink-0 text-[#B5925A]">
          <Mail size={24} strokeWidth={1.8} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <span className="block text-[11px] md:text-xs font-bold tracking-widest text-rich-black/40 uppercase mb-1">
            EMAIL US
          </span>
          <div className="text-base sm:text-lg md:text-xl font-bold text-rich-black break-all leading-snug mb-3">
            support.taskmolly254@gmail.com
          </div>
          <button
            onClick={handleEmailClick}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#B5925A] hover:text-[#977742] transition-colors cursor-pointer group"
          >
            <span>SEND AN EMAIL</span>
            <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* WhatsApp Card */}
      <div className="w-full bg-white rounded-[2rem] md:rounded-[2.4rem] p-6 md:p-7 border border-warm-gray/60 shadow-xs hover:border-accent-gold/40 transition-all flex items-start gap-4 sm:gap-5">
        {/* Soft rounded icon box */}
        <div className="w-13 h-13 sm:w-15 sm:h-15 md:w-16 md:h-16 rounded-2xl md:rounded-[1.4rem] bg-[#F7F4EE] flex items-center justify-center shrink-0 text-[#B5925A]">
          <MessageCircle size={24} strokeWidth={1.8} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <span className="block text-[11px] md:text-xs font-bold tracking-widest text-rich-black/40 uppercase mb-1">
            WHATSAPP US
          </span>
          <div className="text-base sm:text-lg md:text-xl font-bold text-rich-black leading-snug mb-3">
            0706220959
          </div>
          <button
            onClick={handleWhatsAppClick}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#B5925A] hover:text-[#977742] transition-colors cursor-pointer group"
          >
            <span>CHAT ON WHATSAPP</span>
            <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
