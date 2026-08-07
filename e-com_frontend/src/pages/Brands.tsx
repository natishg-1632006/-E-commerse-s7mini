import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { brandService } from '../services/brand.service';
import type { Brand } from '../services/brand.service';
import { Tag, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

// --- Premium Minimalist Shimmer & Typography Helper ---
const ShimmerStyle: React.FC = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;750;900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');

    @keyframes shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position: 600px 0; }
    }
    .ske-base {
      background: linear-gradient(90deg, #f8fafc 25%, #f1f5f9 50%, #f8fafc 75%);
      background-size: 1200px 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }
    .ske-r  { border-radius: 24px; }

    .font-brand-title {
      font-family: 'Playfair Display', serif;
    }
    .font-brand-card {
      font-family: 'Outfit', sans-serif;
    }
  `}</style>
);

const Bone: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <div className={`ske-base ske-r ${className}`} style={style} />
);

export const Brands: React.FC = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoading(true);
      try {
        const list = await brandService.getAllBrands();
        setBrands(list || []);
      } catch (err: any) {
        toast.error('Failed to load brands.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBrands();
  }, []);

  const handleBrandClick = (brandName: string) => {
    navigate(`/?brand=${encodeURIComponent(brandName)}`);
  };

  return (
    <MainLayout>
      <ShimmerStyle />
      <div className="w-full flex flex-col items-stretch space-y-7 select-none text-left mt-2 max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Breadcrumb */}
        <div className="flex items-center space-x-1.5 text-[10.5px] font-bold text-slate-400">
          <Link to="/" className="hover:text-blue-650 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-700">Brands</span>
        </div>

        {/* Sleek Minimal Header */}
        <div className="relative rounded-[32px] overflow-hidden bg-white border border-slate-100 p-8 md:p-10 flex flex-col justify-between shadow-sm select-none">
          <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-gradient-to-br from-blue-500/8 to-indigo-500/3 blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="space-y-3.5 z-10 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-blue-600 text-[9.5px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Directories</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-905 tracking-tight leading-tight mt-1 font-brand-title">
              Explore by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic font-black">Brands</span>
            </h1>
            <p className="text-[12.5px] text-slate-500 font-semibold leading-relaxed max-w-xl">
              Discover official hardware manufacturers, technology designers, and device architects partnering with NatCart.
            </p>
          </div>
        </div>

        {/* Content Directory Listing */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white border border-slate-100 rounded-[28px] p-6 space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex-shrink-0" />
                <div className="space-y-2.5 flex-grow">
                  <Bone className="h-5 w-24" />
                  <Bone className="h-3.5 w-full" />
                </div>
                <Bone className="h-9 w-full" />
              </div>
            ))}
          </div>
        ) : brands.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-[32px] p-12 text-center shadow-sm max-w-md mx-auto">
            <Tag className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-black text-slate-700 tracking-tight mt-4">No Brands Configured</h3>
            <p className="text-[11.5px] text-slate-455 font-bold mt-1.5 leading-relaxed">
              We are currently onboarding official hardware partners. Please visit us again shortly.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex h-10 px-6 bg-slate-950 hover:bg-slate-900 text-white text-xs font-black rounded-xl items-center justify-center space-x-1.5 transition-all active:scale-95 border-none cursor-pointer"
            >
              <span>Browse Marketplace</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {brands.map((brand) => {
              const initials = brand.name.slice(0, 2).toUpperCase();
              return (
                <div
                  key={brand.brandId}
                  onClick={() => handleBrandClick(brand.name)}
                  className="group relative bg-white border border-slate-150 rounded-[28px] p-6 flex flex-col justify-between hover:shadow-[0_24px_50px_rgba(15,23,42,0.03)] hover:border-slate-350 hover:-translate-y-1 transition-all duration-350 text-left cursor-pointer"
                >
                  <div className="space-y-4.5">
                    {/* Brand Logo Header */}
                    <div className="flex items-center space-x-4">
                      {brand.logoUrl ? (
                        <div className="w-12 h-12 rounded-full border border-slate-100 bg-slate-50/50 flex items-center justify-center p-2 flex-shrink-0 transition-transform duration-350 group-hover:scale-105">
                          <img
                            src={brand.logoUrl}
                            alt={brand.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 text-slate-700 flex items-center justify-center text-[12.5px] font-black flex-shrink-0 transition-transform duration-350 group-hover:scale-105 font-brand-card">
                          {initials}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <h3 className="text-[13.5px] font-black text-slate-800 tracking-wider uppercase leading-tight truncate group-hover:text-blue-600 transition-colors font-brand-card">
                          {brand.name}
                        </h3>
                        {brand.displayId && (
                          <span className="text-[9.5px] text-slate-400 font-bold font-mono tracking-tight mt-0.5">
                            #{brand.displayId}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Brand Description */}
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed line-clamp-3 min-h-[48px] font-brand-card">
                      {brand.description || 'Verified manufacturer partner delivering top-tier components and catalog items.'}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 my-4" />

                  {/* Actions */}
                  <div className="flex items-center justify-between text-slate-800 group-hover:text-blue-655 transition-colors">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-655 transition-colors font-brand-card">Explore Products</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-655 transition-transform group-hover:translate-x-1 duration-300" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </MainLayout>
  );
};

export default Brands;
