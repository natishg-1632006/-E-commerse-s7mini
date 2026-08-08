import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../../utils/imageHelper';

const ShimmerStyle: React.FC = () => (
  <style>{`
    @keyframes shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position: 600px 0; }
    }
    .ske-base {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 1200px 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }
    .ske-r  { border-radius: 8px; }
    .ske-rp { border-radius: 9999px; }
  `}</style>
);

const Bone: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <div className={`ske-base ske-r ${className}`} style={style} />
);
const BonePill: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`ske-base ske-rp ${className}`} />
);
const BoneCircle: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`ske-base ske-rp ${className}`} />
);

export const CardSkeleton: React.FC = () => (
  <>
    <ShimmerStyle />
    <div className="h-[142px] bg-white border border-slate-100 rounded-[16px] p-5 flex flex-col justify-between shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-grow pr-4">
          <Bone className="h-3.5 w-24" />
          <Bone className="h-3 w-32" />
        </div>
        <BoneCircle className="w-10 h-10 flex-shrink-0" />
      </div>
      <div className="flex items-end justify-between">
        <Bone className="h-8 w-20" />
        <BonePill className="h-5 w-12" />
      </div>
    </div>
  </>
);

export const CustomerStatCardSkeleton: React.FC = () => (
  <>
    <ShimmerStyle />
    <div className="bg-white border border-slate-100 rounded-[16px] p-4 flex items-center justify-between shadow-sm">
      <div className="space-y-2">
        <Bone className="h-3 w-28" />
        <Bone className="h-6 w-20" />
      </div>
      <BoneCircle className="w-10 h-10 flex-shrink-0" />
    </div>
  </>
);

export const FormItemSkeleton: React.FC<{ rows?: number }> = ({ rows = 1 }) => (
  <>
    <ShimmerStyle />
    <div className="space-y-4">
      {[...Array(rows)].map((_, idx) => (
        <div key={idx} className="space-y-2 text-left">
          <Bone className="h-3.5 w-24" />
          <Bone className="h-11 w-full" style={{ borderRadius: 16 }} />
        </div>
      ))}
    </div>
  </>
);

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-40' }) => (
  <>
    <ShimmerStyle />
    <div className={`w-full ${height} flex flex-col`}>
      <div className="flex items-end justify-between gap-2 flex-1 pb-1 px-1">
        {[55, 72, 48, 80, 91, 63, 96].map((pct, i) => (
          <div key={i} className="ske-base flex-1 rounded-t-md" style={{ height: `${pct}%`, animationDelay: `${i * 0.09}s` }} />
        ))}
      </div>
      <div className="flex justify-between gap-2 px-1 pt-2">
        {[...Array(7)].map((_, i) => (
          <Bone key={i} className="h-2.5 flex-1" />
        ))}
      </div>
    </div>
  </>
);

