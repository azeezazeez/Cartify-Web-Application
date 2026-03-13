import React from 'react';
import { motion } from 'motion/react';
import { Leaf, Recycle, Wind, ShieldCheck } from 'lucide-react';

export const SustainabilityPage: React.FC = () => {
  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto min-h-screen">
      <div className="text-center mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
        >
          <Leaf className="w-3 h-3" />
          <span>Our Commitment</span>
        </motion.div>
        <h1 className="text-6xl font-serif font-bold mb-8 dark:text-white leading-tight">
          Designing for a <br />
          <span className="italic font-normal text-brand-600 dark:text-brand-400">Better Tomorrow.</span>
        </h1>
        <p className="text-xl text-brand-500 max-w-2xl mx-auto leading-relaxed">
          At Auxera, we believe that luxury shouldn't come at the cost of our planet. 
          We are committed to reducing our carbon footprint through ethical sourcing 
          and zero-waste practices.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
        <div className="p-10 bg-brand-50 dark:bg-brand-900 rounded-3xl space-y-6">
          <div className="w-12 h-12 bg-white dark:bg-brand-800 rounded-2xl flex items-center justify-center shadow-sm">
            <Recycle className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-serif font-bold dark:text-white">Circular Design</h3>
          <p className="text-brand-500 leading-relaxed">
            Every product is designed with its end-of-life in mind. We use materials that are 
            either 100% recyclable or fully biodegradable.
          </p>
        </div>
        <div className="p-10 bg-brand-50 dark:bg-brand-900 rounded-3xl space-y-6">
          <div className="w-12 h-12 bg-white dark:bg-brand-800 rounded-2xl flex items-center justify-center shadow-sm">
            <Wind className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-serif font-bold dark:text-white">Carbon Neutral</h3>
          <p className="text-brand-500 leading-relaxed">
            We offset 100% of our carbon emissions from production and shipping through 
            verified reforestation and renewable energy projects.
          </p>
        </div>
        <div className="p-10 bg-brand-50 dark:bg-brand-900 rounded-3xl space-y-6">
          <div className="w-12 h-12 bg-white dark:bg-brand-800 rounded-2xl flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-serif font-bold dark:text-white">Ethical Sourcing</h3>
          <p className="text-brand-500 leading-relaxed">
            We partner exclusively with artisans and factories that provide fair wages, 
            safe working conditions, and respect human rights.
          </p>
        </div>
      </div>

      <div className="relative h-[600px] rounded-3xl overflow-hidden mb-24">
        <img 
          src="https://picsum.photos/seed/nature/1920/1080" 
          alt="Nature" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-12">
          <div className="max-w-2xl text-center text-white space-y-6">
            <h2 className="text-4xl font-serif font-bold">100% Plastic-Free Packaging</h2>
            <p className="text-lg opacity-90">
              By 2026, we aim to have removed all virgin plastics from our supply chain. 
              Currently, 98% of our packaging is made from recycled paper and compostable cornstarch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
