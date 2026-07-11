'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ShoppingBag, 
  Plus, 
  X, 
  Search, 
  Filter, 
  Tag, 
  Package, 
  User, 
  DollarSign, 
  ChevronRight,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';

interface CropListing {
  id: string;
  title: string;
  category: 'Grains' | 'Vegetables' | 'Fruits' | 'Exotic';
  description: string;
  price: number;
  quantity: number;
  imageUrl: string;
  sellerName: string;
  createdAt: string;
}

// Zod Schema for validation
const formSchema = z.object({
  title: z.string().min(2, 'Crop name is too short'),
  category: z.enum(['Grains', 'Vegetables', 'Fruits', 'Exotic']),
  price: z.string().min(1, 'Price is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  description: z.string().min(5, 'Provide a description of harvest quality'),
  imageUrl: z.string().optional()
});

type FormInput = z.infer<typeof formSchema>;

const initialListings: CropListing[] = [
  {
    id: 'crop-1',
    title: 'Organic White Maize',
    category: 'Grains',
    description: 'Dry harvested high-grade white maize, fully sun-dried and bag-sealed. Moisture level below 12.5%. Perfect for processing.',
    price: 0.85,
    quantity: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=600&auto=format&fit=crop&q=60',
    sellerName: 'Ibrahim Musa',
    createdAt: '2026-07-09'
  },
  {
    id: 'crop-2',
    title: 'Habanero Pepper (Rodo)',
    category: 'Vegetables',
    description: 'Extra hot, freshly hand-picked habanero peppers. Premium sorting, no bruised peppers included. Available in 25kg crates.',
    price: 3.20,
    quantity: 355,
    imageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=60',
    sellerName: 'Chidi Okafor',
    createdAt: '2026-07-10'
  },
  {
    id: 'crop-3',
    title: 'Sweet Cavendish Bananas',
    category: 'Fruits',
    description: 'Freshly cut banana bunches. Harvested green to allow safe transit. Natural fertilizers only.',
    price: 1.50,
    quantity: 800,
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=60',
    sellerName: 'Funmilayo Adebayo',
    createdAt: '2026-07-11'
  },
  {
    id: 'crop-4',
    title: 'Premium Local Rice (Abakaliki)',
    category: 'Grains',
    description: 'Highly polished, stone-free local white rice. Harvested in Ebonyi State. High swell capacity, packaged in 50kg bags.',
    price: 1.20,
    quantity: 500,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=60',
    sellerName: 'Ibrahim Musa',
    createdAt: '2026-07-10'
  }
];

export default function MarketAccess() {
  const { t, language } = useLanguage();
  
  const [listings, setListings] = useState<CropListing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form setup with React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      quantity: '',
      imageUrl: ''
    }
  });

  // Load listings on mount
  useEffect(() => {
    const saved = localStorage.getItem('agrosense_marketplace_listings_v2');
    if (saved) {
      try {
        setListings(JSON.parse(saved));
      } catch (e) {
        setListings(initialListings);
      }
    } else {
      setListings(initialListings);
      localStorage.setItem('agrosense_marketplace_listings_v2', JSON.stringify(initialListings));
    }
  }, []);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setImagePreview(dataUrl);
          setValue('imageUrl', dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: FormInput) => {
    const defaultImage = 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=600&auto=format&fit=crop&q=60';
    
    const newListing: CropListing = {
      id: Math.random().toString(36).substr(2, 9),
      title: data.title,
      category: data.category,
      description: data.description,
      price: Number(data.price),
      quantity: Number(data.quantity),
      imageUrl: imagePreview || data.imageUrl || defaultImage,
      sellerName: language === 'ha' ? 'Aliyu Gombe' : language === 'ig' ? 'Emeka Nwachukwu' : language === 'yo' ? 'Oluwaseun Babajide' : 'Femi Alabi',
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newListing, ...listings];
    setListings(updated);
    localStorage.setItem('agrosense_marketplace_listings_v2', JSON.stringify(updated));

    // Reset and close
    reset();
    setImagePreview(null);
    setDrawerOpen(false);

    // Trigger toast alert notification
    setNotification(t('formListSuccess'));
    setTimeout(() => setNotification(null), 4000);
  };

  // Filter listings based on category and search query
  const filteredListings = listings.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoriesList = ['All', 'Grains', 'Vegetables', 'Fruits', 'Exotic'];

  const getTranslatedCategoryName = (cat: string) => {
    switch (cat) {
      case 'All': return t('marketCategoryAll');
      case 'Grains': return t('marketCategoryGrains');
      case 'Vegetables': return t('marketCategoryVegetables');
      case 'Fruits': return t('marketCategoryFruits');
      case 'Exotic': return t('marketCategoryExotic');
      default: return cat;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative min-h-[75vh]">
      
      {/* Toast Notification Alert */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-slide-up border border-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            {t('marketTitle')}
          </h1>
          <p className="text-slate-400 text-sm">
            {t('marketSubtitle')}
          </p>
        </div>

        {/* List Harvest floating Button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 px-5 py-3 rounded-xl text-sm font-extrabold shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>{t('marketListBtn')}</span>
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/30 p-4 rounded-xl border border-slate-900">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder={t('marketSearch')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50 text-slate-200"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <Filter className="h-4 w-4 text-slate-500 hidden md:block shrink-0" />
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {getTranslatedCategoryName(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Crops Inventory Grid Wall */}
      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredListings.map((item) => (
            <div 
              key={item.id} 
              className="group relative flex flex-col justify-between border border-slate-900 bg-slate-900/25 rounded-2xl overflow-hidden hover:border-emerald-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              {/* Crop Image */}
              <div className="h-44 relative bg-slate-950 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Category Badge overlay */}
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm border border-slate-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-400">
                  {getTranslatedCategoryName(item.category)}
                </div>
              </div>

              {/* Crop Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-light">
                    {item.description}
                  </p>
                </div>

                {/* Seller, Price & Qty Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-900">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 uppercase">
                      <User className="h-3 w-3" />
                      <span>Seller</span>
                    </span>
                    <span className="text-xs font-semibold text-slate-300 block truncate">{item.sellerName}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 uppercase">
                      <Tag className="h-3 w-3" />
                      <span>{t('price')}</span>
                    </span>
                    <span className="text-sm font-extrabold text-emerald-400">${item.price.toFixed(2)}/kg</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-950">
                  <span className="flex items-center gap-1 font-medium">
                    <Package className="h-3.5 w-3.5 text-slate-500" />
                    <span>{item.quantity} kg {t('quantity')}</span>
                  </span>
                  <span className="text-[10px] text-slate-600">{item.createdAt}</span>
                </div>

                {/* Buy Button */}
                <button
                  onClick={() => alert(`Contacting Seller: ${item.sellerName} for ${item.title}. Chat or secure transactional system link opening.`)}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  <span>{t('marketContactSeller')}</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="glass rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <ShoppingBag className="h-12 w-12 text-slate-600" />
          <h3 className="text-lg font-bold text-slate-200">No Listings Found</h3>
          <p className="text-sm text-slate-500 max-w-sm">No crops found matching your filters. Try listing your own harvest to populate the board!</p>
        </div>
      )}

      {/* Floating List Your Harvest Modal Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Overlay backdrop */}
          <div 
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Drawer body */}
          <div className="relative w-full max-w-md bg-slate-950 border-l border-slate-850 h-full flex flex-col justify-between shadow-2xl p-6 overflow-y-auto animate-slide-left z-10">
            <div>
              {/* Drawer Header */}
              <div className="flex justify-between items-center border-b border-slate-900 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-emerald-450" />
                    <span>{t('formListHarvestTitle')}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Provide precise dimensions of harvest quality and price.</p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Input fields */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                
                {/* Crop Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-350 uppercase tracking-wider block">{t('formCropName')}</label>
                  <input
                    type="text"
                    {...register('title')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-200"
                    placeholder="e.g. Organic Red Tomatoes"
                  />
                  {errors.title && <p className="text-xs text-red-400 font-semibold">{errors.title.message}</p>}
                </div>

                {/* Category Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-355 uppercase tracking-wider block">{t('formSelectCategory')}</label>
                  <select
                    {...register('category')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-200"
                  >
                    <option value="">-- Choose Category --</option>
                    <option value="Grains">{t('marketCategoryGrains')}</option>
                    <option value="Vegetables">{t('marketCategoryVegetables')}</option>
                    <option value="Fruits">{t('marketCategoryFruits')}</option>
                    <option value="Exotic">{t('marketCategoryExotic')}</option>
                  </select>
                  {errors.category && <p className="text-xs text-red-400 font-semibold">{errors.category.message}</p>}
                </div>

                {/* Price & Quantity Grid */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-355 uppercase tracking-wider block">{t('formPrice')}</label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="number"
                        step="0.01"
                        {...register('price')}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-200"
                        placeholder="e.g. 1.25"
                      />
                    </div>
                    {errors.price && <p className="text-xs text-red-400 font-semibold">{errors.price.message}</p>}
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-355 uppercase tracking-wider block">{t('formQuantity')}</label>
                    <input
                      type="number"
                      {...register('quantity')}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-200"
                      placeholder="e.g. 500"
                    />
                    {errors.quantity && <p className="text-xs text-red-400 font-semibold">{errors.quantity.message}</p>}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-355 uppercase tracking-wider block">{t('formDescription')}</label>
                  <textarea
                    rows={4}
                    {...register('description')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-200"
                    placeholder="Describe crop variety, irrigation, NPK status, packaging style, etc."
                  />
                  {errors.description && <p className="text-xs text-red-400 font-semibold">{errors.description.message}</p>}
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-355 uppercase tracking-wider block">Crop Photo / Image</label>
                  <div className="flex gap-4 items-center">
                    <div className="border border-slate-800 rounded-lg h-14 w-14 flex items-center justify-center bg-slate-900 text-slate-500 overflow-hidden shrink-0">
                      {imagePreview ? (
                        <img src={imagePreview} alt="crop preview" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-slate-650" />
                      )}
                    </div>
                    <label className="bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex-1 text-center">
                      <span>Upload Crop Image File</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageFileChange} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/25 mt-4 cursor-pointer"
                >
                  <span>Post Harvest Listing</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