export const DashboardSkeleton: React.FC = () => (
  <>
    <ShimmerStyle />
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(idx => (
          <div key={idx} className="h-[142px] bg-white border border-slate-100 rounded-[16px] p-5 flex flex-col justify-between shadow-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-grow pr-4">
                <Bone className="h-3.5 w-24" />
                <Bone className="h-3 w-32" />
              </div>
              <BoneCircle className="w-10 h-10 flex-shrink-0" />
            </div>
            <div className="flex items-end justify-between">
              <Bone className="h-8 w-20" />
              <BonePill className="h-5 w-12" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col pt-1">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/20">
          <div className="flex items-center space-x-6">
            <Bone className="h-5 w-28" />
            <Bone className="h-5 w-36" />
          </div>
          <Bone className="h-3.5 w-32 hidden sm:block" />
        </div>
        <div className="p-3 sm:p-4 space-y-1.5">
          {[1, 2, 3, 4, 5].map(idx => (
            <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center px-3.5 py-2.5 rounded-xl border border-slate-50 gap-2.5 sm:gap-0">
              <div className="col-span-4 flex items-center space-x-3 w-full">
                <Bone className="w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="flex-grow space-y-1.5">
                  <Bone className="h-3.5 w-3/5" />
                  <Bone className="h-3 w-2/5" />
                </div>
              </div>
              <div className="col-span-2"><Bone className="h-3.5 w-16" /></div>
              <div className="col-span-2"><Bone className="h-4 w-20" /></div>
              <div className="col-span-2"><BonePill className="h-5 w-20" /></div>
              <div className="col-span-1"><Bone className="h-3 w-12" /></div>
              <div className="col-span-1 flex justify-end"><Bone className="h-4 w-4 rounded" /></div>
            </div>
          ))}
        </div>
        <div className="px-4 pb-4 pt-3 flex justify-center border-t border-slate-50">
          <BonePill className="h-8 w-32" />
        </div>
      </div>
    </div>
  </>
);

export const ProductsTableSkeleton: React.FC = () => (
  <>
    <ShimmerStyle />
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col pt-1">
      <div className="hidden sm:grid sm:grid-cols-12 items-center border-b border-slate-100 px-5 py-3 bg-slate-50/20 text-[10px] font-black text-slate-400 uppercase tracking-wider">
        <div className="col-span-3">Product</div>
        <div className="col-span-1 pl-2">Brand</div>
        <div className="col-span-2 pl-2">Category</div>
        <div className="col-span-2 pl-2">Price</div>
        <div className="col-span-1 pl-2">Status</div>
        <div className="col-span-1 pl-2">Featured</div>
        <div className="col-span-2 text-right pr-2">Created Date</div>
      </div>
      <div className="divide-y divide-slate-50 px-3 py-2 sm:p-4 space-y-2 bg-white">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(idx => (
          <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center p-3 rounded-xl border border-slate-50 gap-2.5 sm:gap-0 bg-white">
            <div className="col-span-3 space-y-1.5"><Bone className="h-3.5 w-4/5" /><Bone className="h-2.5 w-1/4" /></div>
            <div className="col-span-1 sm:pl-2"><Bone className="h-3.5 w-12" /></div>
            <div className="col-span-2 sm:pl-2"><Bone className="h-3.5 w-20" /></div>
            <div className="col-span-2 sm:pl-2"><Bone className="h-3.5 w-16" /></div>
            <div className="col-span-1 sm:pl-2"><BonePill className="h-6 w-16" /></div>
            <div className="col-span-1 sm:pl-2"><Bone className="h-4 w-8" /></div>
            <div className="col-span-2 flex justify-end pr-2"><Bone className="h-3.5 w-20" /></div>
          </div>
        ))}
      </div>
    </div>
  </>
);

export const InventoryTableSkeleton: React.FC = () => (
  <>
    <ShimmerStyle />
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col pt-1">
      <div className="hidden sm:grid sm:grid-cols-12 items-center border-b border-slate-100 px-5 py-3 bg-slate-50/20 text-[10px] font-black text-slate-400 uppercase tracking-wider">
        <div className="col-span-1">Image</div>
        <div className="col-span-3 pl-2">Product</div>
        <div className="col-span-1.5 text-center">Available</div>
        <div className="col-span-1.5 text-center">Current</div>
        <div className="col-span-1.5 text-center">Reserved</div>
        <div className="col-span-1.5 text-center">Sold</div>
        <div className="col-span-1.5 text-center">Status</div>
        <div className="col-span-0.5" />
      </div>
      <div className="divide-y divide-slate-50 px-3 py-2 sm:p-4 space-y-2 bg-white">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(idx => (
          <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center p-3 rounded-xl border border-slate-50 gap-2.5 sm:gap-0 bg-white">
            <div className="col-span-1"><Bone className="w-11 h-11 rounded-xl" /></div>
            <div className="col-span-3 sm:pl-2 space-y-1.5"><Bone className="h-4 w-4/5" /><Bone className="h-3 w-1/3" /></div>
            {[0, 1, 2, 3].map(c => (
              <div key={c} className="col-span-1.5 flex justify-center"><Bone className="h-4 w-12" /></div>
            ))}
            <div className="col-span-1.5 flex justify-center"><BonePill className="h-7 w-20" /></div>
            <div className="col-span-0.5" />
          </div>
        ))}
      </div>
    </div>
  </>
);

