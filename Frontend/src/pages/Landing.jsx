import React from 'react';
import { 
  Briefcase, 
  MapPin, 
  CheckCircle2, 
  Bell, 
  Users, 
  CreditCard, 
  ArrowRight, 
  Menu, 
  X, 
  ShieldCheck, 
  FileText, 
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import LeadForm from '../modules/leads/components/LeadForm';

const Landing = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const openDemo = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.open('https://field-service.kiaansoftware.com/lead-intake', '_blank', 'noopener,noreferrer');
    }
  };

  const Navbar = () => (
    <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Zap className="text-white" size={18} />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">FieldSync Pro</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Workflow</a>
            <a href="#tracking" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Tracking</a>
            <a href="#contact" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Contact</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white px-4 py-2 transition-colors">
              Login
            </Link>
            <button 
              onClick={openDemo}
              className="bg-white text-black text-sm font-medium px-5 py-2.5 rounded-full hover:bg-slate-200 transition-all shadow-lg shadow-white/5"
            >
              Book Demo
            </button>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-400">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-white/5 px-4 py-6 space-y-4">
          <a href="#features" className="block text-base font-medium text-slate-400">Features</a>
          <a href="#workflow" className="block text-base font-medium text-slate-400">Workflow</a>
          <a href="#tracking" className="block text-base font-medium text-slate-400">Tracking</a>
          <a href="#contact" className="block text-base font-medium text-slate-400">Contact</a>
          <div className="pt-4 flex flex-col gap-3">
            <Link to="/login" className="text-center text-base font-medium text-slate-400 py-3 bg-white/5 rounded-xl">
              Login
            </Link>
            <button 
              onClick={openDemo}
              className="w-full bg-white text-black font-medium py-3 rounded-xl"
            >
              Book Demo
            </button>
          </div>
        </div>
      )}
    </nav>
  );

  const Hero = () => (
    <section className="pt-32 pb-20 md:pt-48 md:pb-32 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-bold uppercase tracking-wider mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          The Modern Standard for Field Service
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1] mb-8">
          Run Your Field Service <br className="hidden md:block" /> Business — <span className="text-slate-600">End to End</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 leading-relaxed mb-12">
          From Leads to Payments, manage everything in one place with real-time tracking, digital approvals, and automated workflows.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={openDemo}
            className="w-full sm:w-auto bg-white text-black px-10 py-5 rounded-full font-bold text-xl hover:bg-slate-200 transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-2 group"
          >
            Book Demo
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
      </div>
    </section>
  );

  const Features = () => {
    const featureList = [
      { icon: Briefcase, title: 'Lead to Invoice Workflow', desc: 'Streamline your entire customer journey from the first contact to the final invoice.' },
      { icon: MapPin, title: 'Real-time GPS Tracking', desc: 'Monitor your technicians live on the map and optimize routes for maximum efficiency.' },
      { icon: ShieldCheck, title: 'Customer Approvals', desc: 'Get digital signatures on estimates and job completions right from the field.' },
      { icon: Bell, title: 'Automated Notifications', desc: 'Keep customers and teams in the loop with automated SMS and email updates.' },
      { icon: Users, title: 'Team Management', desc: 'Assign jobs, track attendance, and manage timesheets for your entire workforce.' },
      { icon: CreditCard, title: 'Payments & Billing', desc: 'Accept payments on-site and generate professional invoices in seconds.' },
    ];

    return (
      <section id="features" className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">Everything you need to grow</h2>
            <p className="text-slate-400 max-w-xl mx-auto">FieldSync Pro provides a comprehensive suite of tools built specifically for modern service businesses.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureList.map((f, i) => (
              <div key={i} className="bg-slate-950 p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-all hover:shadow-xl hover:shadow-black/5">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white mb-6">
                  <f.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const Workflow = () => (
    <section id="workflow" className="py-24 bg-slate-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">A seamless operational flow</h2>
          <p className="text-slate-400">Standardize your operations with our proven 5-step workflow.</p>
        </div>
        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 z-0" />
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 relative z-10">
            {[
              { label: 'Lead', color: 'bg-blue-500' },
              { label: 'Estimate', color: 'bg-indigo-500' },
              { label: 'Job', color: 'bg-emerald-500' },
              { label: 'Invoice', color: 'bg-amber-500' },
              { label: 'Payment', color: 'bg-black' }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 ${step.color} text-white rounded-2xl flex items-center justify-center text-xl font-bold mb-4 shadow-lg`}>
                  {i + 1}
                </div>
                <h4 className="font-bold text-white">{step.label}</h4>
                <p className="text-xs text-slate-500 mt-2">Step Description</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  const Tracking = () => (
    <section id="tracking" className="py-24 bg-slate-950 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              Operations Control
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-8">Full Visibility Into <br /> Your Operations</h2>
            <div className="space-y-8">
              {[
                { title: 'Live GPS Tracking', desc: 'See exactly where your technicians are in real-time on a unified map.' },
                { title: 'Route Playback', desc: 'Review historical routes to optimize travel time and fuel costs.' },
                { title: 'Technician Monitoring', desc: 'Track job duration, arrival times, and performance metrics automatically.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-brand-cyan/20 flex items-center justify-center text-brand-cyan">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">{item.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
             <div className="aspect-square bg-white/5 rounded-3xl border border-white/10 p-4 flex items-center justify-center">
                <div className="w-full h-full bg-slate-900 rounded-2xl overflow-hidden relative border border-white/5">
                   <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 bg-brand-cyan rounded-full animate-ping absolute" />
                      <div className="w-4 h-4 bg-brand-cyan rounded-full relative shadow-[0_0_15px_#06b6d4]" />
                   </div>
                   <div className="absolute bottom-8 left-8 bg-black/80 backdrop-blur-xl p-4 rounded-xl border border-white/10 text-[10px] font-bold">
                      <p className="text-slate-400 uppercase tracking-widest mb-1">Technician Status</p>
                      <p className="text-white">John Doe — On Site (Job #2041)</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );


  const IntakeSection = () => (
    <section id="contact" className="py-24 bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-brand-cyan/5 to-transparent pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Secure Lead Intake</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none mb-6">
            Book your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-teal via-brand-cyan to-white">service</span> now.
          </h2>
          
          <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed italic">
            Professional field services on demand. Submit your details below and our team will get back to you with a schedule within 24 hours.
          </p>
        </div>

        <LeadForm />
      </div>
    </section>
  );

  const CTA = () => (
    <section className="py-24 bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight italic uppercase">Ready to Scale Your <br /> Service Business?</h2>
        <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto italic font-medium">Join 500+ service companies already using FieldSync Pro to automate their growth.</p>
        <button 
           onClick={openDemo}
           className="bg-white text-black px-12 py-5 rounded-full font-black text-xl hover:bg-slate-100 transition-all shadow-2xl shadow-white/10"
        >
          Get Started
        </button>
      </div>
    </section>
  );

  const Footer = () => (
    <footer className="py-12 bg-slate-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
              <Zap className="text-black" size={14} />
            </div>
            <span className="font-bold text-white">FieldSync Pro</span>
          </div>
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} FieldSync Pro. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-medium text-slate-500">
             <a href="#" className="hover:text-black">Privacy</a>
             <a href="#" className="hover:text-black">Terms</a>
             <a href="#" className="hover:text-black">API</a>
          </div>
        </div>
      </div>
    </footer>
  );

  return (
    <div className="h-screen overflow-y-auto scrollbar-hide bg-slate-950 font-sans text-slate-300 scroll-smooth">
      <Navbar />
      <Hero />
      <Features />
      <Workflow />
      <Tracking />
      <IntakeSection />
      <CTA />
      <Footer />
    </div>
  );
};

export default Landing;
