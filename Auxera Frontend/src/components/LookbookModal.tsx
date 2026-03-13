import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

interface LookbookItem {
  id: string;
  image: string;
  title: string;
  description: string;
  tag: string;
}

const LOOKBOOK_ITEMS: LookbookItem[] = [
  {
    id: 'lb1',
    image: 'https://picsum.photos/seed/lb1/1200/1600',
    title: 'Urban Explorer',
    description: 'Functional pieces designed for the city landscape.',
    tag: 'Spring 2026'
  },
  {
    id: 'lb2',
    image: 'https://picsum.photos/seed/lb2/1200/1600',
    title: 'Minimalist Retreat',
    description: 'Soft textures and neutral tones for ultimate comfort.',
    tag: 'Essentials'
  },
  {
    id: 'lb3',
    image: 'https://picsum.photos/seed/lb3/1200/1600',
    title: 'Modern Craft',
    description: 'Celebrating the beauty of hand-finished details.',
    tag: 'Limited Edition'
  },
  {
    id: 'lb4',
    image: 'https://picsum.photos/seed/lb4/1200/1600',
    title: 'Coastal Breeze',
    description: 'Light linens and breathable fabrics for the summer.',
    tag: 'Summer 2026'
  }
];

interface LookbookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LookbookModal: React.FC<LookbookModalProps> = ({ isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const next = () => setCurrentIndex((prev) => (prev + 1) % LOOKBOOK_ITEMS.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + LOOKBOOK_ITEMS.length) % LOOKBOOK_ITEMS.length);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[300]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[310] flex items-center justify-center p-4 md:p-12 pointer-events-none"
          >
            <div className="w-full max-w-6xl h-full max-h-[85vh] bg-white dark:bg-brand-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row pointer-events-auto relative">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full z-20 text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Image Section */}
              <div className="w-full md:w-1/2 h-1/2 md:h-full relative overflow-hidden bg-brand-100">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                    src={LOOKBOOK_ITEMS[currentIndex].image}
                    alt={LOOKBOOK_ITEMS[currentIndex].title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-8 left-8">
                  <span className="px-4 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[10px] font-bold uppercase tracking-widest text-white">
                    {LOOKBOOK_ITEMS[currentIndex].tag}
                  </span>
                </div>
              </div>

              {/* Content Section */}
              <div className="flex-1 p-8 md:p-16 flex flex-col justify-center relative">
                <div className="space-y-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <h2 className="text-5xl md:text-7xl font-serif font-bold mb-6 dark:text-white leading-tight">
                        {LOOKBOOK_ITEMS[currentIndex].title}
                      </h2>
                      <p className="text-lg md:text-xl text-brand-500 dark:text-brand-400 leading-relaxed max-w-md">
                        {LOOKBOOK_ITEMS[currentIndex].description}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  <div className="pt-12 flex items-center space-x-6">
                    <button
                      onClick={prev}
                      className="p-4 border border-brand-100 dark:border-brand-800 rounded-full hover:bg-brand-50 dark:hover:bg-brand-800 transition-all dark:text-white"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={next}
                      className="p-4 bg-brand-950 dark:bg-white text-white dark:text-brand-950 rounded-full hover:opacity-90 transition-all shadow-xl"
                    >
                      <ArrowRight className="w-6 h-6" />
                    </button>
                    <div className="flex-1" />
                    <div className="text-sm font-mono text-brand-300">
                      {String(currentIndex + 1).padStart(2, '0')} / {String(LOOKBOOK_ITEMS.length).padStart(2, '0')}
                    </div>
                  </div>
                </div>

                {/* Decorative background element */}
                <div className="absolute -bottom-20 -right-20 text-[20rem] font-serif font-bold text-brand-50 dark:text-brand-800/20 -z-10 select-none">
                  {currentIndex + 1}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