export const OrdersTableSkeleton: React.FC = () => (
  <>
    <ShimmerStyle />
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col pt-1">
      <div className="hidden xl:grid items-center border-b border-slate-100 px-5 py-3 bg-slate-50/20 text-[10px] font-black text-slate-400 uppercase tracking-wider"
        style={{ gridTemplateColumns: '16% 13% 12% 10% 9% 10% 9% 10% 6% 5%' }}>
        <div>Order ID</div>
        <div>Customer</div>
        <div>Email</div>
        <div>Amount</div>
        <div>Method</div>
        <div>Pay Status</div>
        <div>Items</div>
        <div>Created</div>
        <div className="text-center">Order Status</div>
        <div />
      </div>
      <div className="divide-y divide-slate-50 px-3 py-2 sm:p-4 space-y-2 bg-white">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(idx => (
          <div key={idx} className="flex flex-col xl:grid items-start xl:items-center p-3 rounded-xl border border-slate-50 gap-2.5 xl:gap-0 bg-white"
            style={{ gridTemplateColumns: '16% 13% 12% 10% 9% 10% 9% 10% 6% 5%' }}>
            <div className="flex items-center space-x-2.5">
              <Bone className="w-7 h-7 rounded-lg flex-shrink-0" />
              <Bone className="h-3.5 w-24" />
            </div>
            <div><Bone className="h-3.5 w-20" /></div>
            <div><Bone className="h-3 w-28" /></div>
            <div><Bone className="h-3.5 w-16" /></div>
            <div><Bone className="h-3 w-12" /></div>
            <div><BonePill className="h-5 w-14" /></div>
            <div><Bone className="h-3.5 w-10" /></div>
            <div><Bone className="h-3 w-20" /></div>
            <div className="flex justify-center"><BonePill className="h-6 w-20" /></div>
            <div className="flex justify-end"><Bone className="h-4 w-4 rounded" /></div>
          </div>
        ))}
      </div>
    </div>
  </>
);

export const OrdersKPISkeleton: React.FC = () => (
  <>
    <ShimmerStyle />
    <div 
      className="grid gap-3 transition-all duration-300 ease-in-out" 
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(idx => (
        <div key={idx} className="bg-white border border-slate-100 rounded-[12px] p-3.5 shadow-sm h-[114px] flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <Bone className="h-3 w-16" />
            <Bone className="h-4.5 w-4.5 rounded" />
          </div>
          <div className="space-y-1.5 mt-2">
            <Bone className="h-5 w-24" />
            <Bone className="h-3.5 w-14" />
          </div>
        </div>
      ))}
    </div>
  </>
);

export const OrderDetailsSkeleton: React.FC = () => (
  <>
    <ShimmerStyle />
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white border border-slate-100 rounded-[16px] p-4 shadow-sm space-y-2">
            <Bone className="h-3 w-20" />
            <Bone className="h-7 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left col */}
        <div className="lg:col-span-8 space-y-5">
          {/* Status update card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <Bone className="h-5 w-40" />
            <Bone className="h-3 w-56" />
            <div className="flex gap-2 flex-wrap pt-1">
              {[1, 2, 3, 4, 5, 6, 7].map(i => <BonePill key={i} className="h-8 w-24" />)}
            </div>
          </div>
          {/* Products table */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/20">
              <Bone className="h-3.5 w-36" />
            </div>
            <div className="p-4 space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center space-x-4 p-3 rounded-xl border border-slate-100">
                  <Bone className="w-12 h-12 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2"><Bone className="h-4 w-2/3" /><Bone className="h-3 w-1/4" /></div>
                  <Bone className="h-4 w-16" />
                  <Bone className="h-4 w-16" />
                  <Bone className="h-5 w-20" />
                </div>
              ))}
            </div>
          </div>
          {/* Payment card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <Bone className="h-5 w-40" />
            <div className="grid grid-cols-2 gap-6">
              {[0, 1].map(c => (
                <div key={c} className="space-y-3">
                  {[1, 2, 3].map(r => (
                    <div key={r} className="flex justify-between">
                      <Bone className="h-3 w-24" /><Bone className="h-3 w-20" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Right col */}
        <div className="lg:col-span-4 space-y-5">
          {[0, 1, 2].map(card => (
            <div key={card} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <Bone className="h-4 w-32" />
              <div className="space-y-3">
                {[1, 2, 3].map(r => (
                  <div key={r} className="flex justify-between">
                    <Bone className="h-3 w-20" /><Bone className="h-3 w-24" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);

export const CategoriesTableSkeleton: React.FC = () => (
  <>
    <ShimmerStyle />
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col pt-1">
      <div className="hidden sm:grid sm:grid-cols-12 items-center border-b border-slate-100 px-5 py-3 bg-slate-50/20 text-[10px] font-black text-slate-400 uppercase tracking-wider">
        <div className="col-span-1">Image</div>
        <div className="col-span-2 pl-2">Category</div>
        <div className="col-span-3 pl-2">Description</div>
        <div className="col-span-1.5 text-center">Featured</div>
        <div className="col-span-1.5 text-center">Status</div>
        <div className="col-span-1.5 text-center">Products</div>
        <div className="col-span-1.5 text-right pr-2">Created On</div>
      </div>
      <div className="divide-y divide-slate-50 px-3 py-2 sm:p-4 space-y-2 bg-white">
        {[1, 2, 3, 4, 5, 6].map(idx => (
          <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center p-3 rounded-xl border border-slate-50 gap-2.5 sm:gap-0 bg-white">
            <div className="col-span-1"><Bone className="w-12 h-12 rounded-xl" /></div>
            <div className="col-span-2 sm:pl-2 space-y-1.5"><Bone className="h-4 w-28" /><Bone className="h-3 w-16" /></div>
            <div className="col-span-3 pr-4 space-y-1.5"><Bone className="h-3.5 w-4/5" /><Bone className="h-3 w-2/3" /></div>
            <div className="col-span-1.5 flex justify-center"><Bone className="h-5 w-10" /></div>
            <div className="col-span-1.5 flex justify-center"><BonePill className="h-7 w-20" /></div>
            <div className="col-span-1.5 flex justify-center"><Bone className="h-4 w-16" /></div>
            <div className="col-span-1.5 flex justify-end pr-2"><Bone className="h-3.5 w-20" /></div>
          </div>
        ))}
      </div>
    </div>
  </>
);

export const CustomersTableSkeleton: React.FC = () => (
  <>
    <ShimmerStyle />
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col pt-1">
      <div className="hidden sm:grid sm:grid-cols-12 items-center border-b border-slate-100 px-5 py-3 bg-slate-50/20 text-[10px] font-black text-slate-400 uppercase tracking-wider">
        <div className="col-span-3">Customer Profile</div>
        <div className="col-span-3 pl-2">Contact Details</div>
        <div className="col-span-2 pl-2">Joined Date</div>
        <div className="col-span-1 pl-2">Orders</div>
        <div className="col-span-2 pl-2">Total Spend</div>
        <div className="col-span-1 text-right">Status</div>
      </div>
      <div className="divide-y divide-slate-50 px-3 py-2 sm:p-4 space-y-2 sm:space-y-2.5 bg-white">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(idx => (
          <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center p-3 sm:p-2.5 rounded-xl border border-slate-50 gap-2.5 sm:gap-0 bg-white">
            <div className="col-span-3 flex items-center space-x-2.5 w-full">
              <BoneCircle className="w-8 h-8 flex-shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0"><Bone className="h-3.5 w-4/5" /><Bone className="h-2.5 w-3/5" /></div>
            </div>
            <div className="col-span-3 sm:pl-2"><Bone className="h-3.5 w-32" /></div>
            <div className="col-span-2 sm:pl-2"><Bone className="h-3.5 w-20" /></div>
            <div className="col-span-1 sm:pl-2"><Bone className="h-3.5 w-8" /></div>
            <div className="col-span-2 sm:pl-2"><Bone className="h-4 w-20" /></div>
            <div className="col-span-1 flex justify-end"><BonePill className="h-5 w-16" /></div>
          </div>
        ))}
      </div>
    </div>
  </>
);

export const AnalyticsSkeleton: React.FC = () => (
  <>
    <ShimmerStyle />
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(idx => (
          <div key={idx} className="bg-white border border-slate-100 rounded-[16px] h-[142px] p-4 sm:p-5 flex flex-col justify-between shadow-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-grow pr-4"><Bone className="h-3.5 w-24" /><Bone className="h-3 w-28" /></div>
              <BoneCircle className="w-10 h-10 flex-shrink-0" />
            </div>
            <div className="flex items-end justify-between"><Bone className="h-8 w-20" /><BonePill className="h-5 w-14" /></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <Bone className="h-5 w-40 mb-2" />
          <Bone className="h-3.5 w-56 mb-5" />
          <ChartSkeleton height="h-36" />
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col">
          <Bone className="h-5 w-40 mb-2" />
          <Bone className="h-3.5 w-32 mb-5" />
          <div className="space-y-4 flex-1">
            {[62, 21, 9, 8].map((pct, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <Bone className="h-3.5 w-20" />
                  <Bone className="h-3.5 w-12" />
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <Bone className="h-full" style={{ width: `${pct}%`, borderRadius: 9999 }} />
                </div>
                <div className="flex justify-end mt-1"><Bone className="h-2.5 w-16" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <Bone className="h-5 w-36 mb-2" />
        <Bone className="h-3.5 w-52 mb-5" />
        <ChartSkeleton height="h-36" />
      </div>
    </div>
  </>
);

export const DetailPageSkeleton: React.FC<{ columns?: number }> = ({ columns = 2 }) => (
  <>
    <ShimmerStyle />
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white border border-slate-100 rounded-[24px] p-6 md:p-8 space-y-6 shadow-sm text-left">
          <div className="space-y-2"><Bone className="h-6 w-1/3" /><Bone className="h-3.5 w-1/4" /></div>
          <hr className="border-slate-100" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(columns)].map((_, idx) => (
              <Bone key={idx} className="h-14 w-full" style={{ borderRadius: 16 }} />
            ))}
          </div>
          <Bone className="h-32 w-full" style={{ borderRadius: 16 }} />
        </div>
      </div>
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white border border-slate-100 rounded-[24px] p-6 space-y-5 shadow-sm text-left">
          <Bone className="h-4 w-1/2" />
          <hr className="border-slate-100" />
          <Bone className="h-14 w-full" style={{ borderRadius: 16 }} />
          <Bone className="h-14 w-full" style={{ borderRadius: 16 }} />
        </div>
        <div className="bg-white border border-slate-100 rounded-[24px] p-6 space-y-5 shadow-sm text-left">
          <Bone className="h-4 w-1/2" />
          <hr className="border-slate-100" />
          <div className="space-y-3.5">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="flex justify-between items-center">
                <Bone className="h-3.5 w-1/4" />
                <Bone className="h-3.5 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </>
);

export const CouponsTableSkeleton: React.FC = () => (
  <>
    <ShimmerStyle />
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col pt-1">
      <div className="hidden sm:grid sm:grid-cols-12 items-center border-b border-slate-100 px-6 py-3 bg-slate-50/20 text-[10px] font-black text-slate-400 uppercase tracking-wider">
        <div className="col-span-2">Code</div>
        <div className="col-span-3">Campaign Details</div>
        <div className="col-span-2 text-center">Scope</div>
        <div className="col-span-2 text-center">Min Order Amount</div>
        <div className="col-span-2 text-center">Status</div>
        <div className="col-span-1 text-right pr-4">Actions</div>
      </div>
      <div className="divide-y divide-slate-50 px-3 py-2 sm:p-4 space-y-2 bg-white">
        {[1, 2, 3, 4, 5, 6].map(idx => (
          <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center p-3 rounded-xl border border-slate-50 gap-2.5 sm:gap-0 bg-white">
            <div className="col-span-2 space-y-1.5"><Bone className="h-4.5 w-16" /><Bone className="h-2.5 w-10" /></div>
            <div className="col-span-3 space-y-1.5"><Bone className="h-4 w-3/4" /><Bone className="h-3 w-1/2" /></div>
            <div className="col-span-2 flex justify-center"><BonePill className="h-6 w-16" /></div>
            <div className="col-span-2 flex justify-center"><Bone className="h-4 w-12" /></div>
            <div className="col-span-2 flex justify-center"><BonePill className="h-6 w-14" /></div>
            <div className="col-span-1 flex justify-end pr-4 space-x-1.5">
              <Bone className="w-7 h-7 rounded-lg" />
              <Bone className="w-7 h-7 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
);

export const SafeImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallback?: string;
}> = ({ src, alt, className = '', imgClassName = 'w-full h-full object-contain p-0.5', fallback }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const resolvedSrc = src && src.trim() !== '' ? src : getImageUrl({ name: alt });
  const fallbackSrc = fallback || getImageUrl({ name: alt });

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div className={`relative ${className} bg-slate-50 flex-shrink-0 overflow-hidden`}>
      <ShimmerStyle />
      {!loaded && !error && (
        <div className="absolute inset-0 ske-base" />
      )}
      <img
        src={error ? fallbackSrc : resolvedSrc}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!error) setError(true);
        }}
        className={`${imgClassName} transition-opacity duration-300 ease-in-out ${loaded || error ? 'opacity-100' : 'opacity-0 absolute'}`}
      />
    </div>
  );
};
